/**
 * network.js - Handles WebSocket client-side communication
 * 
 * This file is responsible for connecting to the WebSocket server,
 * sending the local player's position, and receiving other players' positions.
 */

// WebSocket connection
let socket = null;
let clientId = null;
let isConnected = false;

// Store other players' positions
const otherPlayers = new Map();

// Other player meshes (visual representation)
const otherPlayerMeshes = new Map();

// Configuration
const SERVER_URL = 'ws://localhost:8080';
const RECONNECT_DELAY = 3000; // 3 seconds
const useCharacter = true; // Whether to use character or player model for other players

/**
 * Initialize the network connection
 */
function initNetwork() {
    connectToServer();
    console.log("Network module initialized");
}

/**
 * Connect to the WebSocket server
 */
function connectToServer() {
    try {
        console.log(`Connecting to WebSocket server at ${SERVER_URL}...`);
        socket = new WebSocket(SERVER_URL);
        
        // Connection opened
        socket.onopen = () => {
            console.log('Connected to WebSocket server');
            isConnected = true;
        };
        
        // Listen for messages from the server
        socket.onmessage = (event) => {
            handleServerMessage(event.data);
        };
        
        // Connection closed
        socket.onclose = () => {
            console.log('Disconnected from WebSocket server');
            isConnected = false;
            cleanupOtherPlayers();
            
            // Try to reconnect after a delay
            setTimeout(connectToServer, RECONNECT_DELAY);
        };
        
        // Connection error
        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    } catch (error) {
        console.error('Error connecting to server:', error);
        
        // Try to reconnect after a delay
        setTimeout(connectToServer, RECONNECT_DELAY);
    }
}

/**
 * Handle messages received from the server
 */
function handleServerMessage(message) {
    try {
        const data = JSON.parse(message);
        
        switch (data.type) {
            case 'id':
                // Store the client ID
                clientId = data.id;
                console.log(`Received client ID: ${clientId}`);
                break;
                
            case 'positions':
                // Update other players' positions only if positions data exists
                if (data.positions) {
                    updateOtherPlayers(data.positions);
                } else {
                    console.log('Received positions message with no positions data');
                }
                break;
                
            default:
                console.log(`Unknown message type: ${data.type}`);
        }
    } catch (error) {
        console.error('Error parsing server message:', error);
    }
}

/**
 * Update the positions of other players
 */
function updateOtherPlayers(positions) {
    // Check if positions is valid
    if (!positions || typeof positions !== 'object') {
        console.warn('Invalid positions data received:', positions);
        return;
    }
    
    try {
        // Store the new positions
        for (const [id, position] of Object.entries(positions)) {
            // Skip the local player
            if (id !== clientId) {
                otherPlayers.set(id, {
                    x: position.x,
                    y: position.y,
                    z: position.z,
                    rotation: position.rotation || 0,
                    animation: position.animation || 'idle'
                });
            }
        }
        
        // Update visual representations
        updateOtherPlayerMeshes();
    } catch (error) {
        console.error('Error updating other players:', error);
    }
}

/**
 * Send the local player's position to the server
 */
function sendPlayerPosition(position) {
    if (isConnected && socket && socket.readyState === WebSocket.OPEN) {
        const message = {
            type: 'position',
            position: {
                x: position.x,
                y: position.y,
                z: position.z,
                rotation: position.rotation || 0,
                animation: position.animation || 'idle'
            }
        };
        
        socket.send(JSON.stringify(message));
    }
}

/**
 * Update the positions of other player meshes
 */
function updateOtherPlayerMeshes() {
    // Create meshes for new players
    otherPlayers.forEach((position, id) => {
        if (!otherPlayerMeshes.has(id)) {
            let mesh;
            
            // Create appropriate mesh based on game mode
            if (useCharacter && window.character) {
                mesh = window.character.createOtherCharacterMesh();
            } else {
                mesh = window.player.createOtherPlayerMesh();
            }
            
            otherPlayerMeshes.set(id, {
                mesh: mesh,
                lastAnimation: 'idle'
            });
        }
        
        // Update the position and rotation
        const playerData = otherPlayerMeshes.get(id);
        if (playerData && playerData.mesh) {
            playerData.mesh.position.set(position.x, position.y, position.z);
            
            // Apply rotation if available
            if (position.rotation !== undefined) {
                // Create a rotation quaternion from the y-axis rotation
                const quaternion = new THREE.Quaternion();
                quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), position.rotation);
                playerData.mesh.quaternion.copy(quaternion);
            }
            
            // Update animation if it changed
            if (position.animation && position.animation !== playerData.lastAnimation) {
                // In a real implementation, we would play the animation here
                console.log(`Player ${id} animation changed to: ${position.animation}`);
                playerData.lastAnimation = position.animation;
            }
        }
    });
    
    // Remove meshes for disconnected players
    otherPlayerMeshes.forEach((playerData, id) => {
        if (!otherPlayers.has(id)) {
            // Get the scene
            const scene = window.gameScene.getScene();
            
            // Remove from the scene
            scene.remove(playerData.mesh);
            
            // Remove from the map
            otherPlayerMeshes.delete(id);
        }
    });
}

/**
 * Clean up other player meshes
 */
function cleanupOtherPlayers() {
    // Get the scene
    const scene = window.gameScene.getScene();
    
    // Remove all other player meshes
    otherPlayerMeshes.forEach((playerData, id) => {
        scene.remove(playerData.mesh);
    });
    
    // Clear the maps
    otherPlayerMeshes.clear();
    otherPlayers.clear();
}

/**
 * Update network state
 */
function updateNetwork() {
    // Update other player meshes
    updateOtherPlayerMeshes();
}

// Export network functions for use in other modules
window.network = {
    initNetwork,
    updateNetwork,
    sendPlayerPosition,
    isConnected: () => isConnected,
    getClientId: () => clientId,
    getOtherPlayers: () => otherPlayers
}; 