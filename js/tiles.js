/**
 * tiles.js - Handles tile generation and management
 * 
 * This file is responsible for creating and managing the tiles that the player
 * climbs on. It handles the creation, positioning, and physics of tiles.
 */

// Global tile variables
const tiles = []; // Array to store all active tiles
const TILE_SIZE = 10; // Base size of each tile (width and depth)
const TILE_HEIGHT_SPACING = 5; // Vertical distance between tiles
const INITIAL_TILE_COUNT = 10; // Number of initial tiles to generate
const MAX_ACTIVE_TILES = 30; // Maximum number of active tiles to keep
let currentHeight = 0; // Current height of the highest tile
let difficulty = 1; // Current difficulty level (increases with height)
let lastTileType = null; // Track the last generated tile type

// Tile types
const TILE_TYPES = {
    PLATFORM: 'platform',
    STAIRS: 'stairs',
    MOVING: 'moving',
    CRUMBLING: 'crumbling',
    BOUNCE: 'bounce'
};

// Moving tile data
const movingTiles = [];

/**
 * Initialize the tiles system and generate initial tiles
 */
function initTiles() {
    console.log("Initializing tiles...");
    
    // Clear any existing tiles
    clearTiles();
    
    // Reset variables
    currentHeight = 0;
    difficulty = 1;
    lastTileType = null;
    
    // Create ground platform
    createGroundPlatform();
    
    // Generate initial tiles
    for (let i = 0; i < INITIAL_TILE_COUNT; i++) {
        generateNextTile();
    }
    
    console.log(`${tiles.length} tiles generated`);
}

/**
 * Create the ground platform
 */
function createGroundPlatform() {
    // Create a large platform at y=0
    const width = TILE_SIZE * 5;
    const depth = TILE_SIZE * 5;
    const height = 1;
    
    // Create the visual representation (Three.js)
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshLambertMaterial({ color: 0x555555 }); // Dark gray
    const tileMesh = new THREE.Mesh(geometry, material);
    tileMesh.position.set(0, -height / 2, 0);
    window.gameScene.getScene().add(tileMesh);
    
    // Create the physics body (Cannon.js)
    const tileShape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
    const tileBody = new CANNON.Body({
        mass: 0, // Static body
        position: new CANNON.Vec3(0, -height / 2, 0),
        shape: tileShape,
        material: new CANNON.Material({
            friction: 0.5,
            restitution: 0.3
        })
    });
    window.physics.getWorld().addBody(tileBody);
    
    // Store the tile data
    tiles.push({
        mesh: tileMesh,
        body: tileBody,
        position: { x: 0, y: -height / 2, z: 0 },
        type: TILE_TYPES.PLATFORM,
        properties: { width, depth, height }
    });
    
    console.log("Ground platform created");
}

/**
 * Generate the next tile
 */
function generateNextTile() {
    // Increase height for the next tile
    currentHeight += TILE_HEIGHT_SPACING;
    
    // Increase difficulty every 10 tiles
    if (currentHeight / TILE_HEIGHT_SPACING % 10 === 0) {
        difficulty = Math.min(10, difficulty + 1);
        console.log(`Difficulty increased to ${difficulty}`);
    }
    
    // Choose a tile type based on difficulty
    const tileType = chooseTileType();
    
    // Generate the tile based on its type
    switch (tileType) {
        case TILE_TYPES.PLATFORM:
            createPlatformTile();
            break;
        case TILE_TYPES.STAIRS:
            createStairsTile();
            break;
        case TILE_TYPES.MOVING:
            createMovingTile();
            break;
        case TILE_TYPES.CRUMBLING:
            createCrumblingTile();
            break;
        case TILE_TYPES.BOUNCE:
            createBounceTile();
            break;
        default:
            createPlatformTile();
    }
    
    // Remove oldest tiles if we have too many
    if (tiles.length > MAX_ACTIVE_TILES) {
        removeOldestTile();
    }
}

/**
 * Choose a tile type based on current difficulty
 */
function chooseTileType() {
    // Available tile types based on difficulty
    const availableTypes = [TILE_TYPES.PLATFORM]; // Always available
    
    // Add more tile types as difficulty increases
    if (difficulty >= 2) availableTypes.push(TILE_TYPES.STAIRS);
    if (difficulty >= 3) availableTypes.push(TILE_TYPES.MOVING);
    if (difficulty >= 5) availableTypes.push(TILE_TYPES.CRUMBLING);
    if (difficulty >= 7) availableTypes.push(TILE_TYPES.BOUNCE);
    
    // Don't repeat the same tile type twice in a row (except platforms)
    let chosenType;
    do {
        chosenType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    } while (chosenType === lastTileType && chosenType !== TILE_TYPES.PLATFORM);
    
    // Remember this tile type
    lastTileType = chosenType;
    
    return chosenType;
}

/**
 * Create a basic platform tile
 */
function createPlatformTile() {
    // Random position within bounds
    const maxOffset = difficulty * 2; // Increases with difficulty
    const x = (Math.random() * maxOffset * 2) - maxOffset;
    const z = (Math.random() * maxOffset * 2) - maxOffset;
    
    // Random size (gets smaller with difficulty)
    const sizeMultiplier = Math.max(0.5, 1 - (difficulty * 0.05));
    const width = TILE_SIZE * sizeMultiplier * (0.8 + Math.random() * 0.4);
    const depth = TILE_SIZE * sizeMultiplier * (0.8 + Math.random() * 0.4);
    const height = 1;
    
    // Create the visual representation (Three.js)
    const geometry = new THREE.BoxGeometry(width, height, depth);
    
    // Create a more interesting material with random color variation
    const hue = Math.random() * 0.1 + 0.6; // Blue-ish range
    const saturation = 0.5 + Math.random() * 0.3;
    const lightness = 0.4 + Math.random() * 0.3;
    const color = new THREE.Color().setHSL(hue, saturation, lightness);
    
    // Create texture-like pattern using vertex colors
    const positionAttribute = geometry.getAttribute('position');
    const colors = [];
    const tempColor = new THREE.Color();
    
    for (let i = 0; i < positionAttribute.count; i++) {
        // Add slight color variation to each vertex
        const variationFactor = 0.05;
        tempColor.copy(color).offsetHSL(
            (Math.random() - 0.5) * variationFactor,
            (Math.random() - 0.5) * variationFactor,
            (Math.random() - 0.5) * variationFactor
        );
        colors.push(tempColor.r, tempColor.g, tempColor.b);
    }
    
    // Add colors to geometry
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    // Create material with vertex colors
    const material = new THREE.MeshStandardMaterial({ 
        vertexColors: true,
        roughness: 0.7,
        metalness: 0.2
    });
    
    const tileMesh = new THREE.Mesh(geometry, material);
    tileMesh.position.set(x, currentHeight, z);
    tileMesh.castShadow = true;
    tileMesh.receiveShadow = true;
    
    // Add a subtle edge highlight
    const edgeGeometry = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.3
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    tileMesh.add(edges);
    
    window.gameScene.getScene().add(tileMesh);
    
    // Create the physics body (Cannon.js)
    const tileShape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
    const tileBody = new CANNON.Body({
        mass: 0, // Static body
        position: new CANNON.Vec3(x, currentHeight, z),
        shape: tileShape,
        material: new CANNON.Material({
            friction: 0.5,
            restitution: 0.3
        })
    });
    window.physics.getWorld().addBody(tileBody);
    
    // Store the tile data
    tiles.push({
        mesh: tileMesh,
        body: tileBody,
        position: { x, y: currentHeight, z },
        type: TILE_TYPES.PLATFORM,
        properties: { width, depth, height }
    });
    
    console.log(`Platform tile created at height ${currentHeight}`);
}

/**
 * Create a stairs tile
 */
function createStairsTile() {
    // Random position within bounds
    const maxOffset = difficulty;
    const baseX = (Math.random() * maxOffset * 2) - maxOffset;
    const baseZ = (Math.random() * maxOffset * 2) - maxOffset;
    
    // Number of steps
    const numSteps = 3 + Math.floor(Math.random() * 3); // 3-5 steps
    
    // Step dimensions
    const stepWidth = TILE_SIZE * 0.8;
    const stepDepth = TILE_SIZE * 0.3;
    const stepHeight = TILE_HEIGHT_SPACING / numSteps;
    
    // Random direction for stairs
    const direction = Math.random() < 0.5 ? 'x' : 'z';
    const directionSign = Math.random() < 0.5 ? 1 : -1;
    
    // Create a group for all steps
    const stairsGroup = new THREE.Group();
    window.gameScene.getScene().add(stairsGroup);
    
    // Base color for stairs with some randomness
    const hue = 0.05 + Math.random() * 0.05; // Brown-ish
    const saturation = 0.6 + Math.random() * 0.2;
    const lightness = 0.3 + Math.random() * 0.2;
    const baseColor = new THREE.Color().setHSL(hue, saturation, lightness);
    
    // Create each step
    for (let i = 0; i < numSteps; i++) {
        // Calculate position for this step
        const stepY = currentHeight - TILE_HEIGHT_SPACING + (i + 0.5) * stepHeight;
        let stepX = baseX;
        let stepZ = baseZ;
        
        // Adjust position based on direction
        if (direction === 'x') {
            stepX += directionSign * i * stepDepth;
        } else {
            stepZ += directionSign * i * stepDepth;
        }
        
        // Create step mesh with slightly varied color
        const geometry = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
        
        // Vary color slightly for each step
        const stepColor = baseColor.clone().offsetHSL(0, 0, i * 0.03);
        const material = new THREE.MeshStandardMaterial({ 
            color: stepColor,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const stepMesh = new THREE.Mesh(geometry, material);
        stepMesh.position.set(stepX, stepY, stepZ);
        stepMesh.castShadow = true;
        stepMesh.receiveShadow = true;
        stairsGroup.add(stepMesh);
        
        // Add subtle edge highlight
        const edgeGeometry = new THREE.EdgesGeometry(geometry);
        const edgeMaterial = new THREE.LineBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.2
        });
        const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        stepMesh.add(edges);
        
        // Create physics body for this step
        const stepShape = new CANNON.Box(new CANNON.Vec3(stepWidth / 2, stepHeight / 2, stepDepth / 2));
        const stepBody = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(stepX, stepY, stepZ),
            shape: stepShape,
            material: new CANNON.Material({
                friction: 0.7, // Higher friction for stairs
                restitution: 0.2
            })
        });
        window.physics.getWorld().addBody(stepBody);
        
        // Store the step data
        tiles.push({
            mesh: stepMesh,
            body: stepBody,
            position: { x: stepX, y: stepY, z: stepZ },
            type: TILE_TYPES.STAIRS,
            properties: { width: stepWidth, depth: stepDepth, height: stepHeight }
        });
    }
    
    console.log(`Stairs tile created at height ${currentHeight} with ${numSteps} steps`);
}

/**
 * Create a moving tile
 */
function createMovingTile() {
    // Random position within bounds
    const maxOffset = difficulty;
    const x = (Math.random() * maxOffset * 2) - maxOffset;
    const z = (Math.random() * maxOffset * 2) - maxOffset;
    
    // Tile dimensions
    const width = TILE_SIZE * 0.8;
    const depth = TILE_SIZE * 0.8;
    const height = 1;
    
    // Create the visual representation
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshLambertMaterial({ color: 0x4682B4 }); // Steel blue
    const tileMesh = new THREE.Mesh(geometry, material);
    tileMesh.position.set(x, currentHeight, z);
    window.gameScene.getScene().add(tileMesh);
    
    // Create the physics body
    const tileShape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
    const tileBody = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(x, currentHeight, z),
        shape: tileShape,
        material: new CANNON.Material({
            friction: 0.5,
            restitution: 0.3
        })
    });
    window.physics.getWorld().addBody(tileBody);
    
    // Movement properties
    const moveDirection = Math.random() < 0.5 ? 'x' : 'z';
    const moveDistance = TILE_SIZE * (1 + Math.random());
    const moveSpeed = 0.05 * (1 + difficulty * 0.1);
    
    // Store the tile data
    const tileData = {
        mesh: tileMesh,
        body: tileBody,
        position: { x, y: currentHeight, z },
        type: TILE_TYPES.MOVING,
        properties: {
            width,
            depth,
            height,
            moveDirection,
            moveDistance,
            moveSpeed,
            startPosition: { x, y: currentHeight, z },
            movePhase: Math.random() * Math.PI * 2 // Random starting phase
        }
    };
    
    tiles.push(tileData);
    movingTiles.push(tileData);
    
    console.log(`Moving tile created at height ${currentHeight}`);
}

/**
 * Create a crumbling tile
 */
function createCrumblingTile() {
    // Random position within bounds
    const maxOffset = difficulty;
    const x = (Math.random() * maxOffset * 2) - maxOffset;
    const z = (Math.random() * maxOffset * 2) - maxOffset;
    
    // Tile dimensions
    const width = TILE_SIZE * 0.9;
    const depth = TILE_SIZE * 0.9;
    const height = 1;
    
    // Create the visual representation
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshLambertMaterial({ color: 0xCD5C5C }); // Indian red
    const tileMesh = new THREE.Mesh(geometry, material);
    tileMesh.position.set(x, currentHeight, z);
    window.gameScene.getScene().add(tileMesh);
    
    // Create the physics body
    const tileShape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
    const tileBody = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(x, currentHeight, z),
        shape: tileShape,
        material: new CANNON.Material({
            friction: 0.5,
            restitution: 0.3
        })
    });
    window.physics.getWorld().addBody(tileBody);
    
    // Store the tile data
    tiles.push({
        mesh: tileMesh,
        body: tileBody,
        position: { x, y: currentHeight, z },
        type: TILE_TYPES.CRUMBLING,
        properties: {
            width,
            depth,
            height,
            crumbleDelay: 500, // ms before crumbling starts
            crumbleDuration: 1000, // ms to complete crumbling
            isCrumbling: false,
            crumbleStartTime: 0
        }
    });
    
    console.log(`Crumbling tile created at height ${currentHeight}`);
}

/**
 * Create a bounce tile
 */
function createBounceTile() {
    // Random position within bounds
    const maxOffset = difficulty;
    const x = (Math.random() * maxOffset * 2) - maxOffset;
    const z = (Math.random() * maxOffset * 2) - maxOffset;
    
    // Tile dimensions
    const width = TILE_SIZE * 0.8;
    const depth = TILE_SIZE * 0.8;
    const height = 1;
    
    // Create the visual representation
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshLambertMaterial({ color: 0x32CD32 }); // Lime green
    const tileMesh = new THREE.Mesh(geometry, material);
    tileMesh.position.set(x, currentHeight, z);
    window.gameScene.getScene().add(tileMesh);
    
    // Create the physics body
    const tileShape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
    const tileBody = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(x, currentHeight, z),
        shape: tileShape,
        material: new CANNON.Material({
            friction: 0.5,
            restitution: 1.5 // High restitution for bouncing
        })
    });
    window.physics.getWorld().addBody(tileBody);
    
    // Store the tile data
    tiles.push({
        mesh: tileMesh,
        body: tileBody,
        position: { x, y: currentHeight, z },
        type: TILE_TYPES.BOUNCE,
        properties: { width, depth, height }
    });
    
    console.log(`Bounce tile created at height ${currentHeight}`);
}

/**
 * Remove the oldest (lowest) tile
 */
function removeOldestTile() {
    // Find the lowest tile
    let lowestTileIndex = 0;
    let lowestY = Infinity;
    
    tiles.forEach((tile, index) => {
        if (tile.position.y < lowestY) {
            lowestY = tile.position.y;
            lowestTileIndex = index;
        }
    });
    
    // Remove the lowest tile
    if (lowestTileIndex >= 0) {
        const tileToRemove = tiles[lowestTileIndex];
        
        // Remove from scene and physics world
        window.gameScene.getScene().remove(tileToRemove.mesh);
        window.physics.getWorld().removeBody(tileToRemove.body);
        
        // If it's a moving tile, remove from movingTiles array
        if (tileToRemove.type === TILE_TYPES.MOVING) {
            const movingIndex = movingTiles.findIndex(t => t === tileToRemove);
            if (movingIndex >= 0) {
                movingTiles.splice(movingIndex, 1);
            }
        }
        
        // Remove from tiles array
        tiles.splice(lowestTileIndex, 1);
    }
}

/**
 * Clear all existing tiles
 */
function clearTiles() {
    // Remove each tile from the scene and physics world
    tiles.forEach(tile => {
        window.gameScene.getScene().remove(tile.mesh);
        window.physics.getWorld().removeBody(tile.body);
    });
    
    // Clear the arrays
    tiles.length = 0;
    movingTiles.length = 0;
}

/**
 * Reset tiles to initial state
 */
function resetTiles() {
    initTiles();
}

/**
 * Update tiles
 */
function updateTiles() {
    // Update moving tiles
    updateMovingTiles();
    
    // Update crumbling tiles
    updateCrumblingTiles();
    
    // Check if we need to generate more tiles
    checkTileGeneration();
}

/**
 * Update moving tiles
 */
function updateMovingTiles() {
    const time = performance.now() / 1000; // Current time in seconds
    
    movingTiles.forEach(tile => {
        const { moveDirection, moveDistance, moveSpeed, startPosition, movePhase } = tile.properties;
        
        // Calculate new position using sine wave
        const offset = Math.sin(time * moveSpeed + movePhase) * moveDistance;
        
        // Update position based on direction
        if (moveDirection === 'x') {
            tile.body.position.x = startPosition.x + offset;
        } else {
            tile.body.position.z = startPosition.z + offset;
        }
        
        // Update mesh position
        tile.mesh.position.copy(tile.body.position);
    });
}

/**
 * Update crumbling tiles
 */
function updateCrumblingTiles() {
    const currentTime = performance.now();
    
    tiles.forEach(tile => {
        if (tile.type === TILE_TYPES.CRUMBLING && tile.properties.isCrumbling) {
            const elapsedTime = currentTime - tile.properties.crumbleStartTime;
            
            if (elapsedTime > tile.properties.crumbleDuration) {
                // Remove the tile
                window.gameScene.getScene().remove(tile.mesh);
                window.physics.getWorld().removeBody(tile.body);
                
                // Mark for removal
                tile.toRemove = true;
            } else {
                // Animate crumbling (scale down)
                const scale = 1 - (elapsedTime / tile.properties.crumbleDuration);
                tile.mesh.scale.set(scale, scale, scale);
                
                // Make it semi-transparent
                tile.mesh.material.opacity = scale;
                tile.mesh.material.transparent = true;
            }
        }
    });
    
    // Remove tiles marked for removal
    for (let i = tiles.length - 1; i >= 0; i--) {
        if (tiles[i].toRemove) {
            tiles.splice(i, 1);
        }
    }
}

/**
 * Start crumbling a tile
 */
function startCrumbling(tile) {
    if (tile.type === TILE_TYPES.CRUMBLING && !tile.properties.isCrumbling) {
        tile.properties.isCrumbling = true;
        tile.properties.crumbleStartTime = performance.now() + tile.properties.crumbleDelay;
    }
}

/**
 * Check if we need to generate more tiles
 */
function checkTileGeneration() {
    // Get player position (more reliable than character position)
    const playerPosition = window.player.getPlayerPosition();
    
    // Find the highest tile
    let highestY = -Infinity;
    tiles.forEach(tile => {
        if (tile.position.y > highestY) {
            highestY = tile.position.y;
        }
    });
    
    // If player is getting close to the highest tile, generate more
    if (playerPosition.y > highestY - TILE_HEIGHT_SPACING * 5) {
        generateNextTile();
    }
}

/**
 * Check for character collision with tiles
 */
function checkTileCollision(characterPosition) {
    // If no character position is provided, use player position
    const position = characterPosition || window.player.getPlayerPosition();
    
    tiles.forEach(tile => {
        // Only check crumbling tiles
        if (tile.type === TILE_TYPES.CRUMBLING) {
            // Simple AABB collision check
            const { width, depth } = tile.properties;
            const halfWidth = width / 2;
            const halfDepth = depth / 2;
            
            if (
                position.x > tile.position.x - halfWidth &&
                position.x < tile.position.x + halfWidth &&
                position.z > tile.position.z - halfDepth &&
                position.z < tile.position.z + halfDepth &&
                Math.abs(position.y - tile.position.y) < 1
            ) {
                // Character is on this crumbling tile
                startCrumbling(tile);
            }
        }
    });
}

/**
 * Get all active tiles
 */
function getTiles() {
    return tiles;
}

// Export tile functions
window.tiles = {
    initTiles,
    updateTiles,
    getTiles,
    resetTiles,
    generateNextTile,
    checkTileCollision
}; 