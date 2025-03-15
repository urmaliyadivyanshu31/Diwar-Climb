/**
 * physics.js - Handles physics simulation using Cannon.js
 * 
 * This file is responsible for setting up and updating the physics world,
 * handling collisions, and providing physics-related utilities.
 */

// Physics variables
let world; // Cannon.js physics world
let fixedTimeStep = 1.0 / 60.0; // Physics update rate (60 Hz)
let maxSubSteps = 3; // Maximum physics sub-steps per frame
let physicsLastTime; // Last timestamp for physics update
let keyboard = {}; // Keyboard state

// Physics constants
const GRAVITY = -15; // Stronger gravity for better game feel
const AIR_RESISTANCE = 0.01; // Air resistance coefficient
const TERMINAL_VELOCITY = -30; // Terminal velocity in m/s
const GROUND_FRICTION = 0.3; // Ground friction coefficient
const GROUND_RESTITUTION = 0.2; // Ground bounciness

/**
 * Initialize the Cannon.js physics world
 */
function initPhysics() {
    // Create a new Cannon.js world with gravity
    world = new CANNON.World();
    world.gravity.set(0, GRAVITY, 0); // Enhanced gravity
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10; // Increase solver iterations for better stability
    
    // Set up ground plane
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
        mass: 0, // Mass of 0 makes it static
        shape: groundShape,
        material: new CANNON.Material({
            friction: GROUND_FRICTION,
            restitution: GROUND_RESTITUTION
        })
    });
    
    // Rotate ground to be horizontal (facing up)
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    groundBody.position.set(0, -1, 0); // Position slightly below origin
    
    // Add ground to world
    world.addBody(groundBody);
    
    // Set up keyboard event listeners
    setupKeyboardControls();
    
    // Initialize last time for physics update
    physicsLastTime = performance.now();
    
    console.log("Physics world initialized");
    
    return world;
}

// Set up keyboard controls
function setupKeyboardControls() {
    // Key down event
    window.addEventListener('keydown', (event) => {
        keyboard[event.key] = true;
    });
    
    // Key up event
    window.addEventListener('keyup', (event) => {
        keyboard[event.key] = false;
    });
}

/**
 * Update the physics simulation by one time step
 */
function updatePhysics() {
    // Calculate time since last update
    const time = performance.now();
    const dt = (time - physicsLastTime) / 1000; // Convert to seconds
    
    // Apply air resistance and terminal velocity to all dynamic bodies
    applyAirResistance();
    
    // Update physics world
    world.step(fixedTimeStep, dt, maxSubSteps);
    
    // Update last time
    physicsLastTime = time;
}

/**
 * Apply air resistance and terminal velocity to all dynamic bodies
 */
function applyAirResistance() {
    // Loop through all bodies in the world
    for (let i = 0; i < world.bodies.length; i++) {
        const body = world.bodies[i];
        
        // Only apply to dynamic bodies (mass > 0)
        if (body.mass > 0) {
            // Apply air resistance (proportional to velocity squared)
            const velocity = body.velocity;
            const speed = velocity.length();
            
            if (speed > 0) {
                // Calculate air resistance force
                const resistanceX = -velocity.x * speed * AIR_RESISTANCE;
                const resistanceY = -velocity.y * speed * AIR_RESISTANCE;
                const resistanceZ = -velocity.z * speed * AIR_RESISTANCE;
                
                // Apply resistance force
                body.applyForce(new CANNON.Vec3(resistanceX, resistanceY, resistanceZ), body.position);
            }
            
            // Apply terminal velocity limit
            if (velocity.y < TERMINAL_VELOCITY) {
                velocity.y = TERMINAL_VELOCITY;
            }
        }
    }
}

// Get the physics world
function getWorld() {
    return world;
}

// Get the keyboard state
function getKeyboard() {
    return keyboard;
}

/**
 * Set the gravity of the physics world
 * @param {number} gravity - Gravity value (negative for downward)
 */
function setGravity(gravity) {
    if (world) {
        world.gravity.set(0, gravity, 0);
        console.log(`Physics gravity set to ${gravity}`);
    }
}

/**
 * Get the current gravity value
 * @returns {number} Current gravity value
 */
function getGravity() {
    if (world) {
        return world.gravity.y;
    }
    return GRAVITY;
}

// Export physics functions
window.physics = {
    initPhysics,
    updatePhysics,
    getWorld,
    getKeyboard,
    setGravity,
    getGravity
}; 