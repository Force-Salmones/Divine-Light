import { serverGameState } from "../state/gameState";
import { performAttack } from "../services/combat/performAttack";

export function updateAutomaticAttack() {
	// Perform automatic attacks per selectedTargets
	for (const [playerId, enemyId] of Object.entries(
		serverGameState.selectedTargets,
	)) {
		if (typeof enemyId === "number") {
			performAttack(playerId, enemyId);
		}
	}
}
