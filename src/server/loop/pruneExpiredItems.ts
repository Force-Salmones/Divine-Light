import { serverGameState } from "../state/gameState.js";

export function pruneExpiredItems(nowMs: number, ttlMs: number = 30000) {
	for (const [id, gi] of serverGameState.groundItems) {
		if (nowMs - gi.spawnedAt >= ttlMs) {
			serverGameState.groundItems.delete(id);
		}
	}
}
