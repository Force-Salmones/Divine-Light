import { gameState, type Enemy, type Player } from "./gamestate";
import { scheduleMobRespawn } from "../server/respawn";
import { defeatEnemy } from "./defeatEnemy";
import { rollPhysicalDamage } from "./calcDamage";

export interface AttackResult {
    success: boolean;
    enemyId: number;
    enemyHealth: number;
    enemyDead: boolean;
    message?: string;
}

export function performAttack(playerId: string, enemyId: number): AttackResult | null {
    const enemy = gameState.enemies.find((e: Enemy) => e.id === enemyId);
    if (!enemy) {
        return null;
    }

    const player: Player | undefined = gameState.players[playerId];
    if (!player) {
        return null;
    }

    // Use sprite centers for distance (player 32x32, enemy 24x24)
    const playerCenterX = player.x + 16;
    const playerCenterY = player.y + 16;
    const enemyCenterX = enemy.x + 12;
    const enemyCenterY = enemy.y + 12;
    const dx = enemyCenterX - playerCenterX;
    const dy = enemyCenterY - playerCenterY;
    const distance = Math.hypot(dx, dy);
    
    // Check if in range
    if (distance > player.attackRange) {
        console.log("performAttack: out of range", { playerId, enemyId, distance, attackRange: player.attackRange });
        return null;
    }

    const nowMs = Date.now();

    // Check attack cooldown
    const now = nowMs / 1000; // seconds
    const timeSinceLastAttack = now - player.lastAttackTime;
    if (timeSinceLastAttack < player.attackSpeed) {
        console.log("performAttack: on cooldown", { playerId, enemyId, timeSinceLastAttack, attackSpeed: player.attackSpeed });
        return null;
    }

    // Update last attack time
    player.lastAttackTime = now;

    // Now that we know this is a valid, in-range attack, mark this player as the enemy's target (aggro)
    enemy.targetPlayerId = player.id;

    // Deal physical damage based on player stats and enemy defense
    const damage = rollPhysicalDamage(player, enemy);
    console.log("performAttack: success", { playerId, enemyId, damage, distance });

    const attackX = enemy.x;
    const attackY = enemy.y;

    if (damage > 0) {
        enemy.currHealth -= damage;
    }
    const enemyDead = enemy.currHealth <= 0;

    // Record per-player event (so multiple concurrent clients don't stomp each other)
    player.lastAttackResult = {
        enemyId,
        damage,
        timestamp: nowMs,
        x: attackX,
        y: attackY,
        enemyDead,
    };

    // Log event for multiplayer / debugging
    gameState.lastAttackEvents.push({
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
    if (gameState.lastAttackEvents.length > MAX_EVENTS) {
        gameState.lastAttackEvents.splice(0, gameState.lastAttackEvents.length - MAX_EVENTS);
    }

    if (damage <= 0) {
        return {
            success: true,
            enemyId,
            enemyHealth: Math.max(0, enemy.currHealth),
            enemyDead: false,
        };
    }

    if (enemyDead) {
        // Award experience, gold, etc. for defeating the enemy
        try {
            // Use the same player object reference from gameState so changes are visible in snapshots
            void defeatEnemy(player, enemy);
        } catch (err) {
            console.error("defeatEnemy failed", err);
        }

        // Remove from current enemies
        gameState.enemies = gameState.enemies.filter((e: Enemy) => e.id !== enemyId);
        // Clear selections
        Object.keys(gameState.selectedTargets).forEach((pid) => {
            if (gameState.selectedTargets[pid] === enemyId) {
                gameState.selectedTargets[pid] = null;
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
        success: true,
        enemyId,
        enemyHealth: Math.max(0, enemy.currHealth),
        enemyDead
    };
}
