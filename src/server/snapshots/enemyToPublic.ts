import type { EnemyPublic } from "@/shared/protocol/gamestate";
import type { Enemy } from "../state/gameState";

export function enemyToPublic(enemy: Enemy): EnemyPublic {
	return {
		id: enemy.id,
		mobId: enemy.mobId,
		name: enemy.name,
		level: enemy.level,
		currHealth: enemy.currHealth,
		maxHealth: enemy.maxHealth,
		x: enemy.x,
		y: enemy.y,
		sprite: enemy.sprite,
		size: enemy.size,
		activeEffects: enemy.activeEffects,
	};
}
