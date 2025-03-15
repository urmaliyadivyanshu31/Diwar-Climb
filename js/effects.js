/**
 * effects.js - Handles visual effects for the game
 * 
 * This file is responsible for creating and managing visual effects
 * such as particles, trails, and impact effects.
 */

// Effects settings
const MAX_PARTICLES = 500; // Maximum number of particles
const PARTICLE_POOL_SIZE = 1000; // Size of particle pool for reuse

// Particle systems
let particleSystems = [];
let particlePool = [];
let availableParticles = [];

// Trail effects
let dashTrail = null;
let wallRunTrail = null;
let slideTrail = null;

/**
 * Initialize the effects system
 */
function initEffects() {
    console.log("Initializing effects system...");
    
    // Create particle pool
    createParticlePool();
    
    console.log("Effects system initialized");
}

/**
 * Create a pool of particles for reuse
 */
function createParticlePool() {
    // Create particle geometry
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_POOL_SIZE * 3);
    const colors = new Float32Array(PARTICLE_POOL_SIZE * 3);
    const sizes = new Float32Array(PARTICLE_POOL_SIZE);
    const lifetimes = new Float32Array(PARTICLE_POOL_SIZE);
    
    // Initialize arrays
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
        
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 1.0;
        colors[i * 3 + 2] = 1.0;
        
        sizes[i] = 0.1;
        lifetimes[i] = 0;
        
        // Add to available particles
        availableParticles.push(i);
    }
    
    // Set attributes
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    particleGeometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
    
    // Create particle material
    const particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            pointTexture: { value: createParticleTexture() }
        },
        vertexShader: `
            attribute float size;
            attribute float lifetime;
            varying float vLifetime;
            
            void main() {
                vLifetime = lifetime;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform sampler2D pointTexture;
            varying float vLifetime;
            
            void main() {
                if (vLifetime <= 0.0) discard;
                vec4 texColor = texture2D(pointTexture, gl_PointCoord);
                gl_FragColor = vec4(texColor.rgb, texColor.a * vLifetime);
            }
        `,
        blending: THREE.AdditiveBlending,
        depthTest: true,
        depthWrite: false,
        transparent: true,
        vertexColors: true
    });
    
    // Create particle system
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    particleSystem.frustumCulled = false;
    
    // Add to scene
    if (window.gameScene && window.gameScene.getScene) {
        window.gameScene.getScene().add(particleSystem);
    }
    
    // Store particle system
    particlePool = {
        system: particleSystem,
        positions: positions,
        colors: colors,
        sizes: sizes,
        lifetimes: lifetimes,
        geometry: particleGeometry,
        time: 0
    };
}

/**
 * Create a particle texture
 */
function createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2
    );
    
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(200, 200, 200, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    
    return texture;
}

/**
 * Create a dash effect
 * @param {Object} position - Position of the dash
 * @param {Object} direction - Direction of the dash
 */
function createDashEffect(position, direction) {
    // Create dash particles
    const particleCount = 30;
    const colors = [
        new THREE.Color(0x00ffff), // Cyan
        new THREE.Color(0x0088ff), // Light blue
        new THREE.Color(0x0044ff)  // Blue
    ];
    
    for (let i = 0; i < particleCount; i++) {
        // Get a particle from the pool
        if (availableParticles.length === 0) return;
        
        const index = availableParticles.pop();
        const offset = Math.random() * 0.5;
        
        // Set particle position (slightly behind the player)
        particlePool.positions[index * 3] = position.x - direction.x * offset;
        particlePool.positions[index * 3 + 1] = position.y + Math.random() * 0.5;
        particlePool.positions[index * 3 + 2] = position.z - direction.z * offset;
        
        // Set random velocity (opposite to dash direction)
        const velocity = {
            x: -direction.x * (Math.random() * 0.5 + 0.5),
            y: Math.random() * 0.2 - 0.1,
            z: -direction.z * (Math.random() * 0.5 + 0.5)
        };
        
        // Set color
        const color = colors[Math.floor(Math.random() * colors.length)];
        particlePool.colors[index * 3] = color.r;
        particlePool.colors[index * 3 + 1] = color.g;
        particlePool.colors[index * 3 + 2] = color.b;
        
        // Set size and lifetime
        particlePool.sizes[index] = Math.random() * 0.2 + 0.1;
        particlePool.lifetimes[index] = 1.0;
        
        // Create particle
        particleSystems.push({
            index: index,
            velocity: velocity,
            lifetime: 1.0,
            decay: Math.random() * 0.02 + 0.01 // Random decay rate
        });
    }
    
    // Update attributes
    particlePool.geometry.attributes.position.needsUpdate = true;
    particlePool.geometry.attributes.color.needsUpdate = true;
    particlePool.geometry.attributes.size.needsUpdate = true;
    particlePool.geometry.attributes.lifetime.needsUpdate = true;
}

/**
 * Create wall run particles
 * @param {Object} position - Position of the player
 * @param {Object} wallNormal - Normal of the wall
 */
function createWallRunParticles(position, wallNormal) {
    // Only create particles every few frames to avoid too many
    if (Math.random() > 0.3) return;
    
    // Create wall run particles
    const particleCount = 5;
    const colors = [
        new THREE.Color(0xcccccc), // Light gray
        new THREE.Color(0xaaaaaa), // Gray
        new THREE.Color(0x888888)  // Dark gray
    ];
    
    for (let i = 0; i < particleCount; i++) {
        // Get a particle from the pool
        if (availableParticles.length === 0) return;
        
        const index = availableParticles.pop();
        
        // Set particle position (at the wall contact point)
        particlePool.positions[index * 3] = position.x + wallNormal.x * 0.3;
        particlePool.positions[index * 3 + 1] = position.y - 0.5 + Math.random() * 1.0;
        particlePool.positions[index * 3 + 2] = position.z + wallNormal.z * 0.3;
        
        // Set random velocity (away from wall)
        const velocity = {
            x: wallNormal.x * (Math.random() * 0.3 + 0.1),
            y: Math.random() * 0.2 - 0.1,
            z: wallNormal.z * (Math.random() * 0.3 + 0.1)
        };
        
        // Set color
        const color = colors[Math.floor(Math.random() * colors.length)];
        particlePool.colors[index * 3] = color.r;
        particlePool.colors[index * 3 + 1] = color.g;
        particlePool.colors[index * 3 + 2] = color.b;
        
        // Set size and lifetime
        particlePool.sizes[index] = Math.random() * 0.1 + 0.05;
        particlePool.lifetimes[index] = 1.0;
        
        // Create particle
        particleSystems.push({
            index: index,
            velocity: velocity,
            lifetime: 1.0,
            decay: Math.random() * 0.05 + 0.02 // Random decay rate
        });
    }
    
    // Update attributes
    particlePool.geometry.attributes.position.needsUpdate = true;
    particlePool.geometry.attributes.color.needsUpdate = true;
    particlePool.geometry.attributes.size.needsUpdate = true;
    particlePool.geometry.attributes.lifetime.needsUpdate = true;
}

/**
 * Create slide particles
 * @param {Object} position - Position of the player
 */
function createSlideParticles(position) {
    // Only create particles every few frames to avoid too many
    if (Math.random() > 0.3) return;
    
    // Create slide particles
    const particleCount = 3;
    const colors = [
        new THREE.Color(0xdddddd), // Very light gray
        new THREE.Color(0xcccccc), // Light gray
        new THREE.Color(0xbbbbbb)  // Gray
    ];
    
    for (let i = 0; i < particleCount; i++) {
        // Get a particle from the pool
        if (availableParticles.length === 0) return;
        
        const index = availableParticles.pop();
        
        // Set particle position (at the ground contact point)
        particlePool.positions[index * 3] = position.x + (Math.random() * 0.4 - 0.2);
        particlePool.positions[index * 3 + 1] = position.y - 0.8;
        particlePool.positions[index * 3 + 2] = position.z + (Math.random() * 0.4 - 0.2);
        
        // Set random velocity (upward and outward)
        const velocity = {
            x: Math.random() * 0.2 - 0.1,
            y: Math.random() * 0.1 + 0.05,
            z: Math.random() * 0.2 - 0.1
        };
        
        // Set color
        const color = colors[Math.floor(Math.random() * colors.length)];
        particlePool.colors[index * 3] = color.r;
        particlePool.colors[index * 3 + 1] = color.g;
        particlePool.colors[index * 3 + 2] = color.b;
        
        // Set size and lifetime
        particlePool.sizes[index] = Math.random() * 0.08 + 0.03;
        particlePool.lifetimes[index] = 1.0;
        
        // Create particle
        particleSystems.push({
            index: index,
            velocity: velocity,
            lifetime: 1.0,
            decay: Math.random() * 0.05 + 0.03 // Random decay rate
        });
    }
    
    // Update attributes
    particlePool.geometry.attributes.position.needsUpdate = true;
    particlePool.geometry.attributes.color.needsUpdate = true;
    particlePool.geometry.attributes.size.needsUpdate = true;
    particlePool.geometry.attributes.lifetime.needsUpdate = true;
}

/**
 * Create jump particles
 * @param {Object} position - Position of the player
 * @param {boolean} isDoubleJump - Whether this is a double jump
 */
function createJumpParticles(position, isDoubleJump) {
    // Create jump particles
    const particleCount = isDoubleJump ? 20 : 10;
    const colors = isDoubleJump ? 
        [
            new THREE.Color(0xffff00), // Yellow
            new THREE.Color(0xffaa00), // Orange
            new THREE.Color(0xff8800)  // Dark orange
        ] : 
        [
            new THREE.Color(0xffffff), // White
            new THREE.Color(0xeeeeee), // Light gray
            new THREE.Color(0xdddddd)  // Gray
        ];
    
    for (let i = 0; i < particleCount; i++) {
        // Get a particle from the pool
        if (availableParticles.length === 0) return;
        
        const index = availableParticles.pop();
        
        // Set particle position (at the feet)
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.3;
        particlePool.positions[index * 3] = position.x + Math.cos(angle) * radius;
        particlePool.positions[index * 3 + 1] = position.y - 0.8;
        particlePool.positions[index * 3 + 2] = position.z + Math.sin(angle) * radius;
        
        // Set random velocity (outward and downward for regular jump, outward for double jump)
        const velocity = {
            x: Math.cos(angle) * (Math.random() * 0.2 + 0.1),
            y: isDoubleJump ? Math.random() * 0.3 + 0.1 : -Math.random() * 0.1 - 0.05,
            z: Math.sin(angle) * (Math.random() * 0.2 + 0.1)
        };
        
        // Set color
        const color = colors[Math.floor(Math.random() * colors.length)];
        particlePool.colors[index * 3] = color.r;
        particlePool.colors[index * 3 + 1] = color.g;
        particlePool.colors[index * 3 + 2] = color.b;
        
        // Set size and lifetime
        particlePool.sizes[index] = Math.random() * 0.15 + 0.05;
        particlePool.lifetimes[index] = 1.0;
        
        // Create particle
        particleSystems.push({
            index: index,
            velocity: velocity,
            lifetime: 1.0,
            decay: Math.random() * 0.03 + 0.02 // Random decay rate
        });
    }
    
    // Update attributes
    particlePool.geometry.attributes.position.needsUpdate = true;
    particlePool.geometry.attributes.color.needsUpdate = true;
    particlePool.geometry.attributes.size.needsUpdate = true;
    particlePool.geometry.attributes.lifetime.needsUpdate = true;
}

/**
 * Update all particle systems
 * @param {number} deltaTime - Time since last update
 */
function updateEffects(deltaTime) {
    // Update particle systems
    for (let i = particleSystems.length - 1; i >= 0; i--) {
        const particle = particleSystems[i];
        
        // Update lifetime
        particle.lifetime -= particle.decay;
        
        // Update position
        particlePool.positions[particle.index * 3] += particle.velocity.x * deltaTime * 10;
        particlePool.positions[particle.index * 3 + 1] += particle.velocity.y * deltaTime * 10;
        particlePool.positions[particle.index * 3 + 2] += particle.velocity.z * deltaTime * 10;
        
        // Apply gravity to velocity
        particle.velocity.y -= 0.01;
        
        // Update lifetime attribute
        particlePool.lifetimes[particle.index] = Math.max(0, particle.lifetime);
        
        // Remove if lifetime is over
        if (particle.lifetime <= 0) {
            // Return particle to pool
            availableParticles.push(particle.index);
            
            // Remove from active particles
            particleSystems.splice(i, 1);
        }
    }
    
    // Update particle attributes if there are active particles
    if (particleSystems.length > 0) {
        particlePool.geometry.attributes.position.needsUpdate = true;
        particlePool.geometry.attributes.lifetime.needsUpdate = true;
    }
    
    // Update shader time
    if (particlePool.system && particlePool.system.material.uniforms) {
        particlePool.system.material.uniforms.time.value += deltaTime;
    }
    
    // Check for player movement state to create appropriate effects
    if (window.player && window.player.getMovementState && window.player.getPlayerPosition) {
        const state = window.player.getMovementState();
        const position = window.player.getPlayerPosition();
        
        if (state.sliding) {
            createSlideParticles(position);
        }
    }
}

// Export effects functions
window.effects = {
    initEffects,
    updateEffects,
    createDashEffect,
    createWallRunParticles,
    createSlideParticles,
    createJumpParticles
}; 