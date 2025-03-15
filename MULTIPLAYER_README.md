# Diwar Climb - Multiplayer Implementation

This document provides information about the multiplayer functionality in Diwar Climb.

## Overview

Diwar Climb now supports real-time multiplayer, allowing multiple players to see and interact with each other in the game world. The multiplayer system uses WebSockets for low-latency communication between clients and the server.

## Architecture

The multiplayer system consists of two main components:

1. **WebSocket Server** (`server.js`): A Node.js server that tracks connected clients and broadcasts player positions.
2. **Client-Side Network Module** (`network.js`): Handles WebSocket communication on the client side, sending the local player's position and receiving other players' positions.

## How to Test Multiplayer

### Running the Server

1. Make sure you have Node.js installed.
2. Install dependencies:
   ```
   npm install ws
   ```
3. Start the server:
   ```
   node server.js
   ```
   The server will start on port 8080.

### Testing with Multiple Clients

#### Option 1: Using the Game Client

1. Open the game (`index.html`) in multiple browser tabs or on different devices.
2. Each client will automatically connect to the WebSocket server.
3. Move your player in one tab, and you should see blue spheres representing other players in all tabs.

#### Option 2: Using the Test Client

1. Open `test-multiplayer.html` in a browser.
2. Click "Connect to Server" to establish a WebSocket connection.
3. Click "Send Random Position" to start sending random positions to the server.
4. Open another instance of `test-multiplayer.html` or the game client to see the positions being shared.

## Implementation Details

### Server (`server.js`)

- Uses the `ws` library for WebSocket functionality.
- Assigns a unique ID to each connected client.
- Tracks client positions in a Map.
- Broadcasts all player positions at 30 FPS (every 33ms).
- Handles client disconnections and cleans up resources.

### Client Network Module (`network.js`)

- Establishes a WebSocket connection to the server.
- Sends the local player's position to the server.
- Receives and stores other players' positions.
- Creates and updates visual representations (blue spheres) for other players.
- Handles reconnection attempts if the connection is lost.

### Integration with Game

- `scene.js` initializes the network module and calls `updateNetwork()` in the animation loop.
- `player.js` provides a function to create meshes for other players and sends its position to the network module.
- Other players are rendered as blue spheres to distinguish them from the local player (red sphere).

## Protocol

The client and server communicate using JSON messages with the following format:

### Server to Client

```json
{
  "type": "id",
  "id": "unique-client-id"
}
```

```json
{
  "type": "positions",
  "positions": {
    "client-id-1": { "x": 0, "y": 5, "z": 0 },
    "client-id-2": { "x": 3, "y": 7, "z": 2 }
  }
}
```

### Client to Server

```json
{
  "type": "position",
  "position": { "x": 0, "y": 5, "z": 0 }
}
```

## Future Enhancements

- Add player names or IDs above each player.
- Implement chat functionality.
- Add player color customization.
- Improve network synchronization with interpolation.
- Add collision detection between players.
- Implement game state synchronization (e.g., tile positions). 