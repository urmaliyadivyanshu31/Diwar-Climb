# Game Design Document: Diwar Climb (Multiplayer Base Version)

## Overview
"Diwar Climb" is a 3D infinite climbing game where players ascend an endless structure called Diwar, navigating procedurally generated tiles. This base multiplayer version focuses on core mechanics: climbing, scoring, and real-time player interaction. Players compete or collaborate, seeing each other’s positions, with the game ending when they fall or lose health.

## Core Mechanics
- **Objective**: Climb as high as possible, earning points per tile (10 points each).
- **Tiles**: 3D platforms (stable only for base version), procedurally generated, 10 units apart vertically.
- **Player**: A simple 3D model (e.g., sphere), moves left/right, jumps to next tile.
- **Multiplayer**: Players see each other in real-time, synced via WebSockets.
- **Stats**: Health (starts at 100, ends game at 0), tracked locally.
- **Game Over**: Fall below y = -10 or health reaches 0.

## Base Features
- Infinite tile generation (stable tiles only).
- Basic player movement (left/right, jump).
- Real-time multiplayer syncing (position only).
- Simple scoring and health UI.
- No enemies, slippery tiles, or advanced visuals yet—focus on multiplayer core.

## Target Experience
A lightweight, addictive browser game with smooth multiplayer interaction, built for quick iteration and vibe-coding.

## Constraints
- Browser-based, optimized for performance (5-10 active tiles).
- Simple assets (basic shapes, no complex models yet).
- Minimal server logic for base version.