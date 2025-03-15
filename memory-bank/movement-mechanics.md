# Diwar Climb - Advanced Movement Mechanics

This document details the advanced movement mechanics implemented in Diwar Climb, including their controls, behavior, and implementation details.

## Movement Types

### 1. Wall Running

Wall running allows the player to run along vertical surfaces for a limited time.

**Controls:**
- Approach a wall while moving
- Press and hold Q while near a wall
- Jump off the wall with SPACE for a wall jump

**Behavior:**
- Player can run along vertical surfaces for up to 2 seconds
- Gravity is reduced while wall running
- Camera tilts in the direction of the wall
- Particle effects spawn from the player's feet
- Wall jumping provides a boost in the direction away from the wall

**Implementation Details:**
- Wall detection uses raycasting to find nearby vertical surfaces
- Wall normal is stored to determine the direction of the wall
- Gravity is modified during wall running
- Wall running has a cooldown of 1 second after use

### 2. Sliding

Sliding allows the player to quickly move under obstacles and maintain momentum.

**Controls:**
- Press SHIFT while moving

**Behavior:**
- Player's height is reduced during sliding
- Camera lowers to reflect the player's position
- Slight camera tilt for visual feedback
- Particle effects trail behind the player
- Sliding maintains momentum and can be used to move faster downhill

**Implementation Details:**
- Player collision box height is reduced during sliding
- Sliding has a duration of 1 second
- Sliding has a cooldown of 0.5 seconds
- Sliding speed is affected by the terrain slope

### 3. Dashing

Dashing provides a quick burst of speed in the direction of movement.

**Controls:**
- Press E to dash in the direction of movement

**Behavior:**
- Player quickly moves in the current direction
- Camera FOV increases during dash for a speed effect
- Bright particle trail follows the player
- Brief lighting effect illuminates the scene

**Implementation Details:**
- Dash provides a force in the direction of movement
- Dash has a duration of 0.3 seconds
- Dash has a cooldown of 2 seconds
- Dash can be used in mid-air

## Visual Effects

Each movement ability has associated visual effects:

1. **Wall Running Effects:**
   - Dust particles spawn at contact point with wall
   - Particles follow player movement along the wall
   - Camera tilt provides visual feedback

2. **Sliding Effects:**
   - Dust trail behind the player
   - Camera lowering and slight tilt
   - Particle burst at the start and end of slide

3. **Dashing Effects:**
   - Motion blur effect (FOV change)
   - Bright particle trail in player's wake
   - Brief lighting intensity increase
   - Afterimage effect showing player's previous positions

## Camera Effects

The camera system has been enhanced to provide visual feedback for each movement type:

1. **Wall Running Camera:**
   - Tilts in the direction of the wall
   - Slight shake for impact feedback

2. **Sliding Camera:**
   - Lowers to player's sliding height
   - Slight forward tilt

3. **Dashing Camera:**
   - FOV increases temporarily
   - Slight motion blur effect
   - Quick lerp to new position

## Combining Abilities

The movement abilities can be combined for advanced traversal:

- Wall run → Wall jump → Dash
- Slide → Jump → Wall run
- Dash → Slide for extended momentum
- Double jump → Wall run → Wall jump

## Performance Considerations

- Particle effects are pooled for better performance
- Effects intensity can scale based on device performance
- Camera effects use efficient lerping for smooth transitions

## Future Enhancements

- Sound effects for each movement type
- Advanced particle systems with GPU acceleration
- More movement abilities (grappling hook, double dash)
- Movement combo system with rewards
- Adaptive difficulty for movement challenges 