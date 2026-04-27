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

    const player: Player | undefined = gameState.players[playerId] ?? gameState.player;
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

    // Check attack cooldown
    const now = Date.now() / 1000; // Convert to seconds
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
    if (damage <= 0) {
        // No effective damage dealt; still count as an attack event but don't change HP
        return {
            success: true,
            enemyId,
            enemyHealth: Math.max(0, enemy.currHealth),
            enemyDead: false
        };
    }
    const attackX = enemy.x;
    const attackY = enemy.y;
    enemy.currHealth -= damage;
    const enemyDead = enemy.currHealth <= 0;

    // Log event for multiplayer
    gameState.lastAttackEvents.push({
        playerId,
        enemyId,
        damage,
        timestamp: Date.now(),
        x: attackX,
        y: attackY,
        enemyDead
    });

    // Back-compat for current client: mirror last event for selfId
    if (gameState.selfId && gameState.selfId === playerId) {
        gameState.lastAttackResult = {
            enemyId,
            damage,
            timestamp: Date.now(),
            x: attackX,
            y: attackY,
            enemyDead
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
        // Back-compat alias
        if (gameState.selfId && gameState.selectedEnemyId === enemyId) {
            gameState.selectedEnemyId = null;
        }
        // Schedule respawn
        try {
            scheduleMobRespawn(enemy);
        } catch (err) {
            console.error("Failed to schedule mob respawn:", err);
        }
        // TODO: call defeatEnemy(playerId, enemy.mobId)
    }

    // Keep alias player reference updated if needed
    if (gameState.selfId) {
        const selfPlayer = gameState.players[gameState.selfId];
        if (selfPlayer) {
            gameState.player = selfPlayer;
        }
    }

    return {
        success: true,
        enemyId,
        enemyHealth: Math.max(0, enemy.currHealth),
        enemyDead
    };
}
