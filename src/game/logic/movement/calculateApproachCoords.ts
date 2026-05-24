import type { Enemy } from "@/server/state/gameState.js";
import type { Player } from "@/server/state/gameState.js";
import { APPROACH_MARGIN } from "../../../constants.js";

export function calculateApproachCoords(
	entity1: Player | Enemy,
	entity2: Player | Enemy,
) {
	const entity1CenterX = entity1.x + entity1.size / 2;
	const entity1CenterY = entity1.y + entity1.size / 2;
	const entity2CenterX = entity2.x + entity2.size / 2;
	const entity2CenterY = entity2.y + entity2.size / 2;
	const dx = entity2CenterX - entity1CenterX;
	const dy = entity2CenterY - entity1CenterY;
	const distance = Math.hypot(dx, dy);
	const desiredDistance = Math.max(0, entity1.attackRange - APPROACH_MARGIN);
	// If already in range, don't set a movement target
	if (distance <= desiredDistance) {
		delete entity1.targetX;
		delete entity1.targetY;
		return undefined;
	}
	const ratio = (distance - desiredDistance) / distance;
	const targetCenterX = entity1CenterX + dx * ratio;
	const targetCenterY = entity1CenterY + dy * ratio;
	entity1.targetX = targetCenterX - entity1.size / 2;
	entity1.targetY = targetCenterY - entity1.size / 2;
	return [entity1.targetX, entity1.targetY];
}
