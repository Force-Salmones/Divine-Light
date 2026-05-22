import type { Enemy, Player } from "@/api/gamestate";

export function targetInRange(
	attacker: Player | Enemy,
	defender: Player | Enemy,
) {
	// Use sprite centers for distance
	const playerCenterX = attacker.x + attacker.size / 2;
	const playerCenterY = attacker.y + attacker.size / 2;
	const enemyCenterX = defender.x + defender.size / 2;
	const enemyCenterY = defender.y + defender.size / 2;
	const dx = enemyCenterX - playerCenterX;
	const dy = enemyCenterY - playerCenterY;
	const distance = Math.hypot(dx, dy);

	return distance <= attacker.attackRange;
}
