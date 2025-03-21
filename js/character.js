/**
 * character.js - Handles character model loading and animations
 * 
 * This file is responsible for loading the character 3D model,
 * managing animations, and updating the character's position and rotation.
 */

// Character variables
let characterModel;
let characterMixer;
let characterClock;
let characterAnimations = {};
let currentAnimation = 'idle';
let isCharacterInitialized = false;

// Animation settings
const CHARACTER_SCALE = 1.5;
const CHARACTER_Y_OFFSET = 0.9; // Offset to place character on ground
const ANIMATION_FADE_TIME = 0.2; // Time to crossfade between animations
const CHARACTER_JUMP_FORCE = 8; // Force applied when character jumps

// Character model URL - we'll use a placeholder until we have a real model
const CHARACTER_MODEL_URL = 'assets/models/character.glb';

/**
 * Initialize the character
 */
function initCharacter() {
    console.log("Initializing character...");
    
    // Create a clock for animations
    characterClock = new THREE.Clock();
    
    // Load character model
    loadCharacterModel();
    
    console.log("Character initialization started");
    return true;
}

/**
 * Load the character model and animations
 */
function loadCharacterModel() {
    // Check if GLTFLoader is available
    if (typeof THREE.GLTFLoader !== 'function') {
        console.error("GLTFLoader not found! Make sure to include it in your HTML.");
        console.log("Available THREE objects:", Object.keys(THREE).join(", "));
        
        // Create a placeholder character
        createPlaceholderCharacter();
        return;
    }
    
    // Create a loader
    const loader = new THREE.GLTFLoader();
    console.log("GLTFLoader created, loading model from:", CHARACTER_MODEL_URL);
    
    // Load the model
    loader.load(
        CHARACTER_MODEL_URL,
        // Called when the model is loaded
        function(gltf) {
            console.log("Character model loaded successfully", gltf);
            
            // Store the model
            characterModel = gltf.scene;
            
            // Scale the model
            characterModel.scale.set(CHARACTER_SCALE, CHARACTER_SCALE, CHARACTER_SCALE);
            
            // Set up shadows
            characterModel.traverse(function(node) {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
                console.log("Character node:", node.name, node.type);
            });
            
            // Add the model to the scene
            if (window.gameScene && window.gameScene.getScene) {
                window.gameScene.getScene().add(characterModel);
                console.log("Added character model to scene");
            } else {
                console.error("gameScene not available, cannot add character model");
            }
            
            // Create animation mixer
            characterMixer = new THREE.AnimationMixer(characterModel);
            console.log("Created animation mixer for character model");
            
            // Store animations
            if (gltf.animations && gltf.animations.length > 0) {
                console.log(`Found ${gltf.animations.length} animations:`, gltf.animations.map(a => a.name).join(", "));
                
                // Map animation names to clips
                gltf.animations.forEach(animation => {
                    const name = animation.name.toLowerCase();
                    characterAnimations[name] = characterMixer.clipAction(animation);
                    console.log(`Added animation: ${name}`);
                });
                
                // Play idle animation by default
                if (characterAnimations['idle']) {
                    characterAnimations['idle'].play();
                    currentAnimation = 'idle';
                    console.log("Playing idle animation by default");
                } else {
                    // If no idle animation, play the first one
                    const firstAnimName = Object.keys(characterAnimations)[0];
                    if (firstAnimName) {
                        characterAnimations[firstAnimName].play();
                        currentAnimation = firstAnimName;
                        console.log(`No idle animation found, playing ${firstAnimName} instead`);
                    }
                }
            } else {
                console.warn("No animations found in the model");
            }
            
            isCharacterInitialized = true;
            console.log("Character setup complete");
        },
        // Called while loading is progressing
        function(xhr) {
            const percent = (xhr.loaded / xhr.total * 100).toFixed(0);
            console.log(`Loading character model: ${percent}%`);
        },
        // Called when loading has errors
        function(error) {
            console.error("Error loading character model:", error);
            
            // Create a placeholder character
            createPlaceholderCharacter();
        }
    );
}

/**
 * Create a placeholder character if model loading fails
 */
function createPlaceholderCharacter() {
    console.log("Creating placeholder character");
    
    // Create a simple character using primitives
    const body = new THREE.Group();
    body.name = "placeholder_character";
    
    // Create body parts
    const torsoGeometry = new THREE.BoxGeometry(0.5, 0.8, 0.3);
    const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const limbGeometry = new THREE.BoxGeometry(0.2, 0.5, 0.2);
    
    const material = new THREE.MeshLambertMaterial({ color: 0x3498db });
    
    // Create torso
    const torso = new THREE.Mesh(torsoGeometry, material);
    torso.position.y = 0.4;
    torso.name = "torso";
    body.add(torso);
    
    // Create head
    const head = new THREE.Mesh(headGeometry, material);
    head.position.y = 1;
    head.name = "head";
    body.add(head);
    
    // Create limbs
    const leftArm = new THREE.Mesh(limbGeometry, material);
    leftArm.position.set(-0.35, 0.4, 0);
    leftArm.name = "leftArm";
    body.add(leftArm);
    
    const rightArm = new THREE.Mesh(limbGeometry, material);
    rightArm.position.set(0.35, 0.4, 0);
    rightArm.name = "rightArm";
    body.add(rightArm);
    
    const leftLeg = new THREE.Mesh(limbGeometry, material);
    leftLeg.position.set(-0.2, -0.15, 0);
    leftLeg.name = "leftLeg";
    body.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(limbGeometry, material);
    rightLeg.position.set(0.2, -0.15, 0);
    rightLeg.name = "rightLeg";
    body.add(rightLeg);
    
    // Set up shadows
    body.traverse(function(node) {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });
    
    // Store as character model
    characterModel = body;
    
    // Add to scene
    if (window.gameScene && window.gameScene.getScene) {
        window.gameScene.getScene().add(characterModel);
        console.log("Added placeholder character to scene");
    } else {
        console.error("gameScene not available, cannot add placeholder character");
    }
    
    // Create a simple animation system for the placeholder
    characterMixer = {
        update: function(deltaTime) {
            // Get player movement state
            let state = { moving: false, running: false, jumping: false, falling: false };
            if (window.player && window.player.getMovementState) {
                state = window.player.getMovementState();
            }
            
            // Get player body
            let playerBody = null;
            if (window.player && window.player.getPlayerBody) {
                playerBody = window.player.getPlayerBody();
            }
            
            if (!playerBody) return;
            
            // Reset rotations
            leftLeg.rotation.set(0, 0, 0);
            rightLeg.rotation.set(0, 0, 0);
            leftArm.rotation.set(0, 0, 0);
            rightArm.rotation.set(0, 0, 0);
            torso.rotation.set(0, 0, 0);
            
            const velocity = playerBody.velocity;
            const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
            const time = performance.now() * 0.005;
            
            if (state.dashing) {
                // Dash animation
                const dashPose = Math.sin(time * 5);
                leftArm.rotation.z = -Math.PI / 4;
                rightArm.rotation.z = Math.PI / 4;
                leftLeg.rotation.x = Math.PI / 6;
                rightLeg.rotation.x = -Math.PI / 6;
                torso.rotation.x = Math.PI / 8;
            } else if (state.sliding) {
                // Slide animation
                torso.rotation.x = Math.PI / 4;
                leftLeg.rotation.x = -Math.PI / 3;
                rightLeg.rotation.x = -Math.PI / 3;
                leftArm.rotation.x = -Math.PI / 4;
                rightArm.rotation.x = -Math.PI / 4;
                
                // Lower character during slide
                body.position.y = -0.5;
            } else if (state.wallRunning) {
                // Wall run animation
                const wallRunCycle = Math.sin(time * 3);
                leftLeg.rotation.x = Math.PI / 4 + wallRunCycle * 0.3;
                rightLeg.rotation.x = Math.PI / 4 - wallRunCycle * 0.3;
                leftArm.rotation.x = -Math.PI / 6 + wallRunCycle * 0.2;
                rightArm.rotation.x = -Math.PI / 6 - wallRunCycle * 0.2;
                torso.rotation.z = Math.PI / 12;
            } else if (state.jumping || state.doubleJumping) {
                // Jump animation
                leftLeg.rotation.x = Math.PI / 6;
                rightLeg.rotation.x = Math.PI / 6;
                leftArm.rotation.x = -Math.PI / 4;
                rightArm.rotation.x = -Math.PI / 4;
                
                // Special pose for double jump
                if (state.doubleJumping) {
                    leftArm.rotation.z = -Math.PI / 4;
                    rightArm.rotation.z = Math.PI / 4;
                }
            } else if (state.falling) {
                // Fall animation
                leftLeg.rotation.x = 0;
                rightLeg.rotation.x = 0;
                leftArm.rotation.x = Math.PI / 6;
                rightArm.rotation.x = Math.PI / 6;
            } else if (speed > 0.5) {
                // Walking/running animation
                const amplitude = Math.min(speed * 0.1, 0.3);
                const frequency = state.running ? 3 : 2;
                
                leftLeg.rotation.x = Math.sin(time * frequency) * amplitude;
                rightLeg.rotation.x = Math.sin(time * frequency + Math.PI) * amplitude;
                leftArm.rotation.x = Math.sin(time * frequency + Math.PI) * amplitude;
                rightArm.rotation.x = Math.sin(time * frequency) * amplitude;
                
                // Slight torso tilt when running
                if (state.running) {
                    torso.rotation.x = Math.PI / 16;
                }
            }
            
            // Reset character height if not sliding
            if (!state.sliding) {
                body.position.y = 0;
            }
        }
    };
    
    // Create simple animations for the placeholder
    characterAnimations = {
        'idle': { play: function() {}, fadeOut: function() {}, reset: function() { return this; }, fadeIn: function() { return this; } },
        'walk': { play: function() {}, fadeOut: function() {}, reset: function() { return this; }, fadeIn: function() { return this; } },
        'run': { play: function() {}, fadeOut: function() {}, reset: function() { return this; }, fadeIn: function() { return this; } },
        'jump': { play: function() {}, fadeOut: function() {}, reset: function() { return this; }, fadeIn: function() { return this; } },
        'fall': { play: function() {}, fadeOut: function() {}, reset: function() { return this; }, fadeIn: function() { return this; } },
        'dash': { play: function() {}, fadeOut: function() {}, reset: function() { return this; }, fadeIn: function() { return this; } },
        'slide': { play: function() {}, fadeOut: function() {}, reset: function() { return this; }, fadeIn: function() { return this; } },
        'wallRun': { play: function() {}, fadeOut: function() {}, reset: function() { return this; }, fadeIn: function() { return this; } }
    };
    
    isCharacterInitialized = true;
    console.log("Placeholder character created and initialized");
}

/**
 * Update character position to match physics body
 */
function updateCharacterPosition(playerBody) {
    if (!characterModel || !playerBody) {
        return;
    }
    
    try {
        // Update position
        characterModel.position.x = playerBody.position.x;
        characterModel.position.y = playerBody.position.y - CHARACTER_Y_OFFSET;
        characterModel.position.z = playerBody.position.z;
    } catch (error) {
        console.error("Error updating character position:", error);
    }
}

/**
 * Update character rotation based on movement direction
 */
function updateCharacterRotation(movementDirection) {
    if (!characterModel || !movementDirection) {
        return 0;
    }
    
    try {
        // Only rotate if we're actually moving
        if (Math.abs(movementDirection.x) > 0.1 || Math.abs(movementDirection.z) > 0.1) {
            // Calculate target rotation
            const targetRotation = Math.atan2(movementDirection.x, movementDirection.z);
            
            // Smoothly rotate towards target
            const currentRotation = characterModel.rotation.y;
            const rotationDiff = targetRotation - currentRotation;
            
            // Handle angle wrapping
            let shortestRotation = ((rotationDiff + Math.PI) % (Math.PI * 2)) - Math.PI;
            if (shortestRotation < -Math.PI) shortestRotation += Math.PI * 2;
            
            // Apply smooth rotation
            characterModel.rotation.y += shortestRotation * 0.1;
            
            return characterModel.rotation.y;
        }
    } catch (error) {
        console.error("Error updating character rotation:", error);
    }
    
    return characterModel ? characterModel.rotation.y : 0;
}

/**
 * Update character animation based on movement state
 */
function updateCharacterAnimation(movementState) {
    // If we don't have animations or character isn't initialized, return
    if (!isCharacterInitialized || !characterAnimations || Object.keys(characterAnimations).length === 0) {
        return currentAnimation;
    }
    
    try {
        let targetAnimation = 'idle';
        
        // Determine which animation to play based on priority
        if (movementState.dashing) {
            targetAnimation = 'dash';
        } else if (movementState.sliding) {
            targetAnimation = 'slide';
        } else if (movementState.wallRunning) {
            targetAnimation = 'wallRun';
        } else if (movementState.doubleJumping) {
            targetAnimation = 'doubleJump';
        } else if (movementState.jumping) {
            targetAnimation = 'jump';
        } else if (movementState.falling) {
            targetAnimation = 'fall';
        } else if (movementState.moving) {
            if (movementState.running) {
                targetAnimation = 'run';
            } else {
                targetAnimation = 'walk';
            }
        } else {
            targetAnimation = 'idle';
        }
        
        // If we don't have the target animation, use a fallback
        if (!characterAnimations[targetAnimation]) {
            // Define fallback animations
            const fallbacks = {
                'dash': 'run',
                'slide': 'run',
                'wallRun': 'jump',
                'doubleJump': 'jump',
                'jump': 'idle',
                'fall': 'idle',
                'run': 'walk',
                'walk': 'idle'
            };
            
            // Try to use the fallback animation
            if (fallbacks[targetAnimation] && characterAnimations[fallbacks[targetAnimation]]) {
                targetAnimation = fallbacks[targetAnimation];
            } else {
                // If we still don't have a valid animation, use the first available one
                const availableAnimations = Object.keys(characterAnimations);
                if (availableAnimations.length > 0) {
                    targetAnimation = availableAnimations[0];
                    console.log(`No suitable animation found, using ${targetAnimation} as fallback`);
                } else {
                    console.warn("No animations available");
                    return currentAnimation;
                }
            }
        }
        
        // If animation changed, crossfade to new animation
        if (targetAnimation !== currentAnimation && characterAnimations[targetAnimation]) {
            const current = characterAnimations[currentAnimation];
            const target = characterAnimations[targetAnimation];
            
            if (current && target) {
                // Adjust fade time based on animation type for more natural transitions
                let fadeTime = ANIMATION_FADE_TIME;
                
                // Quick transitions for action animations
                if (targetAnimation === 'jump' || targetAnimation === 'doubleJump' || 
                    targetAnimation === 'fall' || targetAnimation === 'dash' || 
                    targetAnimation === 'slide' || targetAnimation === 'wallRun') {
                    fadeTime = ANIMATION_FADE_TIME / 2;
                }
                
                // Slower transitions between walk and run
                if ((currentAnimation === 'walk' && targetAnimation === 'run') || 
                    (currentAnimation === 'run' && targetAnimation === 'walk')) {
                    fadeTime = ANIMATION_FADE_TIME * 1.5;
                }
                
                // Special handling for dash animation
                if (targetAnimation === 'dash') {
                    // Make dash animation play faster
                    target.timeScale = 1.5;
                } else {
                    // Reset time scale for other animations
                    target.timeScale = 1.0;
                }
                
                // Special handling for slide animation
                if (targetAnimation === 'slide') {
                    // Make slide animation loop during the slide
                    target.setLoop(THREE.LoopRepeat);
                } else if (target.getLoop && target.getLoop() !== THREE.LoopRepeat) {
                    // Reset loop mode for other animations if needed
                    target.setLoop(THREE.LoopRepeat);
                }
                
                current.fadeOut(fadeTime);
                target.reset().fadeIn(fadeTime).play();
                
                console.log(`Changed animation from ${currentAnimation} to ${targetAnimation}`);
                currentAnimation = targetAnimation;
            }
        }
    } catch (error) {
        console.error("Error updating character animation:", error);
    }
    
    return currentAnimation;
}

/**
 * Update character animations
 */
function updateCharacter(deltaTime) {
    if (!isCharacterInitialized) {
        return;
    }
    
    try {
        // Update animation mixer
        if (characterMixer && typeof characterMixer.update === 'function') {
            characterMixer.update(deltaTime);
        }
    } catch (error) {
        console.error("Error updating character animations:", error);
    }
}

/**
 * Check if character is initialized
 */
function isInitialized() {
    return isCharacterInitialized;
}

// Export character functions
window.character = {
    initCharacter,
    updateCharacter,
    updateCharacterPosition,
    updateCharacterRotation,
    updateCharacterAnimation,
    isInitialized
}; 