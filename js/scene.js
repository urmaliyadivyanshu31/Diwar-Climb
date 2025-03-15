/**
 * scene.js - Handles the Three.js scene setup and rendering
 * 
 * This file is responsible for creating the Three.js scene, camera, renderer,
 * and handling the render loop.
 */

// Scene variables
let scene, camera, renderer;
let sceneClock = new THREE.Clock();
let cameraTarget = { x: 0, y: 0, z: 0 }; // Target position for smooth camera movement
let cameraLookAt = { x: 0, y: 0, z: 0 }; // Target look-at point for smooth camera rotation

// Camera settings
const CAMERA_HEIGHT = 8;
const CAMERA_DISTANCE = 12;
const CAMERA_LERP = 0.1; // Interpolation factor for smooth camera movement
const LOOK_AHEAD_DISTANCE = 5;

// Camera orbit controls
let cameraOrbitAngle = 0; // Horizontal orbit angle in radians
let cameraVerticalAngle = 0; // Vertical orbit angle in radians
let isOrbitEnabled = false; // Whether orbit mode is enabled
const ORBIT_SPEED = 0.005; // Speed of camera orbit
const MAX_VERTICAL_ANGLE = Math.PI / 3; // Maximum vertical angle (60 degrees)
const MIN_VERTICAL_ANGLE = -Math.PI / 6; // Minimum vertical angle (-30 degrees)
let mouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;
let touchStartX = 0;
let touchStartY = 0;

/**
 * Initialize the Three.js scene
 */
function initScene() {
    console.log("Initializing scene...");
    
    // Create scene
    scene = new THREE.Scene();
    
    // Add fog for distance culling and atmosphere
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.005);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(
        75, // Field of view
        window.innerWidth / window.innerHeight, // Aspect ratio
        0.1, // Near clipping plane
        1000 // Far clipping plane
    );
    
    // Create renderer
    renderer = createRenderer();
    
    // Add skybox
    createSkybox();
    
    // Set up lighting
    setupLighting();
    
    // Set up mouse and touch controls for camera orbit
    setupOrbitControls();
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
    
    console.log("Scene initialization complete");
    return scene;
}

/**
 * Create a skybox for the scene
 */
function createSkybox() {
    // Create a procedural skybox using a shader
    const vertexShader = `
        varying vec3 vWorldPosition;
        
        void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;
    
    const fragmentShader = `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        
        varying vec3 vWorldPosition;
        
        void main() {
            float h = normalize(vWorldPosition + offset).y;
            float t = max(0.0, min(1.0, pow((h * 0.5 + 0.5), exponent)));
            gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
        }
    `;
    
    // Create a large sphere for the sky
    const skyGeo = new THREE.SphereGeometry(500, 32, 15);
    
    // Create shader material with gradient colors
    const skyMat = new THREE.ShaderMaterial({
        uniforms: {
            topColor: { value: new THREE.Color(0x0077ff) },
            bottomColor: { value: new THREE.Color(0xffffff) },
            offset: { value: 33 },
            exponent: { value: 0.6 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: THREE.BackSide
    });
    
    // Create and add the skybox
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);
    
    console.log("Skybox created");
}

/**
 * Set up the lighting for the scene
 */
function setupLighting() {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    // Add directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 30);
    directionalLight.castShadow = true;
    
    // Configure shadow properties for better quality
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    directionalLight.shadow.bias = -0.0005;
    
    scene.add(directionalLight);
    
    // Add a hemisphere light for more natural lighting
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x404040, 0.6);
    scene.add(hemisphereLight);
    
    // Add a point light that follows the player for better visibility
    const playerLight = new THREE.PointLight(0xffffff, 0.7, 50);
    playerLight.position.set(0, 10, 0);
    playerLight.castShadow = true;
    playerLight.shadow.mapSize.width = 512;
    playerLight.shadow.mapSize.height = 512;
    scene.add(playerLight);
    
    // Store the player light for updates
    window.gameScene.playerLight = playerLight;
}

/**
 * Handle window resize
 */
function handleResize() {
    // Update camera aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Set up mouse and touch controls for camera orbit
 */
function setupOrbitControls() {
    // Mouse controls
    const canvas = renderer.domElement;
    
    // Mouse down event
    canvas.addEventListener('mousedown', (event) => {
        // Only enable orbit with right mouse button
        if (event.button === 2) {
            mouseDown = true;
            lastMouseX = event.clientX;
            lastMouseY = event.clientY;
            isOrbitEnabled = true;
            
            // Prevent context menu
            canvas.addEventListener('contextmenu', preventContextMenu);
        }
    });
    
    // Mouse move event
    window.addEventListener('mousemove', (event) => {
        if (mouseDown && isOrbitEnabled) {
            const deltaX = event.clientX - lastMouseX;
            const deltaY = event.clientY - lastMouseY;
            
            // Update camera angles
            cameraOrbitAngle -= deltaX * ORBIT_SPEED;
            cameraVerticalAngle -= deltaY * ORBIT_SPEED;
            
            // Clamp vertical angle
            cameraVerticalAngle = Math.max(MIN_VERTICAL_ANGLE, Math.min(MAX_VERTICAL_ANGLE, cameraVerticalAngle));
            
            lastMouseX = event.clientX;
            lastMouseY = event.clientY;
        }
    });
    
    // Mouse up event
    window.addEventListener('mouseup', (event) => {
        if (event.button === 2) {
            mouseDown = false;
            canvas.removeEventListener('contextmenu', preventContextMenu);
        }
    });
    
    // Touch controls for mobile
    canvas.addEventListener('touchstart', (event) => {
        // Use two-finger touch for orbit
        if (event.touches.length === 2) {
            isOrbitEnabled = true;
            touchStartX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
            touchStartY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
            event.preventDefault();
        }
    });
    
    canvas.addEventListener('touchmove', (event) => {
        if (isOrbitEnabled && event.touches.length === 2) {
            const touchX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
            const touchY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
            
            const deltaX = touchX - touchStartX;
            const deltaY = touchY - touchStartY;
            
            // Update camera angles
            cameraOrbitAngle -= deltaX * ORBIT_SPEED * 0.5;
            cameraVerticalAngle -= deltaY * ORBIT_SPEED * 0.5;
            
            // Clamp vertical angle
            cameraVerticalAngle = Math.max(MIN_VERTICAL_ANGLE, Math.min(MAX_VERTICAL_ANGLE, cameraVerticalAngle));
            
            touchStartX = touchX;
            touchStartY = touchY;
            
            event.preventDefault();
        }
    });
    
    canvas.addEventListener('touchend', (event) => {
        if (event.touches.length < 2) {
            isOrbitEnabled = false;
        }
    });
    
    // Trackpad controls
    canvas.addEventListener('wheel', (event) => {
        // Hold Ctrl key for orbit with trackpad
        if (event.ctrlKey || event.metaKey) {
            // Update camera angles
            cameraOrbitAngle -= event.deltaX * ORBIT_SPEED * 0.05;
            cameraVerticalAngle -= event.deltaY * ORBIT_SPEED * 0.05;
            
            // Clamp vertical angle
            cameraVerticalAngle = Math.max(MIN_VERTICAL_ANGLE, Math.min(MAX_VERTICAL_ANGLE, cameraVerticalAngle));
            
            event.preventDefault();
        }
    }, { passive: false });
    
    // Add key controls for orbit mode
    window.addEventListener('keydown', (event) => {
        if (event.key === 'v') {
            // Toggle orbit mode with 'V' key
            isOrbitEnabled = !isOrbitEnabled;
            console.log(`Orbit mode ${isOrbitEnabled ? 'enabled' : 'disabled'}`);
        }
    });
    
    // Function to prevent context menu
    function preventContextMenu(event) {
        event.preventDefault();
    }
}

/**
 * Update the camera to follow the player
 */
function updateCamera() {
    // Check if player module is available
    if (!window.player) {
        console.warn("Player module not available, cannot update camera");
        return;
    }
    
    // Get player position
    const playerPosition = window.player.getPlayerPosition();
    
    // If player position is not available, return
    if (!playerPosition) {
        console.warn("Player position not available, cannot update camera");
        return;
    }
    
    // Calculate ideal camera position based on orbit angle
    let idealCameraPos = {
        x: playerPosition.x,
        y: playerPosition.y + CAMERA_HEIGHT,
        z: playerPosition.z + CAMERA_DISTANCE
    };
    
    // Apply orbit rotation if enabled or in orbit mode
    if (isOrbitEnabled || Math.abs(cameraOrbitAngle) > 0.01 || Math.abs(cameraVerticalAngle) > 0.01) {
        // Calculate camera position based on spherical coordinates
        const horizontalDistance = CAMERA_DISTANCE * Math.cos(cameraVerticalAngle);
        
        idealCameraPos = {
            x: playerPosition.x + horizontalDistance * Math.sin(cameraOrbitAngle),
            y: playerPosition.y + CAMERA_HEIGHT + CAMERA_DISTANCE * Math.sin(cameraVerticalAngle),
            z: playerPosition.z + horizontalDistance * Math.cos(cameraOrbitAngle)
        };
    } else {
        // Get player movement direction for dynamic camera adjustments
        let movementDirection = { x: 0, z: 0 };
        if (window.player.getMovementDirection) {
            movementDirection = window.player.getMovementDirection();
        }
        
        // Adjust camera position based on movement direction for a more dynamic feel
        if (Math.abs(movementDirection.x) > 0.1) {
            // Shift camera slightly to the side when moving left/right
            idealCameraPos.x -= movementDirection.x * 2;
        }
    }
    
    // Calculate ideal look-at point
    const idealLookAt = {
        x: playerPosition.x,
        y: playerPosition.y + LOOK_AHEAD_DISTANCE / 2,
        z: playerPosition.z
    };
    
    // Smoothly interpolate camera position (lerp)
    cameraTarget.x = cameraTarget.x + (idealCameraPos.x - cameraTarget.x) * CAMERA_LERP;
    cameraTarget.y = cameraTarget.y + (idealCameraPos.y - cameraTarget.y) * CAMERA_LERP;
    cameraTarget.z = cameraTarget.z + (idealCameraPos.z - cameraTarget.z) * CAMERA_LERP;
    
    // Smoothly interpolate look-at point
    cameraLookAt.x = cameraLookAt.x + (idealLookAt.x - cameraLookAt.x) * CAMERA_LERP;
    cameraLookAt.y = cameraLookAt.y + (idealLookAt.y - cameraLookAt.y) * CAMERA_LERP;
    cameraLookAt.z = cameraLookAt.z + (idealLookAt.z - cameraLookAt.z) * CAMERA_LERP;
    
    // Update camera position
    camera.position.set(cameraTarget.x, cameraTarget.y, cameraTarget.z);
    
    // Look at the interpolated target
    camera.lookAt(cameraLookAt.x, cameraLookAt.y, cameraLookAt.z);
    
    // Add slight tilt based on player movement for dynamic feel
    if (!isOrbitEnabled && Math.abs(cameraOrbitAngle) < 0.01) {
        // Get player movement direction
        let movementDirection = { x: 0, z: 0 };
        if (window.player.getMovementDirection) {
            movementDirection = window.player.getMovementDirection();
        }
        
        if (Math.abs(movementDirection.x) > 0.1) {
            // Add a slight tilt in the direction of movement
            const tiltAmount = 0.05;
            camera.rotation.z = -movementDirection.x * tiltAmount;
        } else {
            // Smoothly reset tilt when not moving
            camera.rotation.z *= 0.9;
        }
    }
}

/**
 * Main render loop
 */
function animate() {
    requestAnimationFrame(animate);
    
    try {
        // Get delta time for smooth animations
        const deltaTime = sceneClock.getDelta();
        
        // Update physics
        if (window.physics) {
            window.physics.updatePhysics();
        }
        
        // Update player
        if (window.player) {
            window.player.updatePlayer(deltaTime);
        }
        
        // Update character animations
        if (window.character) {
            try {
                if (window.character.isInitialized && window.character.isInitialized()) {
                    window.character.updateCharacter(deltaTime);
                }
            } catch (error) {
                console.error("Error updating character animations:", error);
            }
        }
        
        // Update tiles
        if (window.tiles) {
            window.tiles.updateTiles();
        }
        
        // Update scene (includes camera and other scene elements)
        updateScene(deltaTime);
        
        // Update network
        if (window.network) {
            window.network.updateNetwork();
        }
        
        // Update UI
        if (window.ui) {
            window.ui.updateUI(deltaTime);
        }
        
        // Update debug info if enabled
        if (window.debug && typeof window.debug.isEnabled === 'function' && window.debug.isEnabled()) {
            window.debug.updateDebug(deltaTime);
        }
        
        // Render the scene
        renderer.render(scene, camera);
    } catch (error) {
        console.error("Error in animation loop:", error);
    }
}

/**
 * Start the game
 */
function startGame() {
    console.log("Starting animation loop...");
    
    // Start animation loop
    animate();
    
    console.log("Game started");
}

/**
 * Restart the game
 */
function restartGame() {
    // Reset player
    if (window.player) {
        window.player.restartPlayer();
    } else {
        console.warn("Player module not available, cannot restart player");
    }
    
    // Reset tiles
    if (window.tiles) {
        window.tiles.resetTiles();
    } else {
        console.warn("Tiles module not available, cannot reset tiles");
    }
    
    console.log("Game restarted");
}

/**
 * Get the Three.js scene
 */
function getScene() {
    return scene;
}

/**
 * Get the Three.js camera
 */
function getCamera() {
    return camera;
}

/**
 * Get the Three.js renderer
 */
function getRenderer() {
    return renderer;
}

/**
 * Update the scene
 */
function updateScene(deltaTime) {
    // Update player light position to follow player
    if (window.gameScene && window.gameScene.playerLight && window.player && window.player.getPlayerPosition) {
        try {
            const playerPos = window.player.getPlayerPosition();
            if (playerPos) {
                window.gameScene.playerLight.position.set(
                    playerPos.x,
                    playerPos.y + 5, // Position light above player
                    playerPos.z
                );
            }
        } catch (error) {
            console.warn("Error updating player light:", error);
        }
    }
    
    // Update camera to follow player
    try {
        updateCamera();
    } catch (error) {
        console.warn("Error updating camera:", error);
    }
    
    // Update moving tiles
    if (window.tiles && window.tiles.updateMovingTiles) {
        try {
            window.tiles.updateMovingTiles(deltaTime);
        } catch (error) {
            console.warn("Error updating moving tiles:", error);
        }
    }
}

/**
 * Create and configure the renderer
 */
function createRenderer() {
    // Create WebGL renderer with antialiasing
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance"
    });
    
    // Configure renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Enable shadows
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Enable tone mapping for better color reproduction
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    
    // Add renderer to DOM
    document.body.appendChild(renderer.domElement);
    
    console.log("Renderer created");
    return renderer;
}

/**
 * Get the camera orbit angle
 * @returns {number} Current orbit angle in radians
 */
function getCameraOrbitAngle() {
    return cameraOrbitAngle;
}

// Export scene functions for use in other modules
window.gameScene = {
    initScene,
    getScene,
    getCamera,
    getRenderer,
    updateCamera,
    updateScene,
    animate,
    startGame,
    restartGame,
    getCameraOrbitAngle
}; 