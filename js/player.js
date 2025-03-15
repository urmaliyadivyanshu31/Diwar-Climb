/**
 * player.js - Handles player physics, movement, and controls
 * 
 * This file is responsible for creating the player's physics body,
 * handling player movement, and processing user input.
 */

// Player state
let playerBody = null;
let canJump = false;
let hasDoubleJump = false; // For double jump feature
let score = 0;
let health = 100;
let highestY = 0;
let movementDirection = { x: 0, z: 0 };
let movementState = {
    moving: false,
    running: false,
    jumping: false,
    falling: false,
    doubleJumping: false,
    wallRunning: false,
    sliding: false,
    dashing: false
};

// Advanced movement cooldowns and states
let wallRunTimer = 0;
let wallRunMaxTime = 2000; // Max wall run time in ms
let wallRunDirection = { x: 0, z: 0 }; // Direction of wall run
let wallNormal = { x: 0, z: 0 }; // Normal of the wall being run on
let canWallRun = true;
let wallRunCooldown = 0;

let dashTimer = 0;
let dashCooldown = 0;
const DASH_COOLDOWN_TIME = 1500; // ms before dash is available again
const DASH_DURATION = 200; // ms
const DASH_FORCE = 30;

let slideTimer = 0;
const SLIDE_DURATION = 800; // ms
const SLIDE_COOLDOWN_TIME = 1000; // ms
let slideCooldown = 0;
let canSlide = true;

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
const PLAYER_JUMP_FORCE = 12; // Increased jump force
const PLAYER_DOUBLE_JUMP_FORCE = 10; // Slightly weaker double jump
const WALL_JUMP_FORCE = 14; // Stronger jump off walls
const WALL_RUN_SPEED = 8; // Speed during wall running
const FALL_THRESHOLD = -2;
const JUMP_COOLDOWN = 200; // Milliseconds before allowing another jump
let lastJumpTime = 0;

// Control sensitivity
const MOVEMENT_DAMPING = 0.9; // Smooths movement
const MAX_VELOCITY = 20; // Prevents excessive speed
const AIR_CONTROL = 0.7; // Reduced control in air (0-1)

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
    // Check if we're colliding with the ground or a tile
    if (event.body.mass === 0) { // Static bodies have mass of 0
        // Get collision normal (direction of impact)
        const contactNormal = event.contact.ni;
        
        // If the normal is pointing up (y > 0.5), we're on top of something
        if (contactNormal.y > 0.5) {
            // Enable jumping
            canJump = true;
            hasDoubleJump = false; // Reset double jump
            
            // Reset jumping and falling states
            movementState.jumping = false;
            movementState.falling = false;
            movementState.doubleJumping = false;
            movementState.wallRunning = false;
            
            // Check if this is a tile collision for scoring
            if (event.body.position.y > 0) {
                // This is likely a tile, not the ground
                handleTileCollision(event.body);
            }
        } 
        // Check for wall running
        else if (checkWallRun(contactNormal)) {
            startWallRun(contactNormal);
        }
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
    const currentTime = performance.now();
    
    // Calculate movement direction
    let moveX = 0;
    let moveZ = 0;
    
    if (keyboard.w || keyboard.ArrowUp) moveZ = -1;
    if (keyboard.s || keyboard.ArrowDown) moveZ = 1;
    if (keyboard.a || keyboard.ArrowLeft) moveX = -1;
    if (keyboard.d || keyboard.ArrowRight) moveX = 1;
    
    // Determine if running (shift key)
    const isRunning = keyboard.Shift;
    
    // Update movement state
    movementState.running = isRunning && !movementState.sliding && !movementState.dashing;
    
    // Handle dash ability (E key)
    if ((keyboard.e || keyboard.KeyE) && dashCooldown <= 0 && !movementState.dashing) {
        startDash();
    }
    
    // Update dash state
    if (movementState.dashing) {
        updateDash(currentTime);
    }
    
    // Handle slide ability (C key)
    if ((keyboard.c || keyboard.KeyC) && canSlide && !movementState.sliding && 
        movementState.moving && !movementState.jumping && !movementState.falling && slideCooldown <= 0) {
        startSlide();
    }
    
    // Update slide state
    if (movementState.sliding) {
        updateSlide(currentTime);
    }
    
    // Update wall running
    updateWallRun(currentTime);
    
    // Check if player is in air
    const isInAir = !canJump && !movementState.wallRunning;
    
    // Apply movement force if moving and not dashing
    if ((moveX !== 0 || moveZ !== 0) && !movementState.dashing) {
        // Normalize for diagonal movement
        const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
        moveX /= length;
        moveZ /= length;
        
        // Get camera orbit angle if available
        let cameraAngle = 0;
        if (window.gameScene && window.gameScene.getCameraOrbitAngle) {
            cameraAngle = window.gameScene.getCameraOrbitAngle();
        }
        
        // Rotate movement direction based on camera angle
        const rotatedMoveX = moveX * Math.cos(cameraAngle) + moveZ * Math.sin(cameraAngle);
        const rotatedMoveZ = -moveX * Math.sin(cameraAngle) + moveZ * Math.cos(cameraAngle);
        
        // Store rotated movement direction for character rotation
        movementDirection.x = rotatedMoveX;
        movementDirection.z = rotatedMoveZ;
        
        // Calculate force based on current velocity to prevent excessive acceleration
        const currentVelocity = new CANNON.Vec3(playerBody.velocity.x, 0, playerBody.velocity.z);
        const currentSpeed = currentVelocity.length();
        
        // Determine target speed based on movement state
        let targetSpeed = PLAYER_MOVE_SPEED;
        if (movementState.running) targetSpeed = PLAYER_RUN_SPEED;
        if (movementState.wallRunning) targetSpeed = WALL_RUN_SPEED;
        if (movementState.sliding) targetSpeed = PLAYER_RUN_SPEED * 1.2; // Sliding is faster than running
        
        // Calculate force multiplier based on how close we are to target speed
        // This creates smoother acceleration and deceleration
        let forceMultiplier = 1.0;
        if (currentSpeed > 0) {
            // Reduce force as we approach target speed
            forceMultiplier = Math.max(0.2, 1.0 - (currentSpeed / targetSpeed));
            
            // If we're changing direction, apply more force
            if (currentSpeed > 0.1) {  // Only check direction if we're actually moving
                // Create a normalized copy of the current velocity
                const velocityDirection = new CANNON.Vec3(
                    currentVelocity.x / currentSpeed,
                    currentVelocity.y / currentSpeed,
                    currentVelocity.z / currentSpeed
                );
                
                const movementVector = new CANNON.Vec3(rotatedMoveX, 0, rotatedMoveZ);
                // Normalize movement vector
                const movementLength = Math.sqrt(rotatedMoveX * rotatedMoveX + rotatedMoveZ * rotatedMoveZ);
                if (movementLength > 0) {
                    movementVector.x /= movementLength;
                    movementVector.z /= movementLength;
                }
                
                // Calculate dot product manually
                const dotProduct = velocityDirection.x * movementVector.x + 
                                  velocityDirection.y * movementVector.y + 
                                  velocityDirection.z * movementVector.z;
                
                // If dot product is negative, we're changing direction
                if (dotProduct < 0) {
                    forceMultiplier = 1.0;
                }
            }
        }
        
        // Apply reduced control in air
        if (isInAir && !movementState.wallRunning) {
            forceMultiplier *= AIR_CONTROL;
        }
        
        // Apply force to move the player with the calculated multiplier
        if (!movementState.sliding) {
            playerBody.applyImpulse(
                new CANNON.Vec3(
                    rotatedMoveX * targetSpeed * forceMultiplier, 
                    0, 
                    rotatedMoveZ * targetSpeed * forceMultiplier
                ),
                new CANNON.Vec3(0, 0, 0)
            );
        } else {
            // During slide, only apply directional control at reduced rate
            playerBody.applyImpulse(
                new CANNON.Vec3(
                    rotatedMoveX * targetSpeed * forceMultiplier * 0.3, 
                    0, 
                    rotatedMoveZ * targetSpeed * forceMultiplier * 0.3
                ),
                new CANNON.Vec3(0, 0, 0)
            );
        }
        
        // Apply velocity damping to prevent excessive speed
        const velocity = playerBody.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        
        if (speed > MAX_VELOCITY && !movementState.dashing) {
            const scale = MAX_VELOCITY / speed;
            playerBody.velocity.x *= scale;
            playerBody.velocity.z *= scale;
        }
        
        // Update movement state
        movementState.moving = true;
    } else if (!movementState.dashing && !movementState.sliding) {
        // Apply damping when not actively moving
        playerBody.velocity.x *= MOVEMENT_DAMPING;
        playerBody.velocity.z *= MOVEMENT_DAMPING;
        
        // Not moving
        movementState.moving = false;
    }
    
    // Handle jumping
    const jumpCooldownElapsed = currentTime - lastJumpTime > JUMP_COOLDOWN;
    
    if ((keyboard[' '] || keyboard.Space) && jumpCooldownElapsed) {
        if (canJump) {
            // First jump
            playerBody.velocity.y = PLAYER_JUMP_FORCE;
            canJump = false;
            hasDoubleJump = true; // Enable double jump
            lastJumpTime = currentTime;
            
            // Update movement state
            movementState.jumping = true;
            movementState.doubleJumping = false;
            movementState.sliding = false;
            
            // Play jump sound if available
            if (window.audio && window.audio.playSound) {
                window.audio.playSound('jump');
            }
        } else if (movementState.wallRunning) {
            // Wall jump - jump away from wall
            performWallJump();
            lastJumpTime = currentTime;
        } else if (hasDoubleJump) {
            // Double jump
            playerBody.velocity.y = PLAYER_DOUBLE_JUMP_FORCE;
            hasDoubleJump = false;
            lastJumpTime = currentTime;
            
            // Update movement state
            movementState.doubleJumping = true;
            
            // Play double jump sound if available
            if (window.audio && window.audio.playSound) {
                window.audio.playSound('doubleJump');
            }
        }
    }
    
    // Update cooldowns
    if (dashCooldown > 0) {
        dashCooldown -= 16; // Approximate time between frames
    }
    
    if (slideCooldown > 0) {
        slideCooldown -= 16;
    }
    
    if (wallRunCooldown > 0) {
        wallRunCooldown -= 16;
    }
    
    // Update movement state based on velocity
    updateMovementState();
}

/**
 * Start a dash in the current movement direction
 */
function startDash() {
    if (dashCooldown <= 0) {
        movementState.dashing = true;
        dashTimer = performance.now();
        
        // Get current movement direction or use facing direction if not moving
        let dashDirection = { x: 0, z: 0 };
        
        if (Math.abs(movementDirection.x) > 0.1 || Math.abs(movementDirection.z) > 0.1) {
            dashDirection = { ...movementDirection };
        } else if (playerBody.quaternion) {
            // Use player's facing direction if not moving
            const rotation = new THREE.Euler().setFromQuaternion(
                new THREE.Quaternion(
                    playerBody.quaternion.x,
                    playerBody.quaternion.y,
                    playerBody.quaternion.z,
                    playerBody.quaternion.w
                )
            );
            dashDirection.x = Math.sin(rotation.y);
            dashDirection.z = Math.cos(rotation.y);
        }
        
        // Normalize direction
        const length = Math.sqrt(dashDirection.x * dashDirection.x + dashDirection.z * dashDirection.z);
        if (length > 0) {
            dashDirection.x /= length;
            dashDirection.z /= length;
            
            // Apply dash force
            playerBody.velocity.x = dashDirection.x * DASH_FORCE;
            playerBody.velocity.z = dashDirection.z * DASH_FORCE;
            
            // Slight upward boost if falling
            if (playerBody.velocity.y < 0) {
                playerBody.velocity.y = Math.max(playerBody.velocity.y, 0);
            }
            
            // Play dash sound if available
            if (window.audio && window.audio.playSound) {
                window.audio.playSound('dash');
            }
            
            // Trigger dash effect if available
            if (window.effects && window.effects.createDashEffect) {
                window.effects.createDashEffect(playerBody.position, dashDirection);
            }
        }
    }
}

/**
 * Update dash state
 */
function updateDash(currentTime) {
    if (movementState.dashing && currentTime - dashTimer >= DASH_DURATION) {
        // End dash
        movementState.dashing = false;
        dashCooldown = DASH_COOLDOWN_TIME;
        
        // Apply damping to smoothly end dash
        playerBody.velocity.x *= 0.5;
        playerBody.velocity.z *= 0.5;
    }
}

/**
 * Start a slide in the current movement direction
 */
function startSlide() {
    if (canSlide && !movementState.sliding && slideCooldown <= 0) {
        movementState.sliding = true;
        slideTimer = performance.now();
        
        // Get current velocity
        const velocity = playerBody.velocity;
        const horizontalSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        
        // Only slide if moving fast enough
        if (horizontalSpeed > 3) {
            // Apply initial slide boost
            const boostFactor = 1.5;
            playerBody.velocity.x *= boostFactor;
            playerBody.velocity.z *= boostFactor;
            
            // Lower player height (handled in character animation)
            
            // Play slide sound if available
            if (window.audio && window.audio.playSound) {
                window.audio.playSound('slide');
            }
        } else {
            // Not moving fast enough, cancel slide
            movementState.sliding = false;
        }
    }
}

/**
 * Update slide state
 */
function updateSlide(currentTime) {
    if (movementState.sliding) {
        if (currentTime - slideTimer >= SLIDE_DURATION) {
            // End slide
            movementState.sliding = false;
            slideCooldown = SLIDE_COOLDOWN_TIME;
        } else {
            // During slide, maintain momentum but apply slight deceleration
            playerBody.velocity.x *= 0.99;
            playerBody.velocity.z *= 0.99;
        }
    }
}

/**
 * Check if player can wall run on a surface
 */
function checkWallRun(contactNormal) {
    // Wall must be vertical (normal horizontal)
    const isVerticalWall = Math.abs(contactNormal.y) < 0.3;
    
    // Player must be moving
    const isMoving = movementState.moving;
    
    // Player must not be on ground
    const isInAir = !canJump;
    
    // Wall run cooldown must be over
    const canWallRunNow = wallRunCooldown <= 0;
    
    return isVerticalWall && isMoving && isInAir && canWallRunNow;
}

/**
 * Start wall running
 */
function startWallRun(contactNormal) {
    // Store wall normal
    wallNormal.x = contactNormal.x;
    wallNormal.z = contactNormal.z;
    
    // Calculate wall run direction (perpendicular to normal)
    const dotProduct = movementDirection.x * wallNormal.x + movementDirection.z * wallNormal.z;
    
    wallRunDirection.x = movementDirection.x - (2 * dotProduct * wallNormal.x);
    wallRunDirection.z = movementDirection.z - (2 * dotProduct * wallNormal.z);
    
    // Normalize direction
    const length = Math.sqrt(wallRunDirection.x * wallRunDirection.x + wallRunDirection.z * wallRunDirection.z);
    if (length > 0) {
        wallRunDirection.x /= length;
        wallRunDirection.z /= length;
    }
    
    // Start wall run
    movementState.wallRunning = true;
    wallRunTimer = performance.now();
    
    // Apply upward force to counter gravity
    playerBody.velocity.y = Math.max(playerBody.velocity.y, 0);
    
    // Play wall run sound if available
    if (window.audio && window.audio.playSound) {
        window.audio.playSound('wallRun');
    }
}

/**
 * Update wall running state
 */
function updateWallRun(currentTime) {
    if (movementState.wallRunning) {
        // Check if wall run time exceeded
        if (currentTime - wallRunTimer >= wallRunMaxTime) {
            endWallRun();
            return;
        }
        
        // Apply force in wall run direction
        playerBody.applyImpulse(
            new CANNON.Vec3(
                wallRunDirection.x * WALL_RUN_SPEED * 0.1,
                0,
                wallRunDirection.z * WALL_RUN_SPEED * 0.1
            ),
            new CANNON.Vec3(0, 0, 0)
        );
        
        // Apply reduced gravity
        playerBody.velocity.y = Math.max(playerBody.velocity.y - 0.1, -2);
        
        // Create wall run particles if available
        if (window.effects && window.effects.createWallRunParticles) {
            window.effects.createWallRunParticles(playerBody.position, wallNormal);
        }
    }
}

/**
 * End wall running
 */
function endWallRun() {
    movementState.wallRunning = false;
    wallRunCooldown = 500; // Cooldown before next wall run
}

/**
 * Perform a wall jump
 */
function performWallJump() {
    // Jump away from wall
    const jumpDirection = {
        x: wallNormal.x,
        z: wallNormal.z
    };
    
    // Apply wall jump force
    playerBody.velocity.y = WALL_JUMP_FORCE;
    playerBody.velocity.x = jumpDirection.x * WALL_JUMP_FORCE * 0.7;
    playerBody.velocity.z = jumpDirection.z * WALL_JUMP_FORCE * 0.7;
    
    // End wall run
    endWallRun();
    
    // Reset double jump
    hasDoubleJump = true;
    
    // Update movement state
    movementState.jumping = true;
    movementState.wallRunning = false;
    
    // Play wall jump sound if available
    if (window.audio && window.audio.playSound) {
        window.audio.playSound('wallJump');
    }
}

/**
 * Update the player's movement state based on velocity
 */
function updateMovementState() {
    // Check if player is falling
    if (playerBody.velocity.y < FALL_THRESHOLD) {
        movementState.falling = true;
        movementState.jumping = false;
    } else if (playerBody.velocity.y > 0) {
        // Still going up
        movementState.falling = false;
    } else if (canJump) {
        // On ground
        movementState.falling = false;
        movementState.jumping = false;
        movementState.doubleJumping = false;
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
    movementState.doubleJumping = false;
    movementState.wallRunning = false;
    
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
    getMovementState,
    createOtherPlayerMesh,
    getMouseControls: function() {
        // Return default mouse controls if not implemented
        return {
            yaw: 0,
            pitch: 0
        };
    }
}; 