# Multiplayer Combat System Analysis

## Overview

The multiplayer combat system in this game uses a combination of AttackEvent types and lastAttackEvents to coordinate combat between players and enemies across the network. The system handles both player-to-enemy and enemy-to-player damage, with visual feedback through damage numbers.

## AttackEvent Type

The `AttackEvent` type is defined in `src/shared/protocol/gamestate.ts` and represents a combat action that occurs in the game world. It contains:

- `playerId`: The ID of the player who initiated the attack
- `enemyId`: The ID of the enemy that was attacked
- `x`, `y`: The coordinates where the attack occurred
- `damage`: The amount of damage dealt
- `timestamp`: When the attack occurred

## lastAttackEvents in Server State

In the server state (`src/api/gamestate.ts`), `lastAttackEvents` is an array that stores recent attack events from other players. This is used to:

1. Synchronize combat information across all connected clients
2. Provide visual feedback for other players' attacks
3. Maintain a history of combat actions for proper event processing

## Client-Side Usage

### Processing Attack Events

The client processes attack events in the main game loop (`updateGameLoop` function in `src/app/script.ts`):

1. **Player-to-Enemy Damage**: When the local player attacks an enemy, the result is stored in `gameState.lastAttackResult` and displayed as white damage numbers
2. **Enemy-to-Player Damage**: When the player takes damage from enemies, it's stored in `gameState.lastIncomingHit` and displayed as red damage numbers
3. **Other Players' Damage**: When other players attack enemies, their events are in `gameState.lastAttackEvents` and displayed as light grey damage numbers

### Damage Number System

The damage number system uses:

- `spawnDamageNumber()` function to create damage number objects
- `updateDamageNumbers()` to manage their lifecycle (fade out and remove)
- `renderDamageNumbers()` to draw them on screen with animation effects

### Event Processing Logic

The system implements several key mechanisms to prevent duplicate processing:

- Timestamp-based baselines to track which events have been processed
- Key-based deduplication to avoid showing the same attack multiple times
- Pruning of old processed keys to maintain performance

## Multiplayer Combat Support

The system supports multiplayer combat by:

1. **Synchronization**: All players receive the same attack events through the WebSocket connection
2. **Visual Feedback**: Each player sees damage numbers for their own attacks, incoming damage, and other players' attacks
3. **Consistency**: Timestamp-based processing ensures all clients process events in the same order
4. **Network Efficiency**: Only recent events are stored and transmitted, reducing bandwidth usage

## Visual Feedback Components

- **Player attacks**: White damage numbers
- **Enemy attacks**: Red damage numbers
- **Other players' attacks**: Light grey damage numbers
- **Level-ups**: Green "Level X!" floating text

## Architecture Summary

```
[Client] ←→ [WebSocket] ←→ [Server]
   ↑              ↑              ↑
   |              |              |
   |              |              |
   |              |              |
[AttackEvent] ← [lastAttackEvents] ← [Server State]
   |              ↑              |
   |              |              |
   |              |              |
[Damage Numbers] ← [Processing] ← [Game Loop]
```

This architecture ensures that all players in a multiplayer session see consistent combat feedback while maintaining network efficiency.
