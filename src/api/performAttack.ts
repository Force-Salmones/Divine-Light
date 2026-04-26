import { gameState } from "./gamestate";
import type { Enemy } from "./gamestate";

export interface AttackResult {
    success: boolean;
    enemyId: number;
    enemyHealth: number;
    enemyDead: boolean;
    message?: string;
}

export function performAttack(enemyId: number): AttackResult | null {
    const enemy = gameState.enemies.find((e: Enemy) => e.id === enemyId);
    if (!enemy) {
        return null;
    }

    const dx = enemy.x - gameState.player.x;
    const dy = enemy.y - gameState.player.y;
    const distance = Math.hypot(dx, dy);
    
    // Check if in range
    if (distance > gameState.player.attackRange) {
        return null;
    }

    // Check attack cooldown
    const now = Date.now() / 1000; // Convert to seconds
    const timeSinceLastAttack = now - gameState.player.lastAttackTime;
    if (timeSinceLastAttack < gameState.player.attackSpeed) {
        return null;
    }

    // Update last attack time
    gameState.player.lastAttackTime = now;

    // Deal damage
    const damage = 10;
    const attackX = enemy.x;
    const attackY = enemy.y;
    enemy.health -= damage;
    const enemyDead = enemy.health <= 0;

    // Record attack for client display
    gameState.lastAttackResult = {
        enemyId,
        damage,
        timestamp: Date.now(),
        x: attackX,
        y: attackY,
        enemyDead
    };

    if (enemyDead) {
        gameState.enemies = gameState.enemies.filter((e: Enemy) => e.id !== enemyId);
        gameState.selectedEnemyId = null; // Deselect if enemy dies
        //after the refactor, we should call defeatEnemy here with the mobId and player id
    }

    return {
        success: true,
        enemyId,
        enemyHealth: Math.max(0, enemy.health),
        enemyDead
    };}
