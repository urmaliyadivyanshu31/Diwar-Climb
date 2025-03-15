/**
 * server.js - Express server and WebSocket server for Diwar Climb
 * 
 * This file sets up an Express server to serve static files and a WebSocket server
 * for multiplayer functionality.
 */

// Import required modules
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

// Configuration
const PORT = process.env.PORT || 8080;
const BROADCAST_INTERVAL = 33; // ~30 FPS

// Create Express app
const app = express();

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Create HTTP server using the Express app
const server = http.createServer(app);

// Create WebSocket server attached to the HTTP server
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Map();
let nextClientId = 1;

// Store player positions
const playerPositions = new Map();

// Log server start
console.log(`Starting server on port ${PORT}...`);

// Handle new WebSocket client connections
wss.on('connection', (socket) => {
    // Assign a unique ID to this client
    const clientId = nextClientId++;
    
    // Store the client
    clients.set(clientId, {
        ws: socket,
        position: { x: 0, y: 0, z: 0, rotation: 0, animation: 'idle' }
    });
    
    console.log(`Client ${clientId} connected. Total clients: ${clients.size}`);
    
    // Send the client their ID
    socket.send(JSON.stringify({
        type: 'id',
        id: clientId
    }));
    
    // Handle messages from this client
    socket.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'position') {
                // Update the client's position
                clients.get(clientId).position = data.position;
            }
        } catch (error) {
            console.error(`Error processing message from client ${clientId}:`, error);
        }
    });
    
    // Handle client disconnection
    socket.on('close', () => {
        // Remove the client
        clients.delete(clientId);
        console.log(`Client ${clientId} disconnected. Total clients: ${clients.size}`);
    });
    
    // Handle errors
    socket.on('error', (error) => {
        console.error(`Error with client ${clientId}:`, error);
        
        // Remove the client if still in the map
        if (clients.has(clientId)) {
            clients.delete(clientId);
            console.log(`Client ${clientId} removed due to error. Total clients: ${clients.size}`);
        }
    });
});

// Broadcast player positions to all clients at regular intervals
setInterval(() => {
    if (clients.size > 0) {
        // Collect all client positions
        const positions = {};
        
        clients.forEach((client, id) => {
            positions[id] = client.position;
        });
        
        // Create the broadcast message
        const message = JSON.stringify({
            type: 'positions',
            positions: positions
        });
        
        // Send to all connected clients
        clients.forEach((client) => {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(message);
            }
        });
    }
}, BROADCAST_INTERVAL);

// Start the server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('WebSocket server ready for connections');
});

// Handle server errors
wss.on('error', (error) => {
    console.error('Server error:', error);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('Server shutting down...');
    
    // Close all client connections
    wss.clients.forEach((client) => {
        client.terminate();
    });
    
    // Close the server
    wss.close(() => {
        console.log('Server shut down');
        process.exit(0);
    });
}); 