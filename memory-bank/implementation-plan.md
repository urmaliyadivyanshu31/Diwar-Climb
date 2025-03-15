# Implementation Plan: Diwar Climb (Multiplayer Base Game)

This plan builds the base multiplayer version of "Diwar Climb" step-by-step. Each step is small, specific, and includes a test. Focus is on core mechanics, not full features.

## Step 1: Set Up Project Structure and Three.js Scene
- **Task**: Create a project folder with modular files and initialize a basic Three.js scene.
- **Instructions**: 
  - Create `index.html` with a `<canvas>` and script imports for Three.js and Cannon.js.
  - Create `scene.js` to set up a Three.js scene, camera (perspective, 75 FOV), and renderer (full window size).
  - Add a directional light (white, intensity 1) at position (0, 10, 0).
  - Link `scene.js` in `index.html` and render an empty scene.
- **Test**: Open `index.html` in a browser. Confirm a blank black screen appears (light with no objects).

## Step 2: Add Cannon.js Physics World
- **Task**: Integrate Cannon.js for physics simulation.
- **Instructions**: 
  - Create `physics.js` to initialize a Cannon.js world with gravity (0, -9.82, 0).
  - In `scene.js`, import `physics.js` and call its world setup function.
  - Add a basic animation loop in `scene.js` to step the physics world (1/60 timestep) and render the scene.
- **Test**: Open `index.html`. Console log the physics world's gravity. Confirm it outputs `{ x: 0, y: -9.82, z: 0 }`.

## Step 3: Create Local Player with Movement
- **Task**: Add a controllable player with physics.
- **Instructions**: 
  - Create `player.js` to define a player (Three.js sphere, radius 1, red color; Cannon.js sphere body, mass 1).
  - Position player at (0, 1, 0). Add to scene and physics world.
  - Add keyboard controls: left/right arrows set x-velocity (±5), spacebar sets y-velocity (10) if on a tile.
  - Update player mesh position/quaternion from physics body in the animation loop.
- **Test**: Open `index.html`. Use arrows to move left/right, space to jump. Confirm the sphere moves and falls due to gravity.

## Step 4: Generate Initial Tiles
- **Task**: Add a starting set of stable tiles.
- **Instructions**: 
  - Create `tiles.js` with a `Tile` class (Three.js plane, 20x20, gray; Cannon.js plane, mass 0).
  - Generate 3 tiles at y = 0, 10, 20 (x, z = 0). Add to scene and physics world.
  - Update tile positions in the animation loop if needed (static for now).
- **Test**: Open `index.html`. Confirm 3 gray platforms appear at y = 0, 10, 20, and the player lands on the first tile.

## Step 5: Implement Tile Progression and Scoring
- **Task**: Enable climbing and track score.
- **Instructions**: 
  - In `player.js`, check if player's x ≥ 10 and y ≈ target tile's y (within 1 unit). Snap to tile y, reset velocity, increment score by 10.
  - Create `ui.js` with HTML elements for score (starts at 0) and health (starts at 100). Update score in `player.js`.
  - In `tiles.js`, shift tiles down and add a new tile at y + 10 when player climbs (keep 3-5 active tiles).
- **Test**: Move right, jump to next tile. Confirm score increases by 10 per tile and new tiles appear as you climb.

## Step 6: Set Up WebSocket Server
- **Task**: Create a Node.js server for multiplayer syncing.
- **Instructions**: 
  - Create `server.js` with Node.js and `ws` library. Set up a WebSocket server on port 8080.
  - Track connected clients and broadcast player positions every 33ms (≈30 FPS).
  - Install Node.js and `ws` locally (`npm init -y`, `npm install ws`).
- **Test**: Run `node server.js`. Connect via a WebSocket client (e.g., browser console). Confirm server logs connections.

## Step 7: Add Multiplayer Syncing to Client ✅

- Create `network.js` to handle WebSocket client-side communication
  - Connect to the WebSocket server
  - Send local player position every frame
  - Receive and store other players' positions
  - Render other players as blue spheres in `player.js`
  - Added support for character animations and rotation
  - Created a loading screen with progress bar
  - Implemented character model and animation system

**Test**: Open two browser tabs to see player movements synchronized between them.

## Step 8: Add Environment and Obstacles

- Create `environment.js` to handle environment elements
  - Add skybox or background
  - Create decorative elements (trees, rocks, etc.)
  - Add particle effects (dust, clouds)
- Add obstacle tiles that damage the player
- Add moving platforms
- Add collectible items

**Test**: Verify that environment elements render correctly and obstacles affect gameplay.

## Step 9: Add Game Over Logic
- **Task**: End game on fall or health loss.
- **Instructions**: 
  - In `player.js`, check if y < -10 or health ≤ 0. If true, alert "Game Over! Score: [score]" and reset player position.
  - Simulate health loss by decreasing health by 10 when spacebar is pressed (for testing).
- **Test**: Jump off a tile or press space repeatedly. Confirm game over triggers and resets correctly.