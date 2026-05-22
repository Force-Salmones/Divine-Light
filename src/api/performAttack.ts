import { serverGameState, type Enemy, type Player } from "./gamestate";
import { scheduleMobRespawn } from "../server/respawn";
import { defeatEnemy } from "./defeatEnemy";
import { rollPhysicalDamage } from "./calcDamage";
import type { AttackEvent } from "@/shared/protocol/gamestate.js";
import { targetInRange } from "@/game/logic/combat/targetInRange.js";

export function performAttack(
	playerId: string,
	enemyId: number,
): AttackEvent | null {
	const enemy = serverGameState.enemies.find((e: Enemy) => e.id === enemyId);
	if (!enemy) {
		return null;
	}

	const player: Player | undefined = serverGameState.players[playerId];
	if (!player) {
		return null;
	}

	if (!targetInRange(player, enemy)) {
		return null;
	}

	const nowMs = Date.now();

	// Check attack cooldown
	const now = nowMs / 1000; // seconds
	const timeSinceLastAttack = now - player.lastAttackTime;
	if (timeSinceLastAttack < player.attackSpeed) {
		console.log("performAttack: on cooldown", {
			playerId,
			enemyId,
			timeSinceLastAttack,
			attackSpeed: player.attackSpeed,
		});
		return null;
	}

	// Update last attack time
	player.lastAttackTime = now;

	// Now that we know this is a valid, in-range attack, mark this player as the enemy's target (aggro)
	enemy.targetPlayerId = player.id;

	// Deal physical damage based on player stats and enemy defense
	const damage = rollPhysicalDamage(player, enemy);

	const attackX = enemy.x;
	const attackY = enemy.y;

	if (damage > 0) {
		enemy.currHealth -= damage;
	}
	const enemyDead = enemy.currHealth <= 0;

	// Record per-player event (so multiple concurrent clients don't stomp each other)
	player.lastAttackEvent = {
		playerId,
		enemyId,
		damage,
		timestamp: nowMs,
		x: attackX,
		y: attackY,
		enemyDead,
	};

	// Log event for multiplayer / debugging
	serverGameState.lastAttackEvents.push({
		playerId,
		enemyId,
		damage,
		timestamp: nowMs,
		x: attackX,
		y: attackY,
		enemyDead,
	});

	// Prevent unbounded growth
	const MAX_EVENTS = 200;
	if (serverGameState.lastAttackEvents.length > MAX_EVENTS) {
		serverGameState.lastAttackEvents.splice(
			0,
			serverGameState.lastAttackEvents.length - MAX_EVENTS,
		);
	}

	if (damage <= 0) {
		return {
			enemyId,
			enemyDead: false,
		} as AttackEvent;
	}

	if (enemyDead) {
		try {
			// Use the same player object reference from gameState so changes are visible in snapshots
			void defeatEnemy(player, enemy);
		} catch (err) {
			console.error("defeatEnemy failed", err);
		}

		// Remove from current enemies
		serverGameState.enemies = serverGameState.enemies.filter(
			(e: Enemy) => e.id !== enemyId,
		);
		// Clear selections
		Object.keys(serverGameState.selectedTargets).forEach((pid) => {
			if (serverGameState.selectedTargets[pid] === enemyId) {
				serverGameState.selectedTargets[pid] = null;
			}
		});
		// Schedule respawn
		try {
			scheduleMobRespawn(enemy);
		} catch (err) {
			console.error("Failed to schedule mob respawn:", err);
		}
		// TODO: call defeatEnemy(playerId, enemy.mobId)
	}

	return {
		enemyId,
		enemyDead,
	} as AttackEvent;
}
