/**
 * player.js - Handles player physics, movement, and controls
 * 
 * This file is responsible for creating the player's physics body,
 * handling player movement, and processing user input.
 */

// Player state
let playerBody = null;
let canJump = false;
let score = 0;
let health = 100;
let highestY = 0;
let movementDirection = { x: 0, z: 0 };
let movementState = {
    moving: false,
    running: false,
    jumping: false,
    falling: false
};

// Scoring system
const SCORE_HEIGHT_MULTIPLIER = 10; // Points per unit of height
const SCORE_TILE_BONUS = 50; // Bonus for reaching a new tile
const SCORE_HEALTH_PENALTY = 100; // Penalty for losing health
const MAX_SCORE_RATE = 100; // Maximum score increase per second
let lastScoreUpdate = 0; // Time of last score update
let lastScoredHeight = 0; // Last height at which score was awarded

// Player settings
const PLAYER_HEIGHT = 1.8;
const PLAYER_RADIUS = 0.3;
const PLAYER_MASS = 5;
const PLAYER_MOVE_SPEED = 5;
const PLAYER_RUN_SPEED = 10;
const PLAYER_JUMP_FORCE = 10;
const FALL_THRESHOLD = -2;

// Control sensitivity
const MOVEMENT_DAMPING = 0.9; // Smooths movement
const MAX_VELOCITY = 20; // Prevents excessive speed

/**
 * Initialize the player
 */
function initPlayer() {
    // Create player physics body
    createPlayerPhysics();
    
    console.log("Player module initialized");
}

/**
 * Create the player's physics body
 */
function createPlayerPhysics() {
    // Create a cylinder shape for better player collision
    const shape = new CANNON.Cylinder(
        PLAYER_RADIUS, // Top radius
        PLAYER_RADIUS, // Bottom radius
        PLAYER_HEIGHT, // Height
        8 // Number of segments
    );
    
    // Create the physics body
    playerBody = new CANNON.Body({
        mass: PLAYER_MASS,
        shape: shape,
        position: new CANNON.Vec3(0, PLAYER_HEIGHT / 2, 0),
        material: new CANNON.Material({
            friction: 0.5,
            restitution: 0.1
        })
    });
    
    // Rotate the cylinder to stand upright
    const quat = new CANNON.Quaternion();
    quat.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
    playerBody.quaternion.copy(quat);
    
    // Add to physics world
    window.physics.getWorld().addBody(playerBody);
    
    // Set up collision detection for jumping
    playerBody.addEventListener('collide', handleCollision);
}

/**
 * Handle player collisions
 */
function handleCollision(event) {
    // Check if the collision is with the ground or a tile
    const contactNormal = new CANNON.Vec3();
    const contact = event.contact;
    
    // Get the contact normal
    if (contact.bi.id === playerBody.id) {
        contact.ni.negate(contactNormal);
    } else {
        contactNormal.copy(contact.ni);
    }
    
    // If the contact normal is pointing up, we're on the ground
    if (contactNormal.y > 0.5) {
        canJump = true;
        movementState.jumping = false;
        movementState.falling = false;
    }
}

/**
 * Update player position and handle input
 */
function updatePlayer(deltaTime) {
    // Handle keyboard input
    handleInput();
    
    // Check if player is falling
    if (playerBody.velocity.y < FALL_THRESHOLD) {
        movementState.falling = true;
        movementState.jumping = false;
    }
    
    // Update character position to match physics body
    if (window.character) {
        try {
            // Check if character is initialized
            if (window.character.isInitialized && window.character.isInitialized()) {
                // Update character position
                window.character.updateCharacterPosition(playerBody);
                
                // Update character rotation if moving
                if (movementState.moving) {
                    const rotation = window.character.updateCharacterRotation(movementDirection);
                    
                    // Store rotation for network sync
                    playerBody.rotation = rotation;
                }
                
                // Update character animation
                const animation = window.character.updateCharacterAnimation(movementState);
                
                // Store animation for network sync
                playerBody.animation = animation;
            } else {
                console.log("Character not yet initialized, skipping animation update");
            }
        } catch (error) {
            console.error("Error updating character:", error);
        }
    } else {
        console.warn("Character module not available");
    }
    
    // Check if player has fallen off the map
    if (playerBody.position.y < -10) {
        handleFall();
    }
    
    // Update score based on height with rate limiting
    updateScore();
    
    // Send player position to the network module
    if (window.network && window.network.isConnected && window.network.isConnected()) {
        try {
            window.network.sendPlayerPosition({
                x: playerBody.position.x,
                y: playerBody.position.y,
                z: playerBody.position.z,
                rotation: playerBody.rotation || 0,
                animation: playerBody.animation || 'idle'
            });
        } catch (error) {
            console.error("Error sending player position to network:", error);
        }
    }
}

/**
 * Update the player's score based on height and time
 */
function updateScore() {
    const currentTime = performance.now();
    const currentHeight = playerBody.position.y;
    
    // Only update score if player has reached a new height
    if (currentHeight > highestY) {
        // Calculate height difference
        const heightDifference = currentHeight - highestY;
        
        // Calculate time since last update
        const timeDifference = currentTime - lastScoreUpdate;
        
        // Calculate score increase based on height
        let scoreIncrease = heightDifference * SCORE_HEIGHT_MULTIPLIER;
        
        // Apply rate limiting to prevent score exploitation
        const maxIncrease = MAX_SCORE_RATE * (timeDifference / 1000);
        scoreIncrease = Math.min(scoreIncrease, maxIncrease);
        
        // Add bonus for significant height gains (new tiles)
        if (currentHeight - lastScoredHeight >= 5) {
            scoreIncrease += SCORE_TILE_BONUS;
            lastScoredHeight = currentHeight;
        }
        
        // Update score
        score += Math.floor(scoreIncrease);
        highestY = currentHeight;
        
        // Update UI
        if (window.ui) {
            window.ui.updateScore(score);
        }
        
        // Update last score time
        lastScoreUpdate = currentTime;
    }
}

/**
 * Handle player input
 */
function handleInput() {
    // Get keyboard state from the physics module
    const keyboard = window.physics.getKeyboard();
    
    // Calculate movement direction
    let moveX = 0;
    let moveZ = 0;
    
    if (keyboard.w || keyboard.ArrowUp) moveZ = -1;
    if (keyboard.s || keyboard.ArrowDown) moveZ = 1;
    if (keyboard.a || keyboard.ArrowLeft) moveX = -1;
    if (keyboard.d || keyboard.ArrowRight) moveX = 1;
    
    // Determine if running (shift key)
    const isRunning = keyboard.Shift;
    const currentSpeed = isRunning ? PLAYER_RUN_SPEED : PLAYER_MOVE_SPEED;
    
    // Update movement state
    movementState.running = isRunning;
    
    // Apply movement force if moving
    if (moveX !== 0 || moveZ !== 0) {
        // Normalize for diagonal movement
        const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
        moveX /= length;
        moveZ /= length;
        
        // Store movement direction for character rotation
        movementDirection.x = moveX;
        movementDirection.z = moveZ;
        
        // Calculate force based on current velocity to prevent excessive acceleration
        const currentVelocity = new CANNON.Vec3(playerBody.velocity.x, 0, playerBody.velocity.z);
        const currentSpeed = currentVelocity.length();
        const targetSpeed = isRunning ? PLAYER_RUN_SPEED : PLAYER_MOVE_SPEED;
        
        // Calculate force multiplier based on how close we are to target speed
        // This creates smoother acceleration and deceleration
        let forceMultiplier = 1.0;
        if (currentSpeed > 0) {
            // Reduce force as we approach target speed
            forceMultiplier = Math.max(0.2, 1.0 - (currentSpeed / targetSpeed));
            
            // If we're changing direction, apply more force
            const velocityDirection = currentVelocity.normalize();
            const movementVector = new CANNON.Vec3(moveX, 0, moveZ);
            const dotProduct = velocityDirection.dot(movementVector);
            
            // If dot product is negative, we're changing direction
            if (dotProduct < 0) {
                forceMultiplier = 1.0;
            }
        }
        
        // Apply force to move the player with the calculated multiplier
        playerBody.applyImpulse(
            new CANNON.Vec3(
                moveX * currentSpeed * forceMultiplier, 
                0, 
                moveZ * currentSpeed * forceMultiplier
            ),
            new CANNON.Vec3(0, 0, 0)
        );
        
        // Apply velocity damping to prevent excessive speed
        const velocity = playerBody.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        
        if (speed > MAX_VELOCITY) {
            const scale = MAX_VELOCITY / speed;
            playerBody.velocity.x *= scale;
            playerBody.velocity.z *= scale;
        }
        
        // Update movement state
        movementState.moving = true;
    } else {
        // Apply damping when not actively moving
        playerBody.velocity.x *= MOVEMENT_DAMPING;
        playerBody.velocity.z *= MOVEMENT_DAMPING;
        
        // Not moving
        movementState.moving = false;
    }
    
    // Handle jumping (space key) with improved feel
    if (keyboard[' ']) {
        if (canJump) {
            // Apply jump force with a slight forward boost in the direction of movement
            const jumpVector = new CANNON.Vec3(
                movementDirection.x * PLAYER_JUMP_FORCE * 0.2, 
                PLAYER_JUMP_FORCE, 
                movementDirection.z * PLAYER_JUMP_FORCE * 0.2
            );
            
            playerBody.applyImpulse(jumpVector, new CANNON.Vec3(0, 0, 0));
            canJump = false;
            movementState.jumping = true;
            movementState.falling = false;
            
            // Add a small cooldown to prevent jump spamming
            setTimeout(() => {
                // This prevents the player from jumping again immediately after landing
                if (!canJump) {
                    // We're still in the air, do nothing
                } else {
                    // We've landed, allow jumping again
                }
            }, 100);
        }
    }
}

/**
 * Handle player falling off the map
 */
function handleFall() {
    console.log("Player fell off the map");
    
    // Apply score penalty
    score = Math.max(0, score - SCORE_HEALTH_PENALTY);
    if (window.ui) {
        window.ui.updateScore(score);
    }
    
    // Decrease health
    health -= 20;
    if (window.ui) {
        window.ui.updateHealth(health);
    }
    
    // Check if game over
    if (health <= 0 && window.ui) {
        window.ui.showGameOver(score);
    }
    
    // Restart player position
    restartPlayer();
}

/**
 * Restart the player
 */
function restartPlayer() {
    // Reset player position
    playerBody.position.set(0, PLAYER_HEIGHT, 0);
    playerBody.velocity.set(0, 0, 0);
    playerBody.angularVelocity.set(0, 0, 0);
    
    // Reset player state
    canJump = false;
    movementState.jumping = false;
    movementState.falling = false;
    
    // If health is zero, reset everything
    if (health <= 0) {
        score = 0;
        health = 100;
        highestY = 0;
        if (window.ui) {
            window.ui.updateScore(score);
            window.ui.updateHealth(health);
        }
    }
}

/**
 * Create a mesh for other players
 */
function createOtherPlayerMesh() {
    // Create a simple sphere for other players
    const geometry = new THREE.SphereGeometry(PLAYER_RADIUS, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    const mesh = new THREE.Mesh(geometry, material);
    
    // Set up shadows
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Add to scene
    const scene = window.gameScene.getScene();
    scene.add(mesh);
    
    return mesh;
}

/**
 * Get player position
 */
function getPlayerPosition() {
    return playerBody.position;
}

/**
 * Get the player's physics body
 */
function getPlayerBody() {
    return playerBody;
}

/**
 * Get the player's current movement direction
 * @returns {Object} Direction vector with x and z components
 */
function getMovementDirection() {
    // Return normalized movement direction
    return {
        x: movementDirection.x,
        z: movementDirection.z
    };
}

/**
 * Take damage to the player
 */
function takeDamage() {
    // Implement damage logic
}

/**
 * Get the player's health
 */
function getHealth() {
    return health;
}

/**
 * Get the player's score
 */
function getScore() {
    return score;
}

/**
 * Get the player's movement state
 */
function getMovementState() {
    return movementState;
}

// Export player functions for use in other modules
window.player = {
    initPlayer,
    updatePlayer,
    restartPlayer,
    getPlayerPosition,
    getMovementDirection,
    getPlayerBody,
    takeDamage,
    getHealth,
    getScore,
    getMovementState
}; 