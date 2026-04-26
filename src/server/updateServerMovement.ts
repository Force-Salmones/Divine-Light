import { gameState } from "../api/gamestate";
import { performAttack } from "../api/performAttack";

export function updateServerMovement(deltaSeconds: number) {
    const player = gameState.player;
    if (player.targetX === undefined || player.targetY === undefined) return;

    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    const distance = Math.hypot(dx, dy);
    const maxDistance = player.speed * deltaSeconds;

    if (distance <= maxDistance || distance < 0.5) {
        player.x = player.targetX;
        player.y = player.targetY;
        delete player.targetX;
        delete player.targetY;
        return;
    }

    const ratio = maxDistance / distance;
    player.x += dx * ratio;
    player.y += dy * ratio;
}

export function updateAutomaticAttack() {
    // Perform automatic attack on selected enemy
    if (gameState.selectedEnemyId !== null) {
        const result = performAttack(gameState.selectedEnemyId);
        if (!result) {
        }
    }
}
