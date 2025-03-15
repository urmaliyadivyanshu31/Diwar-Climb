/**
 * debug.js - Debug tools for development
 * 
 * This file provides debugging tools for development, including FPS counter,
 * physics visualization, and other helpful information.
 */

// Debug state
let isDebugEnabled = true;
let debugContainer;
let debugLastTime = 0;
let debugFrameCount = 0;
let fps = 0;

/**
 * Create the debug container
 */
function createDebugContainer() {
    // Create debug container if it doesn't exist
    if (!debugContainer) {
        debugContainer = document.createElement('div');
        debugContainer.id = 'debug-container';
        debugContainer.style.position = 'absolute';
        debugContainer.style.top = '10px';
        debugContainer.style.left = '10px';
        debugContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        debugContainer.style.color = 'white';
        debugContainer.style.padding = '10px';
        debugContainer.style.borderRadius = '5px';
        debugContainer.style.fontFamily = 'monospace';
        debugContainer.style.fontSize = '12px';
        debugContainer.style.zIndex = '1000';
        debugContainer.style.maxHeight = '80vh';
        debugContainer.style.overflowY = 'auto';
        debugContainer.style.display = isDebugEnabled ? 'block' : 'none';
        
        document.body.appendChild(debugContainer);
    }
}

/**
 * Add FPS counter to debug container
 */
function addFpsCounter(container) {
    const fpsSection = document.createElement('div');
    fpsSection.className = 'debug-section';
    fpsSection.innerHTML = `
        <h3>Performance</h3>
        <p>FPS: <span id="fps-counter">0</span></p>
    `;
    
    container.appendChild(fpsSection);
}

/**
 * Update FPS counter
 */
function updateFpsCounter(deltaTime) {
    debugFrameCount++;
    
    // Update FPS every second
    if (performance.now() - debugLastTime >= 1000) {
        fps = Math.round(debugFrameCount * 1000 / (performance.now() - debugLastTime));
        debugFrameCount = 0;
        debugLastTime = performance.now();
        
        // Update FPS counter
        const fpsCounter = document.getElementById('fps-counter');
        if (fpsCounter) {
            fpsCounter.textContent = fps;
            
            // Color code based on performance
            if (fps >= 55) {
                fpsCounter.style.color = '#4CAF50'; // Green
            } else if (fps >= 30) {
                fpsCounter.style.color = '#FFC107'; // Yellow
            } else {
                fpsCounter.style.color = '#F44336'; // Red
            }
        }
    }
}

/**
 * Add physics debug information
 */
function addPhysicsDebug(container) {
    const physicsSection = document.createElement('div');
    physicsSection.className = 'debug-section';
    physicsSection.innerHTML = `
        <h3>Physics</h3>
        <p>Bodies: <span id="physics-bodies">0</span></p>
        <p>Contacts: <span id="physics-contacts">0</span></p>
    `;
    
    container.appendChild(physicsSection);
}

/**
 * Update physics debug information
 */
function updatePhysicsDebug() {
    if (!window.physics || !window.physics.getWorld) {
        return;
    }
    
    const world = window.physics.getWorld();
    
    // Update physics bodies count
    const bodiesCounter = document.getElementById('physics-bodies');
    if (bodiesCounter) {
        bodiesCounter.textContent = world.bodies.length;
    }
    
    // Update contacts count
    const contactsCounter = document.getElementById('physics-contacts');
    if (contactsCounter) {
        contactsCounter.textContent = world.contacts.length;
    }
}

/**
 * Add toggle button for debug panel
 */
function addToggleButton() {
    const toggleButton = document.createElement('button');
    toggleButton.id = 'debug-toggle';
    toggleButton.textContent = 'Debug';
    toggleButton.style.position = 'absolute';
    toggleButton.style.top = '10px';
    toggleButton.style.right = '10px';
    toggleButton.style.zIndex = '1001';
    toggleButton.style.padding = '5px 10px';
    toggleButton.style.backgroundColor = '#333';
    toggleButton.style.color = 'white';
    toggleButton.style.border = 'none';
    toggleButton.style.borderRadius = '3px';
    toggleButton.style.cursor = 'pointer';
    
    toggleButton.addEventListener('click', toggleDebugVisibility);
    
    document.body.appendChild(toggleButton);
}

/**
 * Toggle debug panel visibility
 */
function toggleDebugVisibility() {
    if (debugContainer) {
        debugContainer.style.display = debugContainer.style.display === 'none' ? 'block' : 'none';
    }
}

/**
 * Log scene information
 */
function logSceneInfo() {
    if (!window.gameScene || !window.gameScene.getScene) {
        console.warn("Scene not available");
        return;
    }
    
    const scene = window.gameScene.getScene();
    
    console.log("Scene Information:");
    console.log("- Objects:", scene.children.length);
    console.log("- Visible Objects:", scene.children.filter(obj => obj.visible).length);
    
    // Count by object type
    const objectTypes = {};
    scene.traverse(obj => {
        const type = obj.type;
        objectTypes[type] = (objectTypes[type] || 0) + 1;
    });
    
    console.log("- Object Types:", objectTypes);
}

/**
 * Check if debug is enabled
 */
function isEnabled() {
    return isDebugEnabled; // Always enabled for now, could be made configurable later
}

/**
 * Add character animation debugging
 */
function addCharacterDebug(debugContainer) {
    if (!window.character) {
        console.warn("Character module not available for debugging");
        return;
    }
    
    // Create character debug section
    const characterSection = document.createElement('div');
    characterSection.className = 'debug-section';
    characterSection.innerHTML = `
        <h3>Character Debug</h3>
        <div id="character-debug-info">
            <p>Initialized: <span id="character-initialized">Unknown</span></p>
            <p>Current Animation: <span id="character-animation">None</span></p>
            <p>Position: <span id="character-position">0, 0, 0</span></p>
            <p>Rotation: <span id="character-rotation">0</span></p>
        </div>
        <div id="character-animation-controls">
            <button id="debug-anim-idle">Idle</button>
            <button id="debug-anim-walk">Walk</button>
            <button id="debug-anim-run">Run</button>
            <button id="debug-anim-jump">Jump</button>
            <button id="debug-anim-fall">Fall</button>
        </div>
    `;
    
    debugContainer.appendChild(characterSection);
    
    // Add event listeners to animation buttons
    document.getElementById('debug-anim-idle').addEventListener('click', () => {
        forceCharacterAnimation('idle');
    });
    
    document.getElementById('debug-anim-walk').addEventListener('click', () => {
        forceCharacterAnimation('walk');
    });
    
    document.getElementById('debug-anim-run').addEventListener('click', () => {
        forceCharacterAnimation('run');
    });
    
    document.getElementById('debug-anim-jump').addEventListener('click', () => {
        forceCharacterAnimation('jump');
    });
    
    document.getElementById('debug-anim-fall').addEventListener('click', () => {
        forceCharacterAnimation('fall');
    });
}

/**
 * Force a specific character animation for debugging
 */
function forceCharacterAnimation(animationName) {
    if (!window.character || !window.character.isInitialized || !window.character.isInitialized()) {
        console.warn("Character not initialized, cannot force animation");
        return;
    }
    
    console.log(`Debug: Forcing character animation to ${animationName}`);
    
    // Override movement state for testing
    if (window.player && window.player.getMovementState) {
        const state = window.player.getMovementState();
        
        // Reset all states
        state.moving = false;
        state.running = false;
        state.jumping = false;
        state.falling = false;
        
        // Set the appropriate state
        switch (animationName) {
            case 'walk':
                state.moving = true;
                break;
            case 'run':
                state.moving = true;
                state.running = true;
                break;
            case 'jump':
                state.jumping = true;
                break;
            case 'fall':
                state.falling = true;
                break;
        }
    }
}

/**
 * Update character debug info
 */
function updateCharacterDebug() {
    if (!window.character) {
        return;
    }
    
    // Update character debug info
    const initializedElement = document.getElementById('character-initialized');
    if (initializedElement) {
        initializedElement.textContent = window.character.isInitialized ? 
            (window.character.isInitialized() ? 'Yes' : 'No') : 'Unknown';
    }
    
    // Get current animation
    const animationElement = document.getElementById('character-animation');
    if (animationElement && window.player && window.player.getPlayerBody) {
        const playerBody = window.player.getPlayerBody();
        animationElement.textContent = playerBody && playerBody.animation ? 
            playerBody.animation : 'None';
    }
    
    // Get character position
    const positionElement = document.getElementById('character-position');
    if (positionElement && window.player && window.player.getPlayerPosition) {
        const position = window.player.getPlayerPosition();
        positionElement.textContent = position ? 
            `${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}` : 
            '0, 0, 0';
    }
    
    // Get character rotation
    const rotationElement = document.getElementById('character-rotation');
    if (rotationElement && window.player && window.player.getPlayerBody) {
        const playerBody = window.player.getPlayerBody();
        rotationElement.textContent = playerBody && playerBody.rotation ? 
            playerBody.rotation.toFixed(2) : '0';
    }
}

/**
 * Initialize debug tools
 */
function initDebug() {
    console.log("Initializing debug tools...");
    
    // Create debug container
    createDebugContainer();
    
    // Add FPS counter
    addFpsCounter(debugContainer);
    
    // Add physics debug
    addPhysicsDebug(debugContainer);
    
    // Add character debug
    addCharacterDebug(debugContainer);
    
    // Add toggle button
    addToggleButton();
    
    console.log("Debug tools initialized");
}

/**
 * Update debug information
 */
function updateDebug(deltaTime) {
    if (!isDebugEnabled) {
        return;
    }
    
    // Update FPS counter
    updateFpsCounter(deltaTime);
    
    // Update physics debug
    updatePhysicsDebug();
    
    // Update character debug
    updateCharacterDebug();
}

// Add getMovementState function to player.js
if (window.player && !window.player.getMovementState) {
    window.player.getMovementState = function() {
        return window.player.movementState || {
            moving: false,
            running: false,
            jumping: false,
            falling: false
        };
    };
}

// Export debug functions
window.debug = {
    initDebug,
    updateDebug,
    isEnabled: () => isDebugEnabled,
    toggleDebug: toggleDebugVisibility,
    forceCharacterAnimation,
    logSceneInfo
}; 