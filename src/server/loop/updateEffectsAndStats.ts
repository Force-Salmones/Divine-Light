import { recomputePlayerStats } from "../services/modifiers/recomputePlayerStats";
import { serverGameState } from "../state/gameState";

export function updateEffectsAndStats(nowMs: number) {
	for (const player of Object.values(serverGameState.players)) {
		if (player.activeEffects?.length) {
			player.activeEffects = player.activeEffects.filter(
				(e) => e.expiresAtMs > nowMs,
			);
		}
		recomputePlayerStats(player, nowMs);
	}

	for (const enemy of serverGameState.enemies) {
		if (!enemy.activeEffects?.length) continue;
		enemy.activeEffects = enemy.activeEffects.filter(
			(e) => e.expiresAtMs > nowMs,
		);
	}
}
