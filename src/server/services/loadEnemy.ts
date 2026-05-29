import type { Mob } from "@/db/schema";
import type { Enemy } from "../state/gameState";
import { getMobDef } from "./mobs/mobsRegistry";

export async function loadEnemy(mob: Mob): Promise<Enemy> {
	const mobData = getMobDef(mob.mobId);

	const nowMs = Date.now();
	const enemy: Enemy = {
		id: mob.id, // unique instance id from DB row
		mobId: mob.mobId, // enemy type id
		name: mobData.name,
		level: mobData.level,
		experience: mobData.experience,
		gold: mobData.gold,
		currHealth: mobData.health,
		maxHealth: mobData.health,
		damage: mobData.damage,
		damageType: mobData.damageType,
		attackSpeed: mobData.attackSpeed,
		attackRange: mobData.attackRange,
		defense: mobData.defense,
		resistance: mobData.resistance,
		speed: mobData.speed,
		respawnTime: mobData.respawnTime,
		aggressive: mobData.aggressive,
		retreats: mobData.retreats,
		drops: mobData.drops,
		x: mob.homeX,
		y: mob.homeY,
		homeX: mob.homeX,
		homeY: mob.homeY,
		targetPlayerId: null,
		targetX: undefined,
		targetY: undefined,
		// Start with a short idle pause so mobs don't all move instantly on load
		nextRoamTimeMs: nowMs + 4000 + Math.random() * 5000,
		lastAttackTime: 0,
		sprite: `/assets/mobs/${mob.mobId}.png`,
		size: mobData.size,
	};
	return enemy;
}
