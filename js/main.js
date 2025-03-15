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
    debug: false,
    analytics: false
};

// Loading tips to display during loading
const loadingTips = [
    "Use SHIFT while moving to run faster!",
    "Jump between tiles to climb higher and score more points!",
    "Watch your health - falling off tiles will damage you!",
    "The higher you climb, the more points you'll earn!",
    "Press 'H' to toggle the controls display",
    "Press 'F' to show the FPS counter",
    "Press 'R' to restart the game at any time",
    "Reach height milestones for bonus points!",
    "Your high score is saved between sessions"
];
let currentTipIndex = 0;
let tipInterval;

/**
 * Load a script dynamically
 * @param {string} url - URL of the script to load
 * @param {Function} onSuccess - Callback when script loads successfully
 * @param {Function} onError - Callback when script fails to load
 */
function loadScript(url, onSuccess, onError) {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    
    script.onload = function() {
        console.log(`Script loaded: ${url}`);
        if (typeof onSuccess === 'function') {
            onSuccess();
        }
    };
    
    script.onerror = function(error) {
        console.error(`Error loading script: ${url}`, error);
        if (typeof onError === 'function') {
            onError(error);
        }
    };
    
    document.head.appendChild(script);
}

/**
 * Show an error message to the user
 * @param {string} message - Error message to display
 */
function showError(message) {
    // Hide loading screen if it's visible
    hideLoadingScreen();
    
    // Create error container if it doesn't exist
    if (!document.getElementById('error-container')) {
        const errorContainer = document.createElement('div');
        errorContainer.id = 'error-container';
        errorContainer.style.position = 'fixed';
        errorContainer.style.top = '50%';
        errorContainer.style.left = '50%';
        errorContainer.style.transform = 'translate(-50%, -50%)';
        errorContainer.style.backgroundColor = 'rgba(200, 0, 0, 0.9)';
        errorContainer.style.color = 'white';
        errorContainer.style.padding = '20px';
        errorContainer.style.borderRadius = '10px';
        errorContainer.style.fontFamily = 'Arial, sans-serif';
        errorContainer.style.zIndex = '1000';
        errorContainer.style.textAlign = 'center';
        errorContainer.style.maxWidth = '80%';
        
        document.body.appendChild(errorContainer);
    }
    
    // Update error message
    const errorContainer = document.getElementById('error-container');
    errorContainer.innerHTML = `
        <h3>Error</h3>
        <p>${message}</p>
        <button onclick="location.reload()">Refresh Page</button>
    `;
    
    // Log error to console
    console.error(`Game Error: ${message}`);
    
    // Track error if analytics is available
    if (modules.analytics && window.gameAnalytics) {
        window.gameAnalytics.trackEvent('fatal_error', { message });
    }
}

/**
 * Initialize the game
 */
function initGame() {
    console.log("Initializing Diwar Climb...");
    
    // Show loading screen
    showLoadingScreen();
    
    // Start cycling through tips
    startTipCycle();
    
    // Initialize analytics if available
    if (window.gameAnalytics) {
        try {
            window.gameAnalytics.init();
            modules.analytics = true;
            console.log("Analytics module initialized successfully");
        } catch (error) {
            console.error("Error initializing analytics module:", error);
        }
    }
    
    // Verify that all required modules are available
    verifyModules();
    
    // Initialize modules in sequence with simulated loading
    setTimeout(() => initializeModules(), 500);
}

/**
 * Start cycling through loading tips
 */
function startTipCycle() {
    // Set initial tip
    updateLoadingTip(loadingTips[currentTipIndex]);
    
    // Cycle through tips every 4 seconds
    tipInterval = setInterval(() => {
        currentTipIndex = (currentTipIndex + 1) % loadingTips.length;
        updateLoadingTip(loadingTips[currentTipIndex]);
    }, 4000);
}

/**
 * Update the loading tip
 */
function updateLoadingTip(tip) {
    const tipElement = document.getElementById('loading-tips');
    if (tipElement) {
        // Fade out, update text, fade in
        tipElement.style.opacity = '0';
        
        setTimeout(() => {
            tipElement.textContent = tip;
            tipElement.style.opacity = '0.7';
        }, 300);
    }
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
    const optionalModules = ['environment', 'character', 'ui', 'network', 'debug', 'gameAnalytics'];
    optionalModules.forEach(module => {
        if (!window[module]) {
            console.warn(`Optional module '${module}' is not available.`);
        } else if (module === 'gameAnalytics') {
            modules.analytics = true;
        } else {
            modules[module] = true;
        }
    });
    
    // If any required modules are missing, show an error
    if (missingModules.length > 0) {
        const errorMessage = `Missing required modules: ${missingModules.join(', ')}`;
        alert(`Error: ${errorMessage}. The game cannot start.`);
        console.error(errorMessage);
        
        // Track error if analytics is available
        if (modules.analytics && window.gameAnalytics) {
            window.gameAnalytics.trackEvent('initialization_error', {
                error: errorMessage,
                missingModules: missingModules.join(',')
            });
        }
        
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
        loadingScreen.style.opacity = '1';
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
        // Fade out, update text, fade in
        loadingMessage.style.opacity = '0';
        
        setTimeout(() => {
            loadingMessage.textContent = message;
            loadingMessage.style.opacity = '1';
        }, 200);
    }
    
    console.log(`Loading: ${message} (${loadingProgress.toFixed(0)}%)`);
    
    // Track loading progress at key points if analytics is available
    if ((step === 1 || step === 4 || step === 8) && modules.analytics && window.gameAnalytics) {
        window.gameAnalytics.trackLoadingProgress(step, loadingProgress.toFixed(0), message);
    }
}

/**
 * Hide the loading screen
 */
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    
    if (loadingScreen) {
        // Fade out the loading screen
        loadingScreen.style.opacity = '0';
        
        // Remove it after the transition
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            
            // Stop cycling through tips
            clearInterval(tipInterval);
        }, 1000);
    }
}

/**
 * Initialize all game modules
 */
function initializeModules() {
    try {
        // Track loading progress
        if (window.gameAnalytics) {
            window.gameAnalytics.trackLoadingProgress(1, "Starting module initialization");
        }
        
        console.log("Initializing modules directly...");
        
        // Initialize modules in sequence
        updateLoadingProgress(1, "Initializing scene...");
        
        // Initialize scene
        if (window.gameScene && window.gameScene.initScene) {
            try {
                window.gameScene.initScene();
                modules.gameScene = true;
                console.log("Scene module initialized successfully");
            } catch (error) {
                console.error("Error initializing scene module:", error);
                if (window.gameAnalytics) {
                    window.gameAnalytics.trackModuleError("Scene", error.message);
                }
                showError("Failed to initialize scene module. Please refresh the page.");
                return;
            }
        } else {
            console.error("Scene module not found or missing initScene method");
            showError("Scene module not found. Please refresh the page.");
            return;
        }
        
        // Initialize physics
        updateLoadingProgress(2, "Initializing physics...");
        
        if (window.physics && window.physics.initPhysics) {
            try {
                window.physics.initPhysics();
                modules.physics = true;
                console.log("Physics module initialized successfully");
            } catch (error) {
                console.error("Error initializing physics module:", error);
                if (window.gameAnalytics) {
                    window.gameAnalytics.trackModuleError("Physics", error.message);
                }
                showError("Failed to initialize physics module. Please refresh the page.");
                return;
            }
        } else {
            console.error("Physics module not found or missing initPhysics method");
            showError("Physics module not found. Please refresh the page.");
            return;
        }
        
        // Initialize player
        updateLoadingProgress(3, "Initializing player...");
        
        if (window.player && window.player.initPlayer) {
            try {
                window.player.initPlayer();
                modules.player = true;
                console.log("Player module initialized successfully");
            } catch (error) {
                console.error("Error initializing player module:", error);
                if (window.gameAnalytics) {
                    window.gameAnalytics.trackModuleError("Player", error.message);
                }
                showError("Failed to initialize player module. Please refresh the page.");
                return;
            }
        } else {
            console.error("Player module not found or missing initPlayer method");
            showError("Player module not found. Please refresh the page.");
            return;
        }
        
        // Initialize character
        updateLoadingProgress(4, "Initializing character...");
        
        if (window.character && window.character.initCharacter) {
            try {
                window.character.initCharacter();
                modules.character = true;
                console.log("Character module initialized successfully");
            } catch (error) {
                console.error("Error initializing character module:", error);
                if (window.gameAnalytics) {
                    window.gameAnalytics.trackModuleError("Character", error.message);
                }
                // Continue without character
                console.warn("Continuing without character module");
            }
        } else {
            console.warn("Character module not found or missing initCharacter method");
        }
        
        // Initialize tiles
        updateLoadingProgress(5, "Initializing tiles...");
        
        if (window.tiles && window.tiles.initTiles) {
            try {
                window.tiles.initTiles();
                modules.tiles = true;
                console.log("Tiles module initialized successfully");
            } catch (error) {
                console.error("Error initializing tiles module:", error);
                if (window.gameAnalytics) {
                    window.gameAnalytics.trackModuleError("Tiles", error.message);
                }
                showError("Failed to initialize tiles module. Please refresh the page.");
                return;
            }
        } else {
            console.error("Tiles module not found or missing initTiles method");
            showError("Tiles module not found. Please refresh the page.");
            return;
        }
        
        // Initialize UI
        updateLoadingProgress(6, "Initializing UI...");
        
        if (window.ui && window.ui.initUI) {
            try {
                window.ui.initUI();
                modules.ui = true;
                console.log("UI module initialized successfully");
            } catch (error) {
                console.error("Error initializing UI module:", error);
                if (window.gameAnalytics) {
                    window.gameAnalytics.trackModuleError("UI", error.message);
                }
                // Continue without UI
                console.warn("Continuing without UI module");
            }
        } else {
            console.warn("UI module not found or missing initUI method");
        }
        
        // Initialize network
        updateLoadingProgress(7, "Initializing network...");
        
        if (window.network && window.network.initNetwork) {
            try {
                window.network.initNetwork();
                modules.network = true;
                console.log("Network module initialized successfully");
            } catch (error) {
                console.error("Error initializing network module:", error);
                if (window.gameAnalytics) {
                    window.gameAnalytics.trackModuleError("Network", error.message);
                }
                // Continue without network
                console.warn("Continuing without network module");
            }
        } else {
            console.warn("Network module not found or missing initNetwork method");
        }
        
        // Initialize effects
        if (window.effects && window.effects.initEffects) {
            try {
                window.effects.initEffects();
                modules.effects = true;
                console.log("Effects module initialized successfully");
            } catch (error) {
                console.error("Error initializing effects module:", error);
                if (window.gameAnalytics) {
                    window.gameAnalytics.trackModuleError("Effects", error.message);
                }
                // Continue without effects
                console.warn("Continuing without effects module");
            }
        } else {
            console.warn("Effects module not found or missing initEffects method");
        }
        
        // Initialize debug
        if (window.debug && window.debug.initDebug) {
            try {
                window.debug.initDebug();
                modules.debug = true;
                console.log("Debug module initialized successfully");
            } catch (error) {
                console.error("Error initializing debug module:", error);
                if (window.gameAnalytics) {
                    window.gameAnalytics.trackModuleError("Debug", error.message);
                }
                // Continue without debug
                console.warn("Continuing without debug module");
            }
        } else {
            console.warn("Debug module not found or missing initDebug method");
        }
        
        // Track loading progress
        updateLoadingProgress(8, "All modules initialized");
        if (window.gameAnalytics) {
            window.gameAnalytics.trackLoadingProgress(8, "All modules initialized");
        }
        
        // All modules initialized, start the game
        startGame();
        
    } catch (error) {
        // Track initialization error
        if (window.gameAnalytics) {
            window.gameAnalytics.trackModuleError("Initialization", error.message);
        }
        console.error("Error initializing modules:", error);
        showError("Failed to initialize game modules. Please refresh the page.");
    }
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
            if (modules.analytics && window.gameAnalytics) {
                window.gameAnalytics.trackModuleError('debug', error.message);
            }
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
        
        // Track error if analytics is available
        if (modules.analytics && window.gameAnalytics) {
            window.gameAnalytics.trackEvent('start_error', {
                error: errorMessage,
                uninitializedModules: uninitializedModules.join(',')
            });
        }
        
        return;
    }
    
    // Start the game
    window.gameScene.startGame();
    
    console.log("Game started successfully!");
    
    // Track game start if analytics is available
    if (modules.analytics && window.gameAnalytics) {
        window.gameAnalytics.trackGameStart(modules);
    }
    
    // Show welcome notification if UI is available
    if (window.ui && window.ui.showNotification) {
        setTimeout(() => {
            window.ui.showNotification("Welcome to Diwar Climb! Climb as high as you can!", "welcome");
        }, 1500);
    }
    
    // Set up analytics hooks if analytics is available
    if (modules.analytics && window.gameAnalytics && window.gameAnalytics.setupGameHooks) {
        window.gameAnalytics.setupGameHooks(window);
    }
}

// Initialize the game when the window loads
window.addEventListener('load', initGame); 