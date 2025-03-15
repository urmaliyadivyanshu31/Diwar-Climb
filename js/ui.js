/**
 * ui.js - Manages HTML UI for game information and controls
 * 
 * This file is responsible for creating and updating the user interface
 * elements that display game information like score, health, and game controls.
 */

// UI elements
let scoreElement;
let healthElement;
let heightElement;
let gameOverScreen;
let uiContainer;
let controlsInfo;
let fpsCounter;
let highScoreElement;

// Default values
const DEFAULT_HEALTH = 100;
const DEFAULT_SCORE = 0;
const DEFAULT_HEIGHT = 1.8;

// Current values
let currentHealth = DEFAULT_HEALTH;
let currentScore = DEFAULT_SCORE;
let uiCurrentHeight = DEFAULT_HEIGHT;
let highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;
let showFps = false;
let lastFrameTime = 0;
let uiFrameCount = 0;
let fps = 0;

// Height milestones for bonus points
const heightMilestones = [10, 25, 50, 100, 200, 300, 500, 750, 1000];
let lastMilestoneReached = -1;

// Score multipliers
const HEIGHT_SCORE_MULTIPLIER = 10; // Points per unit of height
const MILESTONE_BONUS = 500; // Bonus points for reaching a milestone

/**
 * Initialize the UI elements
 */
function initUI() {
    console.log("Initializing UI...");
    
    // Create UI container
    createUIContainer();
    
    // Create game info elements
    createGameInfoElements();
    
    // Create controls info
    createControlsInfo();
    
    // Create game over screen
    createGameOverScreen();
    
    // Set initial values
    updateScore(DEFAULT_SCORE);
    updateHealth(DEFAULT_HEALTH);
    
    // Add keyboard listener for UI toggles
    window.addEventListener('keydown', handleUIKeyboard);
    
    console.log("UI initialized");
}

/**
 * Create the main UI container
 */
function createUIContainer() {
    // Create UI container
    uiContainer = document.createElement('div');
    uiContainer.id = 'ui-container';
    document.body.appendChild(uiContainer);
    
    // Add CSS styles
    const style = document.createElement('style');
    style.textContent = `
        #ui-container {
            position: absolute;
            top: 20px;
            left: 20px;
            color: white;
            font-family: 'Arial', sans-serif;
            z-index: 100;
            user-select: none;
        }
        
        .game-info {
            background-color: rgba(0, 0, 0, 0.6);
            padding: 10px 15px;
            margin-bottom: 10px;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 200px;
        }
        
        .game-info span:first-child {
            font-weight: bold;
            margin-right: 10px;
        }
        
        .health-bar {
            width: 120px;
            height: 10px;
            background-color: rgba(255, 0, 0, 0.3);
            border-radius: 5px;
            overflow: hidden;
        }
        
        .health-bar-fill {
            height: 100%;
            background-color: #2ecc71;
            width: var(--health-width, 100%);
            transition: width 0.3s, background-color 0.3s;
        }
        
        .health-bar-fill.medium {
            background-color: #f39c12;
        }
        
        .health-bar-fill.low {
            background-color: #e74c3c;
        }
        
        #game-over {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            z-index: 1000;
            display: none;
        }
        
        #game-over h2 {
            font-size: 36px;
            margin-bottom: 20px;
            color: #e74c3c;
        }
        
        #game-over button {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 18px;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s;
            margin-top: 20px;
        }
        
        #game-over button:hover {
            background-color: #2980b9;
        }
        
        #controls-info {
            position: absolute;
            bottom: 20px;
            left: 20px;
            background-color: rgba(0, 0, 0, 0.6);
            color: white;
            padding: 15px;
            border-radius: 5px;
            font-family: 'Arial', sans-serif;
            z-index: 100;
            max-width: 300px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
            font-size: 14px;
            text-shadow: 1px 1px 2px black;
            user-select: none;
        }
        
        #controls-info h3 {
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 18px;
        }
        
        #controls-info ul {
            margin: 0;
            padding-left: 20px;
        }
        
        #controls-info li {
            margin-bottom: 5px;
        }
        
        .notification {
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            font-family: 'Arial', sans-serif;
            font-size: 18px;
            z-index: 1000;
            display: none;
            opacity: 0;
            transition: opacity 0.5s;
            text-align: center;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.5);
        }
        
        .notification.visible {
            display: block;
            opacity: 1;
        }
        
        .notification.milestone {
            background-color: rgba(46, 204, 113, 0.9);
            color: white;
            font-weight: bold;
        }
        
        .notification.warning {
            background-color: rgba(231, 76, 60, 0.9);
            color: white;
        }
        
        #fps-counter {
            position: absolute;
            top: 10px;
            right: 10px;
            left: auto;
            background-color: rgba(0, 0, 0, 0.5);
            color: yellow;
            font-family: monospace;
            display: none;
        }
        
        #fps-counter.visible {
            display: block;
        }
        
        #controls-info.hidden {
            display: none;
        }
        
        #game-over-screen {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: none;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            font-family: 'Arial', sans-serif;
            z-index: 1000;
        }
        
        #game-over-screen.visible {
            display: flex;
        }
        
        #game-over-screen h1 {
            font-size: 48px;
            margin-bottom: 20px;
        }
        
        #final-score {
            font-size: 24px;
            margin-bottom: 30px;
        }
        
        #game-over-screen button {
            padding: 10px 20px;
            font-size: 18px;
            background-color: #2ecc71;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Create game information elements (score, health, height)
 */
function createGameInfoElements() {
    // Create score element
    scoreElement = document.createElement('div');
    scoreElement.id = 'score';
    scoreElement.className = 'game-info';
    scoreElement.innerHTML = `<span>Score:</span> <span id="score-value">0</span>`;
    uiContainer.appendChild(scoreElement);
    
    // Create high score element
    highScoreElement = document.createElement('div');
    highScoreElement.id = 'high-score';
    highScoreElement.className = 'game-info';
    highScoreElement.innerHTML = `<span>High Score:</span> <span id="high-score-value">${highScore}</span>`;
    uiContainer.appendChild(highScoreElement);
    
    // Create health element
    healthElement = document.createElement('div');
    healthElement.id = 'health';
    healthElement.className = 'game-info';
    healthElement.innerHTML = `
        <span>Health:</span>
        <div class="health-bar">
            <div class="health-bar-fill"></div>
        </div>
    `;
    uiContainer.appendChild(healthElement);
    
    // Create height element
    heightElement = document.createElement('div');
    heightElement.id = 'height';
    heightElement.className = 'game-info';
    heightElement.innerHTML = `<span>Height:</span> <span id="height-value">0</span>m`;
    uiContainer.appendChild(heightElement);
    
    // Create FPS counter (hidden by default)
    fpsCounter = document.createElement('div');
    fpsCounter.id = 'fps-counter';
    fpsCounter.className = 'game-info';
    fpsCounter.innerHTML = `<span>FPS:</span> <span id="fps-value">0</span>`;
    uiContainer.appendChild(fpsCounter);
}

/**
 * Create controls information panel
 */
function createControlsInfo() {
    // Create controls info container
    controlsInfo = document.createElement('div');
    controlsInfo.id = 'controls-info';
    
    // Add controls information
    controlsInfo.innerHTML = `
        <h3>Controls:</h3>
        <div>WASD / Arrow Keys: Move</div>
        <div>Space: Jump</div>
        <div>Shift: Run</div>
        <div>R: Restart Game</div>
        <div>F: Toggle FPS Display</div>
        <div>H: Toggle Controls</div>
    `;
    
    document.body.appendChild(controlsInfo);
}

/**
 * Create game over screen
 */
function createGameOverScreen() {
    // Create game over container
    gameOverScreen = document.createElement('div');
    gameOverScreen.id = 'game-over-screen';
    
    // Game over title
    const gameOverTitle = document.createElement('h1');
    gameOverTitle.textContent = 'GAME OVER';
    gameOverScreen.appendChild(gameOverTitle);
    
    // Final score
    const finalScore = document.createElement('div');
    finalScore.id = 'final-score';
    gameOverScreen.appendChild(finalScore);
    
    // Restart button
    const restartButton = document.createElement('button');
    restartButton.textContent = 'Restart Game';
    restartButton.onclick = () => {
        hideGameOver();
        window.gameScene.restartGame();
    };
    gameOverScreen.appendChild(restartButton);
    
    document.body.appendChild(gameOverScreen);
}

/**
 * Handle keyboard events for UI
 */
function handleUIKeyboard(event) {
    switch (event.key) {
        case 'f':
        case 'F':
            // Toggle FPS display
            showFps = !showFps;
            if (showFps) {
                fpsCounter.classList.add('visible');
            } else {
                fpsCounter.classList.remove('visible');
            }
            break;
            
        case 'h':
        case 'H':
            // Toggle controls info
            controlsInfo.classList.toggle('hidden');
            break;
    }
}

/**
 * Update the score display
 */
function updateScore(score) {
    // Update current score
    currentScore = score;
    
    // Update score display
    const scoreValue = document.getElementById('score-value');
    if (scoreValue) {
        scoreValue.textContent = currentScore;
    }
    
    // Update high score if needed
    if (currentScore > highScore) {
        highScore = currentScore;
        
        // Update high score display
        const highScoreValue = document.getElementById('high-score-value');
        if (highScoreValue) {
            highScoreValue.textContent = highScore;
        }
        
        // Save high score to local storage
        localStorage.setItem('highScore', highScore.toString());
        
        // Show notification for new high score
        if (currentScore > 1000) {
            showNotification('New High Score!', 'milestone');
        }
    }
}

/**
 * Update the health display
 */
function updateHealth(health) {
    currentHealth = health;
    
    // Update health bar
    const healthBar = document.querySelector('.health-bar-fill');
    if (!healthBar) return;
    
    const healthPercent = Math.max(0, Math.min(100, health));
    
    // Set width using CSS variable
    healthBar.style.setProperty('--health-width', `${healthPercent}%`);
    
    // Change color based on health using classes
    healthBar.classList.remove('medium', 'low');
    if (healthPercent <= 30) {
        healthBar.classList.add('low');
    } else if (healthPercent <= 60) {
        healthBar.classList.add('medium');
    }
}

/**
 * Update the height display
 */
function updateHeight(height) {
    // Update current height (round to 1 decimal place)
    uiCurrentHeight = Math.round(height * 10) / 10;
    
    // Update height display
    const heightValue = document.getElementById('height-value');
    if (heightValue) {
        heightValue.textContent = uiCurrentHeight.toFixed(1);
    }
    
    // Check if we've reached a new milestone
    const currentMilestoneIndex = heightMilestones.findIndex(milestone => uiCurrentHeight >= milestone);
    
    if (currentMilestoneIndex > lastMilestoneReached) {
        // We've reached a new milestone!
        lastMilestoneReached = currentMilestoneIndex;
        const milestone = heightMilestones[currentMilestoneIndex];
        
        // Award bonus points
        const bonus = MILESTONE_BONUS;
        updateScore(currentScore + bonus);
        
        // Show milestone notification
        showNotification(`Height Milestone: ${milestone}m! +${bonus} points`, 'milestone');
    }
    
    // Update score based on height (only if height has increased)
    const heightScore = Math.floor(uiCurrentHeight * HEIGHT_SCORE_MULTIPLIER);
    if (heightScore > currentScore) {
        updateScore(heightScore);
    }
}

/**
 * Update FPS counter
 */
function updateFPS() {
    if (showFps) {
        const now = performance.now();
        uiFrameCount++;
        
        // Update FPS every second
        if (now - lastFrameTime >= 1000) {
            fps = Math.round((uiFrameCount * 1000) / (now - lastFrameTime));
            const fpsValue = document.getElementById('fps-value');
            if (fpsValue) {
                fpsValue.textContent = fps;
            }
            uiFrameCount = 0;
            lastFrameTime = now;
        }
    }
}

/**
 * Show game over screen
 */
function showGameOver(finalScore) {
    document.getElementById('final-score').textContent = `Final Score: ${finalScore}`;
    gameOverScreen.classList.add('visible');
}

/**
 * Hide game over screen
 */
function hideGameOver() {
    gameOverScreen.classList.remove('visible');
}

/**
 * Reset UI to default values
 */
function resetUI() {
    updateScore(DEFAULT_SCORE);
    updateHealth(DEFAULT_HEALTH);
    updateHeight(DEFAULT_HEIGHT);
    hideGameOver();
}

/**
 * Update UI elements
 */
function updateUI() {
    // Update FPS counter
    updateFPS();
}

/**
 * Show a notification message
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (default, milestone, warning, etc.)
 */
function showNotification(message, type = 'default') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Set notification content and class
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    // Show the notification with animation
    requestAnimationFrame(() => {
        notification.classList.add('visible');
    });
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('visible');
        setTimeout(() => {
            notification.classList.remove(type);
        }, 500);
    }, 3000);
}

// Export UI functions
window.ui = {
    initUI,
    updateUI,
    updateScore,
    updateHealth,
    updateHeight,
    showGameOver,
    hideGameOver,
    resetUI
}; 