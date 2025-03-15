/**
 * analytics.js - Analytics tracking for Diwar Climb
 * 
 * This file provides analytics tracking functionality for the game,
 * integrating with Vercel Analytics for event tracking.
 */

// Game start time for tracking play duration
let gameStartTime = 0;

/**
 * Analytics module for tracking game events
 */
const analytics = {
    /**
     * Initialize analytics
     */
    init: function() {
        console.log("Initializing analytics...");
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Track initialization
        this.trackInitialization();
        
        console.log("Analytics initialized");
    },
    
    /**
     * Set up event listeners for analytics events
     */
    setupEventListeners: function() {
        // Listen for window errors
        window.addEventListener('error', (event) => {
            this.trackEvent('javascript_error', {
                message: event.message,
                source: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
        
        // Listen for unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.trackEvent('unhandled_promise_rejection', {
                reason: event.reason ? event.reason.toString() : 'Unknown'
            });
        });
        
        // Listen for visibility changes to track when users leave/return
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.trackEvent('game_backgrounded', {
                    playTime: (performance.now() - gameStartTime) / 1000
                });
            } else if (document.visibilityState === 'visible') {
                this.trackEvent('game_foregrounded');
            }
        });
    },
    
    /**
     * Track a game event
     * @param {string} eventName - Name of the event
     * @param {Object} properties - Additional properties to track
     */
    trackEvent: function(eventName, properties = {}) {
        // Check if window.va (Vercel Analytics) is available
        if (typeof window.va !== 'undefined') {
            try {
                // In local development, va might be the fallback function
                if (typeof window.va === 'function') {
                    window.va('event', eventName, properties);
                } else if (window.va && typeof window.va.track === 'function') {
                    window.va.track(eventName, properties);
                }
                
                // Only log in development or if debug is enabled
                if (window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    (window.debug && window.debug.isEnabled && window.debug.isEnabled())) {
                    console.log(`Analytics: Tracked event "${eventName}"`, properties);
                }
            } catch (error) {
                console.warn(`Analytics: Failed to track event "${eventName}"`, error);
            }
        } else {
            // Fallback to console logging for development
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.log(`Analytics Event (dev only): ${eventName}`, properties);
            }
        }
    },
    
    /**
     * Track game initialization
     */
    trackInitialization: function() {
        this.trackEvent('game_initialized', {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            referrer: document.referrer,
            language: navigator.language
        });
    },
    
    /**
     * Track game start
     * @param {Object} modules - Initialized modules
     */
    trackGameStart: function(modules) {
        // Set game start time
        gameStartTime = performance.now();
        
        this.trackEvent('game_started', {
            modules: Object.keys(modules).filter(key => modules[key]).join(','),
            timestamp: new Date().toISOString(),
            loadTime: gameStartTime / 1000 // Time from page load to game start in seconds
        });
    },
    
    /**
     * Track game over
     * @param {number} score - Final score
     * @param {number} height - Maximum height reached
     */
    trackGameOver: function(score, height) {
        const playTime = (performance.now() - gameStartTime) / 1000;
        
        this.trackEvent('game_over', {
            score: score,
            height: height,
            playTime: playTime,
            scorePerSecond: score / Math.max(1, playTime)
        });
    },
    
    /**
     * Track milestone reached
     * @param {number} milestone - Milestone height reached
     * @param {number} score - Current score
     */
    trackMilestone: function(milestone, score) {
        const playTime = (performance.now() - gameStartTime) / 1000;
        
        this.trackEvent('milestone_reached', {
            milestone: milestone,
            score: score,
            playTime: playTime
        });
    },
    
    /**
     * Track player action
     * @param {string} action - Action performed (jump, run, etc.)
     * @param {Object} details - Additional details about the action
     */
    trackPlayerAction: function(action, details = {}) {
        this.trackEvent('player_action', {
            action: action,
            ...details
        });
    },
    
    /**
     * Track loading progress
     * @param {number} step - Loading step
     * @param {number} percentage - Loading percentage
     * @param {string} message - Loading message
     */
    trackLoadingProgress: function(step, percentage, message) {
        this.trackEvent('loading_progress', {
            step: step,
            percentage: percentage,
            message: message
        });
    },
    
    /**
     * Track module error
     * @param {string} module - Module name
     * @param {string} error - Error message
     */
    trackModuleError: function(module, error) {
        this.trackEvent('module_error', {
            module: module,
            error: error
        });
    },
    
    /**
     * Set up hooks to track game events
     * @param {Object} game - Game object with UI and player modules
     */
    setupGameHooks: function(game) {
        // Track game over events
        if (game.ui && game.ui.showGameOver) {
            const originalShowGameOver = game.ui.showGameOver;
            game.ui.showGameOver = function(finalScore) {
                // Track game over
                let maxHeight = 0;
                if (game.player && game.player.getPlayerPosition) {
                    const playerPos = game.player.getPlayerPosition();
                    if (playerPos) {
                        maxHeight = Math.max(playerPos.y, game.ui.uiCurrentHeight || 0);
                    }
                }
                
                analytics.trackGameOver(finalScore, maxHeight);
                
                // Call original function
                return originalShowGameOver.apply(this, arguments);
            };
        }
        
        // Track milestone events
        if (game.ui && game.ui.updateHeight) {
            const originalUpdateHeight = game.ui.updateHeight;
            game.ui.updateHeight = function(height) {
                const previousMilestoneIndex = game.ui.lastMilestoneReached || -1;
                
                // Call original function
                const result = originalUpdateHeight.apply(this, arguments);
                
                // Check if we've reached a new milestone
                const currentMilestoneIndex = game.ui.lastMilestoneReached || -1;
                if (currentMilestoneIndex > previousMilestoneIndex && currentMilestoneIndex >= 0) {
                    const milestone = game.ui.heightMilestones[currentMilestoneIndex];
                    const currentScore = game.ui.currentScore || 0;
                    
                    // Track milestone
                    analytics.trackMilestone(milestone, currentScore);
                }
                
                return result;
            };
        }
        
        // Track player jumps
        if (game.player && game.player.handleInput) {
            const originalHandleInput = game.player.handleInput;
            game.player.handleInput = function() {
                // Get keyboard state before handling input
                const keyboard = window.physics.getKeyboard();
                const wasJumping = game.player.canJump === false;
                
                // Call original function
                const result = originalHandleInput.apply(this, arguments);
                
                // Check if player just jumped
                if (keyboard[' '] && game.player.canJump === false && !wasJumping) {
                    // Player just jumped
                    analytics.trackPlayerAction('jump', {
                        height: game.player.getPlayerPosition().y
                    });
                }
                
                return result;
            };
        }
    }
};

// Export analytics for use in other modules
window.gameAnalytics = analytics; 