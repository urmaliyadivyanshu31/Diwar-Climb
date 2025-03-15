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

/**
 * Initialize the Cannon.js physics world
 */
function initPhysics() {
    // Create a new Cannon.js world with gravity
    world = new CANNON.World();
    world.gravity.set(0, -9.82, 0); // Earth gravity
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10; // Increase solver iterations for better stability
    
    // Set up ground plane
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
        mass: 0, // Mass of 0 makes it static
        shape: groundShape,
        material: new CANNON.Material({
            friction: 0.3,
            restitution: 0.3
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
    
    // Update physics world
    world.step(fixedTimeStep, dt, maxSubSteps);
    
    // Update last time
    physicsLastTime = time;
}

// Get the physics world
function getWorld() {
    return world;
}

// Get keyboard state
function getKeyboard() {
    return keyboard;
}

// Export physics functions
window.physics = {
    initPhysics,
    updatePhysics,
    getWorld,
    getKeyboard
}; 