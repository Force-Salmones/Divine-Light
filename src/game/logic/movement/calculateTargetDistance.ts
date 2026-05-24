import type { Enemy } from "@/server/state/gameState";
import type { Player } from "@/server/state/gameState";

export function calculateTargetDistance(
	entity1: Player | Enemy,
	entity2: Player | Enemy,
) {
	const entity1CenterX = entity1.x + entity1.size / 2;
	const entity1CenterY = entity1.y + entity1.size / 2;
	const entity2CenterX = entity2.x + entity2.size / 2;
	const entity2CenterY = entity2.y + entity2.size / 2;
	const dx = entity2CenterX - entity1CenterX;
	const dy = entity2CenterY - entity1CenterY;
	return Math.hypot(dx, dy);
}
