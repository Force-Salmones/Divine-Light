import { gameState } from "@/api/gamestate";
import { performAttack } from "@/api/performAttack";


export function updateAutomaticAttack() {
    // Perform automatic attacks per selectedTargets
    for (const [playerId, enemyId] of Object.entries(gameState.selectedTargets)) {
        if (typeof enemyId === "number") {
            performAttack(playerId, enemyId);
        }
    }
}
