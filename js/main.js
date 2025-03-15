/**
 * main.js - Main entry point for the game
 * 
 * This file is responsible for initializing the game and handling the loading screen.
 */

// Track loading progress
let loadingProgress = 0;
const TOTAL_LOADING_STEPS = 8; // Increased to include module verification

// Track module initialization status
const modules = {
    gameScene: false,
    physics: false,
    environment: false,
    player: false,
    character: false,
    tiles: false,
    ui: false,
    network: false,
    debug: false
};

/**
 * Initialize the game
 */
function initGame() {
    console.log("Initializing Diwar Climb...");
    
    // Show loading screen
    showLoadingScreen();
    
    // Verify that all required modules are available
    verifyModules();
    
    // Initialize modules in sequence with simulated loading
    setTimeout(() => initializeScene(), 500);
}

/**
 * Verify that all required modules are available
 */
function verifyModules() {
    updateLoadingProgress(0.5, "Verifying modules...");
    
    // Check for required modules
    const requiredModules = ['gameScene', 'physics', 'player', 'tiles'];
    let missingModules = [];
    
    requiredModules.forEach(module => {
        if (!window[module]) {
            missingModules.push(module);
            console.error(`Required module '${module}' is missing!`);
        }
    });
    
    // Check for optional modules
    const optionalModules = ['environment', 'character', 'ui', 'network', 'debug'];
    optionalModules.forEach(module => {
        if (!window[module]) {
            console.warn(`Optional module '${module}' is not available.`);
        } else {
            modules[module] = true;
        }
    });
    
    // If any required modules are missing, show an error
    if (missingModules.length > 0) {
        const errorMessage = `Missing required modules: ${missingModules.join(', ')}`;
        alert(`Error: ${errorMessage}. The game cannot start.`);
        console.error(errorMessage);
        return;
    }
    
    console.log("Module verification complete");
}

/**
 * Show the loading screen
 */
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingBar = document.getElementById('loading-bar');
    
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
    }
    
    if (loadingBar) {
        loadingBar.style.width = '0%';
    }
}

/**
 * Update the loading progress
 */
function updateLoadingProgress(step, message) {
    loadingProgress = (step / TOTAL_LOADING_STEPS) * 100;
    
    const loadingBar = document.getElementById('loading-bar');
    const loadingMessage = document.getElementById('loading-message');
    
    if (loadingBar) {
        loadingBar.style.width = `${loadingProgress}%`;
    }
    
    if (loadingMessage && message) {
        loadingMessage.textContent = message;
    }
    
    console.log(`Loading: ${message} (${loadingProgress.toFixed(0)}%)`);
}

/**
 * Hide the loading screen
 */
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    
    if (loadingScreen) {
        // Fade out the loading screen
        loadingScreen.style.opacity = '0';
        loadingScreen.style.transition = 'opacity 1s';
        
        // Remove it after the transition
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 1000);
    }
}

/**
 * Initialize the scene
 */
function initializeScene() {
    updateLoadingProgress(1, "Initializing scene...");
    
    try {
        window.gameScene.initScene();
        modules.gameScene = true;
        console.log("Scene module initialized successfully");
    } catch (error) {
        console.error("Error initializing scene module:", error);
    }
    
    setTimeout(() => initializePhysics(), 500);
}

/**
 * Initialize the physics
 */
function initializePhysics() {
    updateLoadingProgress(2, "Setting up physics...");
    
    try {
        window.physics.initPhysics();
        modules.physics = true;
        console.log("Physics module initialized successfully");
    } catch (error) {
        console.error("Error initializing physics module:", error);
    }
    
    setTimeout(() => initializeEnvironment(), 500);
}

/**
 * Initialize the environment
 */
function initializeEnvironment() {
    updateLoadingProgress(3, "Creating city environment...");
    
    if (window.environment) {
        try {
            window.environment.initEnvironment();
            modules.environment = true;
            console.log("Environment module initialized successfully");
        } catch (error) {
            console.error("Error initializing environment module:", error);
        }
    }
    
    setTimeout(() => initializePlayer(), 500);
}

/**
 * Initialize the player
 */
function initializePlayer() {
    updateLoadingProgress(4, "Creating player...");
    
    try {
        window.player.initPlayer();
        modules.player = true;
        console.log("Player module initialized successfully");
    } catch (error) {
        console.error("Error initializing player module:", error);
    }
    
    setTimeout(() => initializeCharacter(), 500);
}

/**
 * Initialize the character
 */
function initializeCharacter() {
    updateLoadingProgress(5, "Loading character model...");
    
    if (window.character) {
        try {
            console.log("Starting character initialization...");
            const result = window.character.initCharacter();
            if (result) {
                modules.character = true;
                console.log("Character module initialization started successfully");
            } else {
                console.warn("Character initialization returned false");
            }
        } catch (error) {
            console.error("Error initializing character module:", error);
        }
    } else {
        console.warn("Character module not found!");
    }
    
    setTimeout(() => initializeTiles(), 1000); // Increased timeout to allow character model to load
}

/**
 * Initialize the tiles
 */
function initializeTiles() {
    updateLoadingProgress(6, "Generating world...");
    
    try {
        window.tiles.initTiles();
        modules.tiles = true;
        console.log("Tiles module initialized successfully");
    } catch (error) {
        console.error("Error initializing tiles module:", error);
    }
    
    // Initialize UI separately
    setTimeout(() => initializeUI(), 300);
}

/**
 * Initialize the UI
 */
function initializeUI() {
    updateLoadingProgress(6.5, "Setting up user interface...");
    
    if (window.ui) {
        try {
            window.ui.initUI();
            modules.ui = true;
            console.log("UI module initialized successfully");
        } catch (error) {
            console.error("Error initializing UI module:", error);
        }
    } else {
        console.warn("UI module not found!");
    }
    
    setTimeout(() => initializeNetwork(), 300);
}

/**
 * Initialize the network
 */
function initializeNetwork() {
    updateLoadingProgress(7, "Connecting to server...");
    
    if (window.network) {
        try {
            window.network.initNetwork();
            modules.network = true;
            console.log("Network module initialized successfully");
        } catch (error) {
            console.error("Error initializing network module:", error);
        }
    }
    
    // Start the game after a short delay
    setTimeout(() => startGame(), 1000);
}

/**
 * Start the game
 */
function startGame() {
    console.log("Starting game...");
    
    // Hide the loading screen
    hideLoadingScreen();
    
    // Initialize debug tools if available
    if (window.debug) {
        try {
            window.debug.initDebug();
            modules.debug = true;
        } catch (error) {
            console.error("Error initializing debug module:", error);
        }
    }
    
    // Log initialization status
    console.log("Module initialization status:", modules);
    
    // Check if required modules are initialized
    const requiredModules = ['gameScene', 'physics', 'player', 'tiles'];
    const uninitializedModules = requiredModules.filter(module => !modules[module]);
    
    if (uninitializedModules.length > 0) {
        const errorMessage = `Required modules not initialized: ${uninitializedModules.join(', ')}`;
        alert(`Error: ${errorMessage}. The game cannot start.`);
        console.error(errorMessage);
        return;
    }
    
    // Start the game
    window.gameScene.startGame();
    
    console.log("Game started successfully!");
}

// Initialize the game when the window loads
window.addEventListener('load', initGame); 