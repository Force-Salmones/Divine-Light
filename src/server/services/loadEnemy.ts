import type { Mob } from "@/db/schema";
import { readFile } from "node:fs/promises";
import type { Enemy } from "../state/gameState";

export async function loadEnemy(mob: Mob): Promise<Enemy> {
	const jsonRaw = await readFile(
		new URL("../../db/data/mobs.json", import.meta.url),
		"utf8",
	);
	const jsonData = JSON.parse(jsonRaw);
	const mobData = jsonData[mob.mobId];
	if (!mobData) {
		throw new Error(`Enemy type ${mob.mobId} not found in mobs.json`);
	}

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
		reSpawnTime: mobData.reSpawnTime,
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
