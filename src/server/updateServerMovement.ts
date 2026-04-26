import { gameState, type Player } from "../api/gamestate";
import { performAttack } from "../api/performAttack";
import { updateRespawns } from "./respawn";

export function updateServerMovement(deltaSeconds: number) {
    // Move all players with targets
    for (const [playerId, player] of Object.entries(gameState.players)) {
        if (player.targetX === undefined || player.targetY === undefined) continue;

        const dx = player.targetX - player.x;
        const dy = player.targetY - player.y;
        const distance = Math.hypot(dx, dy);
        const maxDistance = player.speed * deltaSeconds;

        if (distance <= maxDistance || distance < 0.5) {
            player.x = player.targetX;
            player.y = player.targetY;
            delete player.targetX;
            delete player.targetY;
        } else {
            const ratio = maxDistance / distance;
            player.x += dx * ratio;
            player.y += dy * ratio;
        }

        // Keep alias updated for self
        if (gameState.selfId && gameState.selfId === playerId) {
            gameState.player = player;
        }
    }
    // Also advance respawn logic once per tick
    void updateRespawns();
}

export function updateAutomaticAttack() {
    // Perform automatic attacks per selectedTargets
    for (const [playerId, enemyId] of Object.entries(gameState.selectedTargets)) {
        if (typeof enemyId === "number") {
            performAttack(playerId, enemyId);
        }
    }
}
