/**
 * debug.js - Debugging utilities for Diwar Climb
 * 
 * This file provides debugging tools to help identify and fix issues
 * with the game, particularly rendering problems.
 */

// Debug flags
const DEBUG = {
    showFPS: true,
    logSceneInfo: true,
    showAxesHelpers: true,
    showGridHelper: true
};

// Debug UI elements
let fpsElement;
let debugContainer;

// FPS tracking
let frameCount = 0;
let lastTime = performance.now();
let fps = 0;

/**
 * Initialize debugging tools
 */
function initDebug() {
    console.log("Initializing debug tools...");
    
    // Create debug container
    debugContainer = document.createElement('div');
    debugContainer.id = 'debug-container';
    debugContainer.style.position = 'absolute';
    debugContainer.style.top = '10px';
    debugContainer.style.right = '10px';
    debugContainer.style.color = 'yellow';
    debugContainer.style.fontFamily = 'monospace';
    debugContainer.style.fontSize = '14px';
    debugContainer.style.textShadow = '1px 1px 2px black';
    debugContainer.style.userSelect = 'none';
    debugContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    debugContainer.style.padding = '5px';
    debugContainer.style.borderRadius = '5px';
    document.body.appendChild(debugContainer);
    
    // Create FPS counter
    if (DEBUG.showFPS) {
        fpsElement = document.createElement('div');
        fpsElement.id = 'fps-counter';
        debugContainer.appendChild(fpsElement);
    }
    
    // Add axes helpers to the scene
    if (DEBUG.showAxesHelpers) {
        const scene = window.gameScene.getScene();
        const axesHelper = new THREE.AxesHelper(5);
        scene.add(axesHelper);
        console.log("Added axes helper to scene");
    }
    
    // Add grid helper to the scene
    if (DEBUG.showGridHelper) {
        const scene = window.gameScene.getScene();
        const gridHelper = new THREE.GridHelper(20, 20);
        scene.add(gridHelper);
        console.log("Added grid helper to scene");
    }
    
    // Log scene information
    if (DEBUG.logSceneInfo) {
        logSceneInfo();
    }
    
    // Add keyboard shortcut for toggling debug info
    window.addEventListener('keydown', (event) => {
        if (event.key === 'd' || event.key === 'D') {
            toggleDebugVisibility();
        }
    });
    
    console.log("Debug tools initialized. Press 'D' to toggle debug display.");
}

/**
 * Update debug information
 */
function updateDebug() {
    // Update FPS counter
    if (DEBUG.showFPS) {
        frameCount++;
        const currentTime = performance.now();
        const elapsed = currentTime - lastTime;
        
        if (elapsed >= 1000) {
            fps = Math.round((frameCount * 1000) / elapsed);
            frameCount = 0;
            lastTime = currentTime;
            
            fpsElement.textContent = `FPS: ${fps}`;
        }
    }
}

/**
 * Log information about the scene
 */
function logSceneInfo() {
    const scene = window.gameScene.getScene();
    const camera = window.gameScene.getCamera();
    const renderer = window.gameScene.getRenderer();
    
    console.group("Scene Information");
    console.log("Scene children:", scene.children.length);
    console.log("Camera position:", camera.position);
    console.log("Camera rotation:", camera.rotation);
    console.log("Renderer:", renderer);
    console.log("WebGL context:", renderer.getContext());
    console.groupEnd();
    
    // Check for WebGL errors
    const gl = renderer.getContext();
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
        console.error("WebGL error:", error);
    }
}

/**
 * Toggle visibility of debug elements
 */
function toggleDebugVisibility() {
    if (debugContainer.style.display === 'none') {
        debugContainer.style.display = 'block';
        console.log("Debug display enabled");
    } else {
        debugContainer.style.display = 'none';
        console.log("Debug display disabled");
    }
}

// Export debug functions
window.debug = {
    initDebug,
    updateDebug,
    logSceneInfo
}; 