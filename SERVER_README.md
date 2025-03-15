# Diwar Climb - WebSocket Server

This is the WebSocket server component for the Diwar Climb multiplayer game. It handles client connections and broadcasts player positions to all connected clients.

## Prerequisites

- Node.js (v14.0.0 or higher recommended)
- npm (Node Package Manager)

## Installation

1. Make sure you have Node.js and npm installed on your system.
2. Install the required dependencies:

```bash
npm install
```

This will install the `ws` WebSocket library required by the server.

## Running the Server

To start the WebSocket server, run:

```bash
node server.js
```

Or use the npm script:

```bash
npm start
```

The server will start on port 8080 by default. You should see the following output:

```
WebSocket server started on port 8080
Waiting for client connections...
```

## Testing the Server

A test client is provided to verify the server functionality:

1. Start the server as described above.
2. Open `test-client.html` in a web browser.
3. Click the "Connect to Server" button to establish a WebSocket connection.
4. Once connected, you can click "Send Random Position" to send random position data to the server.
5. The server will broadcast this position to all connected clients.

You can open multiple instances of the test client in different browser tabs to simulate multiple players.

## Server Features

- Assigns a unique ID to each connected client
- Tracks player positions
- Broadcasts position updates to all clients at 30 FPS
- Handles client disconnections gracefully
- Provides detailed logging

## Protocol

The server and clients communicate using JSON messages with the following format:

### Client to Server

```json
{
  "type": "position",
  "x": 0,
  "y": 0,
  "z": 0
}
```

### Server to Client (Initialization)

```json
{
  "type": "init",
  "id": 1
}
```

### Server to Client (Position Updates)

```json
{
  "type": "positions",
  "players": [
    { "id": 1, "x": 0, "y": 0, "z": 0 },
    { "id": 2, "x": 5, "y": 10, "z": 0 }
  ]
}
```

## Shutting Down

The server can be stopped by pressing `Ctrl+C` in the terminal. It will gracefully close all connections before exiting. 