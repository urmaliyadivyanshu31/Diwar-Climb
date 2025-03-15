/**
 * environment.js - Handles the city environment, skybox, and ambient sounds
 * 
 * This file is responsible for creating and managing the city environment,
 * including buildings, streets, skybox, and ambient sounds.
 */

// Environment variables
let skybox;
let cityBlocks = [];
let ambientSound;
let backgroundMusic;
let fogEnabled = true;
let skyboxSize = 1000;
let decorations = []; // Trees, lampposts, etc.

// City configuration
const CITY_SIZE = 200; // Size of the city in world units
const BLOCK_SIZE = 20; // Size of a city block
const BUILDING_DENSITY = 0.7; // Probability of a building appearing in a block
const MAX_BUILDING_HEIGHT = 50; // Maximum height of buildings
const MIN_BUILDING_HEIGHT = 10; // Minimum height of buildings
const STREET_WIDTH = 10; // Width of streets
const DECORATION_DENSITY = 0.3; // Probability of decorations appearing

/**
 * Initialize the environment
 */
function initEnvironment() {
    console.log("Initializing environment...");
    
    // Create skybox
    createSkybox();
    
    // Add fog to the scene
    addFog();
    
    // Create city blocks
    createCityBlocks();
    
    // Add decorative elements
    addDecorations();
    
    // Add ground plane with texture
    createGround();
    
    // Load and play ambient sounds
    initAmbientSounds();
    
    console.log("Environment initialized");
}

/**
 * Create a skybox for the scene
 */
function createSkybox() {
    // Create a proper skybox with textures
    const scene = window.gameScene.getScene();
    
    // For now, we'll use a gradient sky
    const topColor = new THREE.Color(0x0077ff); // Blue
    const bottomColor = new THREE.Color(0xffffff); // White
    
    const uniforms = {
        topColor: { value: topColor },
        bottomColor: { value: bottomColor },
        offset: { value: 33 },
        exponent: { value: 0.6 }
    };
    
    // Create sky shader
    const skyGeo = new THREE.SphereGeometry(skyboxSize, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform float offset;
            uniform float exponent;
            varying vec3 vWorldPosition;
            void main() {
                float h = normalize(vWorldPosition + offset).y;
                gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
            }
        `,
        side: THREE.BackSide
    });
    
    skybox = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skybox);
    
    console.log("Skybox created");
}

/**
 * Create a textured ground plane
 */
function createGround() {
    const scene = window.gameScene.getScene();
    
    // Create a large ground plane
    const groundSize = CITY_SIZE * 2;
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 32, 32);
    
    // Create a more visually appealing texture for the ground
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const context = canvas.getContext('2d');
    
    // Fill with base color
    const baseColor = '#555555';
    context.fillStyle = baseColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw main grid lines
    context.strokeStyle = '#666666';
    context.lineWidth = 3;
    
    const gridSize = 128;
    for (let i = 0; i <= canvas.width; i += gridSize) {
        context.beginPath();
        context.moveTo(i, 0);
        context.lineTo(i, canvas.height);
        context.stroke();
        
        context.beginPath();
        context.moveTo(0, i);
        context.lineTo(canvas.width, i);
        context.stroke();
    }
    
    // Draw smaller grid lines
    context.strokeStyle = '#5A5A5A';
    context.lineWidth = 1;
    
    const smallGridSize = 32;
    for (let i = 0; i <= canvas.width; i += smallGridSize) {
        // Skip if this is already a main grid line
        if (i % gridSize === 0) continue;
        
        context.beginPath();
        context.moveTo(i, 0);
        context.lineTo(i, canvas.height);
        context.stroke();
        
        context.beginPath();
        context.moveTo(0, i);
        context.lineTo(canvas.width, i);
        context.stroke();
    }
    
    // Add some random noise for texture
    for (let i = 0; i < 5000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 2 + 1;
        const brightness = Math.random() * 20 + 40;
        
        context.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
        context.fillRect(x, y, size, size);
    }
    
    // Create texture from canvas
    const groundTexture = new THREE.CanvasTexture(canvas);
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(20, 20);
    
    // Create material with texture
    const groundMaterial = new THREE.MeshLambertMaterial({
        map: groundTexture,
        side: THREE.FrontSide
    });
    
    // Create mesh and position it
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.position.y = -1; // Slightly below origin
    ground.receiveShadow = true;
    
    scene.add(ground);
    
    console.log("Ground plane created with enhanced texture");
}

/**
 * Add decorative elements to the environment
 */
function addDecorations() {
    const scene = window.gameScene.getScene();
    
    // Create trees, lampposts, etc.
    for (let x = -CITY_SIZE / 2; x < CITY_SIZE / 2; x += BLOCK_SIZE) {
        for (let z = -CITY_SIZE / 2; z < CITY_SIZE / 2; z += BLOCK_SIZE) {
            // Only add decorations along streets
            if (x % (BLOCK_SIZE * 3) === 0 || z % (BLOCK_SIZE * 3) === 0) {
                if (Math.random() < DECORATION_DENSITY) {
                    // Decide what type of decoration to add
                    const decorationType = Math.random() < 0.7 ? 'tree' : 'lamppost';
                    
                    if (decorationType === 'tree') {
                        createTree(x, z, scene);
                    } else {
                        createLamppost(x, z, scene);
                    }
                }
            }
        }
    }
    
    console.log("Decorations added");
}

/**
 * Create a simple tree
 */
function createTree(x, z, scene) {
    // Create tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 4, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    
    // Create tree top (leaves)
    const leavesGeometry = new THREE.ConeGeometry(3, 6, 8);
    const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 }); // Forest green
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = 5;
    
    // Create tree group
    const tree = new THREE.Group();
    tree.add(trunk);
    tree.add(leaves);
    
    // Position the tree
    tree.position.set(x, 0, z);
    
    // Add to scene
    scene.add(tree);
    
    // Store for later reference
    decorations.push(tree);
}

/**
 * Create a simple lamppost
 */
function createLamppost(x, z, scene) {
    // Create pole
    const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 8, 8);
    const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 }); // Dark gray
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    
    // Create lamp
    const lampGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const lampMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF99, emissive: 0xFFFF99 }); // Yellow light
    const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
    lamp.position.y = 4;
    
    // Create light source
    const light = new THREE.PointLight(0xFFFF99, 1, 15);
    light.position.y = 4;
    
    // Create lamppost group
    const lamppost = new THREE.Group();
    lamppost.add(pole);
    lamppost.add(lamp);
    lamppost.add(light);
    
    // Position the lamppost
    lamppost.position.set(x, 0, z);
    
    // Add to scene
    scene.add(lamppost);
    
    // Store for later reference
    decorations.push(lamppost);
}

/**
 * Add fog to the scene
 */
function addFog() {
    if (fogEnabled) {
        const scene = window.gameScene.getScene();
        scene.fog = new THREE.FogExp2(0xCCCCCC, 0.005);
        console.log("Fog added to scene");
    }
}

/**
 * Create city blocks with buildings
 */
function createCityBlocks() {
    const scene = window.gameScene.getScene();
    const world = window.physics.getWorld();
    
    // Calculate number of blocks in each direction
    const blocksPerSide = Math.floor(CITY_SIZE / BLOCK_SIZE);
    
    // Create a grid of city blocks
    for (let x = -blocksPerSide / 2; x < blocksPerSide / 2; x++) {
        for (let z = -blocksPerSide / 2; z < blocksPerSide / 2; z++) {
            // Skip some blocks to create streets
            if (x % 3 === 0 || z % 3 === 0) continue;
            
            // Position of this block
            const posX = x * BLOCK_SIZE;
            const posZ = z * BLOCK_SIZE;
            
            // Create buildings with random probability
            if (Math.random() < BUILDING_DENSITY) {
                createBuilding(posX, posZ, scene, world);
            }
        }
    }
    
    console.log("City blocks created");
}

/**
 * Create a building at the specified position
 */
function createBuilding(x, z, scene, world) {
    // Random building properties
    const width = BLOCK_SIZE * (0.5 + Math.random() * 0.5);
    const depth = BLOCK_SIZE * (0.5 + Math.random() * 0.5);
    const height = MIN_BUILDING_HEIGHT + Math.random() * (MAX_BUILDING_HEIGHT - MIN_BUILDING_HEIGHT);
    
    // Create building mesh
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshLambertMaterial({
        color: getRandomBuildingColor()
    });
    const building = new THREE.Mesh(geometry, material);
    
    // Position the building
    building.position.set(x, height / 2, z);
    scene.add(building);
    
    // Create building physics body (static)
    const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
    const body = new CANNON.Body({
        mass: 0, // Static body
        position: new CANNON.Vec3(x, height / 2, z),
        shape: shape
    });
    world.addBody(body);
    
    // Store building data
    cityBlocks.push({
        mesh: building,
        body: body
    });
}

/**
 * Get a random color for buildings
 */
function getRandomBuildingColor() {
    // Array of possible building colors
    const colors = [
        0x888888, // Gray
        0xA5A5A5, // Light gray
        0x666666, // Dark gray
        0xB8B8B8, // Silver
        0xD3D3D3, // Light silver
        0x708090, // Slate gray
        0x778899  // Light slate gray
    ];
    
    // Return a random color from the array
    return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Initialize ambient sounds and background music
 */
function initAmbientSounds() {
    // In a real implementation, we would load and play audio files
    console.log("Ambient sounds not implemented yet");
}

/**
 * Update the environment
 */
function updateEnvironment() {
    // Update any dynamic elements in the environment
    // For now, we don't have any dynamic elements
}

/**
 * Toggle fog on/off
 */
function toggleFog() {
    const scene = window.gameScene.getScene();
    
    fogEnabled = !fogEnabled;
    
    if (fogEnabled) {
        scene.fog = new THREE.FogExp2(0xCCCCCC, 0.005);
    } else {
        scene.fog = null;
    }
    
    console.log(`Fog ${fogEnabled ? 'enabled' : 'disabled'}`);
}

/**
 * Clean up environment resources
 */
function cleanupEnvironment() {
    const scene = window.gameScene.getScene();
    const world = window.physics.getWorld();
    
    // Remove all city blocks
    cityBlocks.forEach(block => {
        scene.remove(block.mesh);
        world.removeBody(block.body);
    });
    
    // Clear the array
    cityBlocks = [];
    
    console.log("Environment cleaned up");
}

// Export environment functions
window.environment = {
    initEnvironment,
    updateEnvironment,
    toggleFog,
    cleanupEnvironment,
    createTree,
    createLamppost,
    addDecorations
}; 