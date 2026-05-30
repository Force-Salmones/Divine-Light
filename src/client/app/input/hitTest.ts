/**
 * Hit-testing utilities.
 */

//import { ITEM_SIZE } from "../../../constants.js";
const ITEM_SIZE = 16;
import type { GameStateSnapshot } from "../../../shared/protocol/gamestate.js";
import type { SelectedEntity } from "../state/store.js";

/**
 * Determine which entity is at a world-space coordinate.
 */
export function getEntityAt(
	snapshot: GameStateSnapshot,
	x: number,
	y: number,
): SelectedEntity {
	// Prefer other players over self if overlapping.
	for (const p of Object.values(snapshot.players ?? {})) {
		if (p.id === snapshot.selfId) continue;
		if (x >= p.x && x <= p.x + p.size && y >= p.y && y <= p.y + p.size) {
			return { type: "player", id: p.id };
		}
	}

	// Self
	const self = snapshot.player;
	if (
		x >= self.x &&
		x <= self.x + self.size &&
		y >= self.y &&
		y <= self.y + self.size
	) {
		return { type: "player", id: self.id };
	}

	// Enemies
	const enemy = snapshot.enemies.find(
		(e) => x >= e.x && x <= e.x + e.size && y >= e.y && y <= e.y + e.size,
	);
	return enemy ? { type: "enemy", id: enemy.id } : null;
}

export type HitGroundItem = { id: string };

export function getGroundItemAt(
	snapshot: GameStateSnapshot,
	x: number,
	y: number,
): HitGroundItem | null {
	const items = snapshot.groundItems ?? [];
	for (let i = items.length - 1; i >= 0; i--) {
		const gi = items[i]!;
		if (
			x >= gi.x &&
			x <= gi.x + ITEM_SIZE &&
			y >= gi.y &&
			y <= gi.y + ITEM_SIZE
		) {
			return { id: gi.id };
		}
	}
	return null;
}
