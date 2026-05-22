/**
 * Range helpers used for client-side UI decisions.
 *
 * The server remains authoritative for actual combat.
 */

import type {
	EnemyPublic,
	PlayerPublic,
	PlayerPrivate,
} from "../../../shared/protocol/gamestate.js";

export type PlayerSelf = PlayerPublic & PlayerPrivate;

/**
 * Returns true if self is within attack range of an enemy.
 */
export function isWithinAttackRange(self: PlayerSelf, enemy: EnemyPublic) {
	const selfCenterX = self.x + self.size / 2;
	const selfCenterY = self.y + self.size / 2;
	const targetCenterX = enemy.x + enemy.size / 2;
	const targetCenterY = enemy.y + enemy.size / 2;
	return (
		Math.hypot(targetCenterX - selfCenterX, targetCenterY - selfCenterY) <=
		self.attackRange
	);
}

/**
 * Returns true if self is within attack range of another player.
 */
export function isWithinPlayerAttackRange(
	self: PlayerSelf,
	target: PlayerPublic,
) {
	const selfCenterX = self.x + self.size / 2;
	const selfCenterY = self.y + self.size / 2;
	const targetCenterX = target.x + target.size / 2;
	const targetCenterY = target.y + target.size / 2;
	return (
		Math.hypot(targetCenterX - selfCenterX, targetCenterY - selfCenterY) <=
		self.attackRange
	);
}
