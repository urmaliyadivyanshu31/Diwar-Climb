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
let notificationContainer;

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
    
    // Create notification container
    createNotificationContainer();
    
    // Set initial values
    updateScore(DEFAULT_SCORE);
    updateHealth(DEFAULT_HEALTH);
    
    // Add keyboard listener for UI toggles
    window.addEventListener('keydown', handleUIKeyboard);
    
    // Show initial welcome notification
    setTimeout(() => {
        showNotification("Welcome to Diwar Climb! Use WASD to move and SPACE to jump.", "welcome");
    }, 2000);
    
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
        /* Base UI Styles */
        #ui-container {
            position: absolute;
            top: 20px;
            left: 20px;
            color: white;
            font-family: 'Arial', sans-serif;
            z-index: 100;
            user-select: none;
            transition: opacity 0.3s ease;
        }
        
        /* Game Info Panel */
        .game-info {
            background-color: rgba(0, 0, 0, 0.7);
            padding: 12px 18px;
            margin-bottom: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 220px;
            border-left: 4px solid #3498db;
            backdrop-filter: blur(5px);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .game-info:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.6);
        }
        
        .game-info span:first-child {
            font-weight: bold;
            margin-right: 10px;
            color: #3498db;
        }
        
        #score {
            border-left-color: #2ecc71;
        }
        
        #score span:first-child {
            color: #2ecc71;
        }
        
        #high-score {
            border-left-color: #f1c40f;
        }
        
        #high-score span:first-child {
            color: #f1c40f;
        }
        
        #height {
            border-left-color: #9b59b6;
        }
        
        #height span:first-child {
            color: #9b59b6;
        }
        
        /* Health Bar */
        .health-bar {
            width: 140px;
            height: 12px;
            background-color: rgba(255, 0, 0, 0.3);
            border-radius: 6px;
            overflow: hidden;
            box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
            position: relative;
        }
        
        .health-bar-fill {
            height: 100%;
            background-color: #2ecc71;
            width: var(--health-width, 100%);
            transition: width 0.3s, background-color 0.3s;
            box-shadow: 0 0 8px rgba(46, 204, 113, 0.5);
            position: relative;
        }
        
        .health-bar-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 50%;
            background: linear-gradient(to bottom, rgba(255, 255, 255, 0.2), transparent);
        }
        
        .health-bar-fill.medium {
            background-color: #f39c12;
            box-shadow: 0 0 8px rgba(243, 156, 18, 0.5);
        }
        
        .health-bar-fill.low {
            background-color: #e74c3c;
            box-shadow: 0 0 8px rgba(231, 76, 60, 0.5);
            animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
        }
        
        /* Game Over Screen */
        #game-over-screen {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(5px);
            display: none;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            font-family: 'Arial', sans-serif;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.5s ease;
        }
        
        #game-over-screen.visible {
            display: flex;
            opacity: 1;
        }
        
        #game-over-screen h1 {
            font-size: 64px;
            margin-bottom: 20px;
            color: #e74c3c;
            text-shadow: 0 0 10px rgba(231, 76, 60, 0.7);
            animation: gameOverPulse 2s infinite;
        }
        
        @keyframes gameOverPulse {
            0% { transform: scale(1); text-shadow: 0 0 10px rgba(231, 76, 60, 0.7); }
            50% { transform: scale(1.05); text-shadow: 0 0 20px rgba(231, 76, 60, 0.9); }
            100% { transform: scale(1); text-shadow: 0 0 10px rgba(231, 76, 60, 0.7); }
        }
        
        #final-score {
            font-size: 32px;
            margin-bottom: 40px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }
        
        #game-over-screen button {
            padding: 15px 30px;
            font-size: 20px;
            background-color: #2ecc71;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            font-weight: bold;
            letter-spacing: 1px;
        }
        
        #game-over-screen button:hover {
            background-color: #27ae60;
            transform: translateY(-3px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
        }
        
        #game-over-screen button:active {
            transform: translateY(1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        /* Controls Info Panel */
        #controls-info {
            position: absolute;
            bottom: 20px;
            left: 20px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 18px;
            border-radius: 8px;
            font-family: 'Arial', sans-serif;
            z-index: 100;
            max-width: 300px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
            font-size: 14px;
            text-shadow: 1px 1px 2px black;
            user-select: none;
            border-left: 4px solid #3498db;
            backdrop-filter: blur(5px);
            transition: transform 0.3s ease, opacity 0.3s ease;
        }
        
        #controls-info h3 {
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 20px;
            color: #3498db;
            border-bottom: 1px solid rgba(52, 152, 219, 0.5);
            padding-bottom: 8px;
        }
        
        #controls-info div {
            margin-bottom: 8px;
            display: flex;
            align-items: center;
        }
        
        #controls-info div::before {
            content: '•';
            color: #3498db;
            margin-right: 8px;
            font-size: 18px;
        }
        
        #controls-info.hidden {
            opacity: 0;
            transform: translateY(20px);
            pointer-events: none;
        }
        
        /* Notification System */
        #notification-container {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            pointer-events: none;
        }
        
        .notification {
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 10px;
            font-family: 'Arial', sans-serif;
            font-size: 16px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(5px);
            transform: translateX(120%);
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            max-width: 100%;
            border-left: 4px solid #3498db;
            opacity: 0;
        }
        
        .notification.visible {
            transform: translateX(0);
            opacity: 1;
        }
        
        .notification.milestone {
            background-color: rgba(46, 204, 113, 0.9);
            border-left-color: #27ae60;
        }
        
        .notification.warning {
            background-color: rgba(231, 76, 60, 0.9);
            border-left-color: #c0392b;
        }
        
        .notification.welcome {
            background-color: rgba(52, 152, 219, 0.9);
            border-left-color: #2980b9;
        }
        
        /* FPS Counter */
        #fps-counter {
            position: absolute;
            top: 10px;
            right: 10px;
            background-color: rgba(0, 0, 0, 0.7);
            color: #f1c40f;
            font-family: monospace;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 14px;
            display: none;
            border-left: 3px solid #f1c40f;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        #fps-counter.visible {
            display: block;
        }
        
        /* Responsive Adjustments */
        @media (max-width: 768px) {
            .game-info {
                min-width: 180px;
                font-size: 14px;
                padding: 10px 15px;
            }
            
            .health-bar {
                width: 100px;
            }
            
            #controls-info {
                font-size: 12px;
                max-width: 250px;
            }
            
            #game-over-screen h1 {
                font-size: 48px;
            }
            
            #final-score {
                font-size: 24px;
            }
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
    fpsCounter.innerHTML = `<span>FPS:</span> <span id="fps-value">0</span>`;
    document.body.appendChild(fpsCounter);
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
        <h3>Controls</h3>
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
 * Create notification container
 */
function createNotificationContainer() {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    document.body.appendChild(notificationContainer);
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
            
        case 'r':
        case 'R':
            // Restart game if not in game over state
            if (!gameOverScreen.classList.contains('visible')) {
                window.gameScene.restartGame();
                showNotification("Game Restarted", "warning");
            }
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
        
        // Show warning if health is critically low
        if (healthPercent <= 20 && healthPercent > 0) {
            showNotification("Health critically low!", "warning");
        }
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
function updateFPS(deltaTime) {
    if (showFps) {
        const now = performance.now();
        uiFrameCount++;
        
        // Update FPS every second
        if (now - lastFrameTime >= 1000) {
            fps = Math.round((uiFrameCount * 1000) / (now - lastFrameTime));
            const fpsValue = document.getElementById('fps-value');
            if (fpsValue) {
                fpsValue.textContent = fps;
                
                // Color code based on performance
                if (fps >= 55) {
                    fpsValue.style.color = '#2ecc71'; // Green
                } else if (fps >= 30) {
                    fpsValue.style.color = '#f1c40f'; // Yellow
                } else {
                    fpsValue.style.color = '#e74c3c'; // Red
                }
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
    
    // Reset milestone tracking
    lastMilestoneReached = -1;
}

/**
 * Update UI elements
 */
function updateUI(deltaTime) {
    // Update FPS counter
    updateFPS(deltaTime);
    
    // Update player height if player exists
    if (window.player && window.player.getPlayerPosition) {
        try {
            const playerPos = window.player.getPlayerPosition();
            if (playerPos) {
                updateHeight(playerPos.y);
            }
        } catch (error) {
            console.warn("Error updating height:", error);
        }
    }
}

/**
 * Show a notification message
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (default, milestone, warning, etc.)
 */
function showNotification(message, type = 'default') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Show with animation (delayed to allow DOM to update)
    setTimeout(() => {
        notification.classList.add('visible');
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('visible');
        
        // Remove from DOM after animation completes
        setTimeout(() => {
            notification.remove();
        }, 300);
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
    resetUI,
    showNotification
}; 