# Diwar Climb - Architecture Overview

This document provides an overview of the architecture of the Diwar Climb game.

## File Structure

- `index.html` - Main HTML file that loads all scripts and contains the game canvas
- `js/scene.js` - Sets up the Three.js scene, camera, renderer, and animation loop
- `js/physics.js` - Handles Cannon.js physics simulation and keyboard input
- `js/player.js` - Manages player physics, movement, and controls
- `js/character.js` - Handles character model loading, animations, and visual representation
- `js/tiles.js` - Generates and manages the tile platforms
- `js/ui.js` - Handles UI elements like score, health, and game over screen
- `js/network.js` - Manages WebSocket communication for multiplayer
- `js/main.js` - Main entry point that initializes the game and handles loading
- `server.js` - WebSocket server for multiplayer functionality
- `test-client.html` - Test client for WebSocket server

## Insights After Each Step

### Step 1: Basic Scene Setup
- **Global Accessibility**: Using `window.moduleName` pattern for module communication
- **Modular Design**: Separating concerns into different files for better organization
- **Responsive Design**: Handling window resizing to maintain proper aspect ratio
- **Performance Considerations**: Setting up renderer with appropriate options
- **Lighting Setup**: Using multiple light types for better visual quality

### Step 2: Physics Integration
- **Module Communication**: Physics world accessible to other modules
- **Physics Configuration**: Setting up appropriate materials and contact properties
- **Simulation Timing**: Fixed timestep for consistent physics simulation
- **Separation of Concerns**: Physics logic separate from rendering logic
- **Explicit Exports**: Making specific functions available to other modules

### Step 3: Player Character
- **Input Handling**: Keyboard state tracking for responsive controls
- **Physics-Visual Synchronization**: Keeping visual mesh in sync with physics body
- **Collision Detection**: Using event listeners for ground contact detection
- **Temporary Testing Elements**: Using simple geometries before final assets
- **Constant Configuration**: Using constants for player properties for easy tuning

### Step 4: Tile Generation
- **Object Pooling Foundation**: Reusing tile objects for better performance
- **Data Coupling**: Tiles aware of player position for gameplay mechanics
- **Configurable Generation**: Parameters for controlling tile generation
- **Preparation for Progression**: System designed to allow for difficulty changes
- **Consistent Physics Properties**: Standardized collision properties

### Bug Fixes
- **Ground Detection Improvements**: Better collision normal checking
- **Game State Management**: Proper tracking of player state
- **Resource Cleanup**: Removing unused objects from scene and physics world
- **Fall Detection**: Handling player falling off the map
- **User Experience Enhancements**: Smoother camera following and controls

### Step 5: Game Mechanics
- **Dynamic Content Generation**: Procedural tile generation based on player height
- **Resource Management**: Efficient creation and removal of game objects
- **UI Integration**: Non-intrusive UI elements that update with game state
- **Progress Tracking**: Scoring system based on player achievement
- **State Flags**: Using boolean flags to track game state

### Step 6: WebSocket Server
- **Real-time Communication**: Using WebSocket for low-latency updates
- **Client Management**: Using Maps to track connected clients
- **Broadcast Optimization**: Sending updates at fixed intervals (30 FPS)
- **Protocol Design**: Simple message format for position data
- **Separation of Concerns**: Server logic separate from game logic

### Step 7: Multiplayer Client Integration
- **Character Animation System**: Flexible animation system with state transitions
- **Network Synchronization**: Sending and receiving position, rotation, and animation data
- **Visual Representation**: Different rendering for local and remote players
- **Loading Management**: Progressive loading with visual feedback
- **Modular Integration**: Character system that works with or without networking
- **State Tracking**: Movement state tracking for animation selection
- **Smooth Transitions**: Interpolation for rotation and animation changes
- **User Feedback**: Enhanced test client with visual indicators and controls

## Module Interactions

- **Scene → All**: Provides access to Three.js scene, camera, and renderer
- **Physics → Player**: Provides physics world and handles input
- **Player → Character**: Updates character position and animation based on physics
- **Player → Network**: Sends player data to server
- **Network → Character**: Creates and updates other player characters
- **Tiles → Physics**: Creates and manages tile physics bodies
- **UI → Player**: Displays player stats and game state
- **Main → All**: Initializes and coordinates all modules

## Future Considerations

- **Asset Loading**: Implement proper asset loading system with progress tracking
- **Performance Optimization**: Further optimize rendering and physics
- **Game Progression**: Add more gameplay elements and progression
- **Mobile Support**: Add touch controls for mobile devices
- **Sound Effects**: Add audio for better game feel
- **Visual Effects**: Add particle effects and other visual enhancements
