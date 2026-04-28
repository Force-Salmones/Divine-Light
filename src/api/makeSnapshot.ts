import { gameState, type GameStateSnapshot } from "./gamestate";

/**
 * Builds a per-player snapshot from the authoritative server state.
 * This is what we send to the browser over WS / HTTP.
 */
export function makeGameStateSnapshot(playerId: string): GameStateSnapshot {
    const player = gameState.players[playerId];
    if (!player) {
        throw new Error(`Player not found for snapshot: ${playerId}`);
    }

    return {
        players: gameState.players,
        enemies: gameState.enemies,
        selectedTargets: gameState.selectedTargets,
        lastAttackEvents: gameState.lastAttackEvents,

        selfId: playerId,
        player,
        selectedEnemyId: gameState.selectedTargets[playerId] ?? null,
        lastAttackResult: player.lastAttackResult,
        lastIncomingHit: player.lastIncomingHit,
    };
}
