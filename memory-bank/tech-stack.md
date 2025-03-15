# Tech Stack Recommendations for Diwar Climb (Multiplayer)

## Chosen Stack
For a simple yet robust multiplayer game, this stack balances ease of development with real-time capabilities:

- **Frontend**: 
  - **Three.js**: 3D rendering in the browser, lightweight and flexible.
  - **Cannon.js**: Physics engine for realistic movement and collisions, pairs seamlessly with Three.js.
  - **HTML/CSS**: Basic UI for score and health.
- **Networking**: 
  - **WebSocket (via Node.js with `ws` library)**: Real-time, bidirectional communication for multiplayer syncing.
- **Backend**: 
  - **Node.js**: Simple server to manage WebSocket connections and broadcast player positions.
- **Development Tool**: 
  - **Cursor**: Vibe-coding with AI assistance, leveraging project rules for modularity.

## Why This Stack?
- **Simplicity**: Three.js + Cannon.js is beginner-friendly for 3D games, with WebSocket adding multiplayer without complexity.
- **Robustness**: WebSocket ensures low-latency syncing, Node.js scales easily, and Three.js/Cannon.js handle 3D well in browsers.
- **Modularity**: File-based structure aligns with Cursor’s project rules, avoiding monoliths.
- **Vibe-Coding Fit**: Cursor’s AI can generate modular code for this stack efficiently.

## Alternatives Considered
- **Unity + WebGL**: Too heavy for quick vibe-coding.
- **Socket.IO**: Overkill for basic position syncing; raw WebSocket is simpler.
- **Phaser**: 2D-focused, less suited for 3D climbing.

## Notes
- Start with local physics (Cannon.js), sync only player positions via WebSocket.
- Optimize by limiting active tiles and reusing objects.