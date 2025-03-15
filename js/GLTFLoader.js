/**
 * GLTFLoader.js - A minimal stub for the Three.js GLTFLoader
 * 
 * This is a placeholder for the actual Three.js GLTFLoader.
 * In a real implementation, you would use the full Three.js GLTFLoader.
 */

// Add stub implementations for animation classes if they don't exist
if (!THREE.AnimationClip) {
    THREE.AnimationClip = class AnimationClip {
        constructor(name, duration, tracks) {
            this.name = name;
            this.duration = duration;
            this.tracks = tracks || [];
            console.log(`Created AnimationClip: ${name}, duration: ${duration}`);
        }
    };
}

if (!THREE.VectorKeyframeTrack) {
    THREE.VectorKeyframeTrack = class VectorKeyframeTrack {
        constructor(name, times, values) {
            this.name = name;
            this.times = times;
            this.values = values;
            console.log(`Created VectorKeyframeTrack: ${name}`);
        }
    };
}

if (!THREE.QuaternionKeyframeTrack) {
    THREE.QuaternionKeyframeTrack = class QuaternionKeyframeTrack {
        constructor(name, times, values) {
            this.name = name;
            this.times = times;
            this.values = values;
            console.log(`Created QuaternionKeyframeTrack: ${name}`);
        }
    };
}

if (!THREE.AnimationMixer) {
    THREE.AnimationMixer = class AnimationMixer {
        constructor(root) {
            this.root = root;
            this.actions = {};
            this._activeActions = [];
            this._time = 0;
            console.log("Stub AnimationMixer created for", root);
        }
        
        update(deltaTime) {
            // Update animation time
            this._time += deltaTime;
            
            // Update active actions
            this._activeActions.forEach(action => {
                if (action._isPlaying) {
                    // Apply animation to the object
                    const time = (this._time * action._timeScale) % action._clip.duration;
                    
                    // If this is a leg or arm animation, apply some movement
                    if (action._clip.name === 'walk' || action._clip.name === 'run') {
                        const speed = action._clip.name === 'walk' ? 1 : 2;
                        const amplitude = action._clip.name === 'walk' ? 0.1 : 0.2;
                        
                        // Find limbs in the model and animate them
                        this.root.traverse(node => {
                            if (node.name && node.name.toLowerCase().includes('leg')) {
                                node.rotation.x = Math.sin(this._time * speed * 5) * amplitude;
                            }
                            if (node.name && node.name.toLowerCase().includes('arm')) {
                                node.rotation.x = Math.sin(this._time * speed * 5 + Math.PI) * amplitude;
                            }
                        });
                    }
                    
                    // If this is a jump animation, apply a jump motion
                    if (action._clip.name === 'jump') {
                        // Simple jump animation
                        const jumpProgress = Math.min(1, (this._time % action._clip.duration) / action._clip.duration);
                        const jumpHeight = Math.sin(jumpProgress * Math.PI) * 0.5;
                        
                        // Apply to root if possible
                        if (this.root.position) {
                            // Store original position if not already stored
                            if (!this.root._originalY) {
                                this.root._originalY = this.root.position.y;
                            }
                            
                            // Apply jump height on top of original position
                            this.root.position.y = this.root._originalY + jumpHeight;
                        }
                    }
                }
            });
            
            return this;
        }
        
        clipAction(clip) {
            console.log(`Creating clip action for: ${clip.name}`);
            
            // Check if we already have this action
            if (this.actions[clip.name]) {
                console.log(`Returning existing action for: ${clip.name}`);
                return this.actions[clip.name];
            }
            
            // Create a new action
            const action = {
                _clip: clip,
                _timeScale: 1,
                _weight: 1,
                _isPlaying: false,
                _mixer: this,
                
                play: function() {
                    this._isPlaying = true;
                    if (!this._mixer._activeActions.includes(this)) {
                        this._mixer._activeActions.push(this);
                    }
                    console.log(`Playing animation: ${this._clip.name}`);
                    return this;
                },
                
                stop: function() {
                    this._isPlaying = false;
                    const index = this._mixer._activeActions.indexOf(this);
                    if (index !== -1) {
                        this._mixer._activeActions.splice(index, 1);
                    }
                    console.log(`Stopped animation: ${this._clip.name}`);
                    return this;
                },
                
                reset: function() {
                    console.log(`Reset animation: ${this._clip.name}`);
                    return this;
                },
                
                setEffectiveTimeScale: function(timeScale) {
                    this._timeScale = timeScale;
                    return this;
                },
                
                setEffectiveWeight: function(weight) {
                    this._weight = weight;
                    return this;
                },
                
                crossFadeFrom: function(fromAction, duration, warp) {
                    if (fromAction && fromAction._isPlaying) {
                        console.log(`Crossfade from ${fromAction._clip.name} to ${this._clip.name}`);
                        fromAction.stop();
                    }
                    return this;
                },
                
                fadeIn: function(duration) {
                    console.log(`Fade in ${this._clip.name} over ${duration}s`);
                    return this;
                },
                
                fadeOut: function(duration) {
                    console.log(`Fade out ${this._clip.name} over ${duration}s`);
                    setTimeout(() => {
                        this.stop();
                    }, duration * 1000);
                    return this;
                }
            };
            
            // Store the action
            this.actions[clip.name] = action;
            
            return action;
        }
    };
}

// Create a stub for the GLTFLoader
THREE.GLTFLoader = class GLTFLoader {
    constructor() {
        console.log("GLTFLoader initialized (stub version)");
    }
    
    load(url, onLoad, onProgress, onError) {
        console.log(`Loading model from ${url} (stub version)`);
        
        // Create a humanoid character model
        const characterGroup = new THREE.Group();
        characterGroup.name = "character";
        
        // Create body parts with better proportions
        const torsoGeometry = new THREE.BoxGeometry(0.5, 0.8, 0.3);
        const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const upperLimbGeometry = new THREE.BoxGeometry(0.2, 0.4, 0.2);
        const lowerLimbGeometry = new THREE.BoxGeometry(0.15, 0.4, 0.15);
        
        const material = new THREE.MeshStandardMaterial({ color: 0x3498db });
        
        // Create torso
        const torso = new THREE.Mesh(torsoGeometry, material);
        torso.position.y = 0.4;
        torso.name = "torso";
        characterGroup.add(torso);
        
        // Create head
        const head = new THREE.Mesh(headGeometry, material);
        head.position.y = 1;
        head.name = "head";
        characterGroup.add(head);
        
        // Create upper limbs
        const leftUpperArm = new THREE.Mesh(upperLimbGeometry, material);
        leftUpperArm.position.set(-0.35, 0.6, 0);
        leftUpperArm.name = "leftUpperArm";
        characterGroup.add(leftUpperArm);
        
        const rightUpperArm = new THREE.Mesh(upperLimbGeometry, material);
        rightUpperArm.position.set(0.35, 0.6, 0);
        rightUpperArm.name = "rightUpperArm";
        characterGroup.add(rightUpperArm);
        
        // Create lower limbs
        const leftLowerArm = new THREE.Mesh(lowerLimbGeometry, material);
        leftLowerArm.position.set(-0.35, 0.2, 0);
        leftLowerArm.name = "leftLowerArm";
        characterGroup.add(leftLowerArm);
        
        const rightLowerArm = new THREE.Mesh(lowerLimbGeometry, material);
        rightLowerArm.position.set(0.35, 0.2, 0);
        rightLowerArm.name = "rightLowerArm";
        characterGroup.add(rightLowerArm);
        
        // Create legs
        const leftUpperLeg = new THREE.Mesh(upperLimbGeometry, material);
        leftUpperLeg.position.set(-0.2, -0.15, 0);
        leftUpperLeg.name = "leftUpperLeg";
        characterGroup.add(leftUpperLeg);
        
        const rightUpperLeg = new THREE.Mesh(upperLimbGeometry, material);
        rightUpperLeg.position.set(0.2, -0.15, 0);
        rightUpperLeg.name = "rightUpperLeg";
        characterGroup.add(rightUpperLeg);
        
        const leftLowerLeg = new THREE.Mesh(lowerLimbGeometry, material);
        leftLowerLeg.position.set(-0.2, -0.55, 0);
        leftLowerLeg.name = "leftLowerLeg";
        characterGroup.add(leftLowerLeg);
        
        const rightLowerLeg = new THREE.Mesh(lowerLimbGeometry, material);
        rightLowerLeg.position.set(0.2, -0.55, 0);
        rightLowerLeg.name = "rightLowerLeg";
        characterGroup.add(rightLowerLeg);
        
        // Set up shadows
        characterGroup.traverse(function(node) {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });
        
        // Create a scene to hold the character
        const scene = new THREE.Scene();
        scene.add(characterGroup);
        
        // Create animation clips with more realistic animation data
        const createAnimationClip = (name, duration) => {
            let tracks = [];
            
            switch (name) {
                case 'idle':
                    // Subtle idle animation - slight body movement
                    tracks.push(new THREE.VectorKeyframeTrack(
                        '.position', 
                        [0, duration/2, duration], 
                        [0, 0, 0, 0, 0.05, 0, 0, 0, 0]
                    ));
                    break;
                    
                case 'walk':
                    // Walking animation - leg and arm movement
                    tracks.push(new THREE.QuaternionKeyframeTrack(
                        'leftUpperLeg.quaternion',
                        [0, duration/4, duration/2, duration*3/4, duration],
                        [0, 0, 0, 1, 0.2, 0, 0, 0.98, 0, 0, 0, 1, -0.2, 0, 0, 0.98, 0, 0, 0, 1]
                    ));
                    tracks.push(new THREE.QuaternionKeyframeTrack(
                        'rightUpperLeg.quaternion',
                        [0, duration/4, duration/2, duration*3/4, duration],
                        [0, 0, 0, 1, -0.2, 0, 0, 0.98, 0, 0, 0, 1, 0.2, 0, 0, 0.98, 0, 0, 0, 1]
                    ));
                    tracks.push(new THREE.QuaternionKeyframeTrack(
                        'leftUpperArm.quaternion',
                        [0, duration/4, duration/2, duration*3/4, duration],
                        [0, 0, 0, 1, -0.1, 0, 0, 0.99, 0, 0, 0, 1, 0.1, 0, 0, 0.99, 0, 0, 0, 1]
                    ));
                    tracks.push(new THREE.QuaternionKeyframeTrack(
                        'rightUpperArm.quaternion',
                        [0, duration/4, duration/2, duration*3/4, duration],
                        [0, 0, 0, 1, 0.1, 0, 0, 0.99, 0, 0, 0, 1, -0.1, 0, 0, 0.99, 0, 0, 0, 1]
                    ));
                    break;
                    
                case 'run':
                    // Running animation - faster leg and arm movement
                    tracks.push(new THREE.QuaternionKeyframeTrack(
                        'leftUpperLeg.quaternion',
                        [0, duration/4, duration/2, duration*3/4, duration],
                        [0, 0, 0, 1, 0.3, 0, 0, 0.95, 0, 0, 0, 1, -0.3, 0, 0, 0.95, 0, 0, 0, 1]
                    ));
                    tracks.push(new THREE.QuaternionKeyframeTrack(
                        'rightUpperLeg.quaternion',
                        [0, duration/4, duration/2, duration*3/4, duration],
                        [0, 0, 0, 1, -0.3, 0, 0, 0.95, 0, 0, 0, 1, 0.3, 0, 0, 0.95, 0, 0, 0, 1]
                    ));
                    tracks.push(new THREE.QuaternionKeyframeTrack(
                        'leftUpperArm.quaternion',
                        [0, duration/4, duration/2, duration*3/4, duration],
                        [0, 0, 0, 1, -0.2, 0, 0, 0.98, 0, 0, 0, 1, 0.2, 0, 0, 0.98, 0, 0, 0, 1]
                    ));
                    tracks.push(new THREE.QuaternionKeyframeTrack(
                        'rightUpperArm.quaternion',
                        [0, duration/4, duration/2, duration*3/4, duration],
                        [0, 0, 0, 1, 0.2, 0, 0, 0.98, 0, 0, 0, 1, -0.2, 0, 0, 0.98, 0, 0, 0, 1]
                    ));
                    break;
                    
                case 'jump':
                    // Jump animation
                    tracks.push(new THREE.VectorKeyframeTrack(
                        '.position',
                        [0, duration/2, duration],
                        [0, 0, 0, 0, 0.5, 0, 0, 0, 0]
                    ));
                    tracks.push(new THREE.QuaternionKeyframeTrack(
                        'leftUpperLeg.quaternion',
                        [0, duration/2, duration],
                        [0, 0, 0, 1, -0.2, 0, 0, 0.98, 0, 0, 0, 1]
                    ));
                    tracks.push(new THREE.QuaternionKeyframeTrack(
                        'rightUpperLeg.quaternion',
                        [0, duration/2, duration],
                        [0, 0, 0, 1, -0.2, 0, 0, 0.98, 0, 0, 0, 1]
                    ));
                    break;
                    
                case 'fall':
                    // Fall animation
                    tracks.push(new THREE.QuaternionKeyframeTrack(
                        '.quaternion',
                        [0, duration],
                        [0, 0, 0, 1, 0.1, 0, 0, 0.995]
                    ));
                    tracks.push(new THREE.QuaternionKeyframeTrack(
                        'leftUpperLeg.quaternion',
                        [0, duration],
                        [0, 0, 0, 1, 0.2, 0, 0, 0.98]
                    ));
                    tracks.push(new THREE.QuaternionKeyframeTrack(
                        'rightUpperLeg.quaternion',
                        [0, duration],
                        [0, 0, 0, 1, 0.2, 0, 0, 0.98]
                    ));
                    break;
            }
            
            return new THREE.AnimationClip(name, duration, tracks);
        };
        
        // Create animations with appropriate durations
        const animations = [
            createAnimationClip('idle', 2),
            createAnimationClip('walk', 1),
            createAnimationClip('run', 0.6),
            createAnimationClip('jump', 1),
            createAnimationClip('fall', 1)
        ];
        
        console.log(`Created ${animations.length} animations for character model`);
        
        // Call the onLoad callback with a fake GLTF object
        setTimeout(() => {
            if (onLoad) {
                console.log("Calling onLoad callback with character model and animations");
                onLoad({
                    scene: scene,
                    animations: animations
                });
            }
        }, 500); // Reduced timeout for faster loading
        
        // Simulate progress
        if (onProgress) {
            let progress = 0;
            const interval = setInterval(() => {
                progress += 20; // Faster progress updates
                onProgress({ loaded: progress, total: 100 });
                
                if (progress >= 100) {
                    clearInterval(interval);
                }
            }, 100);
        }
    }
}; 