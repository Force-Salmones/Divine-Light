import { gameState, type Player, type Enemy } from "../api/gamestate";
import { performAttack } from "../api/performAttack";
import { updateRespawns } from "./respawn";
import { rollEnemyDamage } from "../api/calcDamage";

export function updateServerMovement(deltaSeconds: number) {
    // Move all players with targets
    for (const [playerId, player] of Object.entries(gameState.players)) {
        if (player.targetX === undefined || player.targetY === undefined) continue;

        const dx = player.targetX - player.x;
        const dy = player.targetY - player.y;
        const distance = Math.hypot(dx, dy);
        const maxDistance = player.speed * deltaSeconds;

        if (distance <= maxDistance || distance < 0.5) {
            player.x = player.targetX;
            player.y = player.targetY;
            delete player.targetX;
            delete player.targetY;
        } else {
            const ratio = maxDistance / distance;
            player.x += dx * ratio;
            player.y += dy * ratio;
        }

        // Keep alias updated for self
        if (gameState.selfId && gameState.selfId === playerId) {
            gameState.player = player;
        }
    }
    // Enemy AI: movement + attacks
    const LEASH_DISTANCE = 300;

    for (const enemy of gameState.enemies as Enemy[]) {
        const targetId = enemy.targetPlayerId ?? null;

        if (targetId) {
            const player = gameState.players[targetId];
            if (!player) {
                enemy.targetPlayerId = null;
                enemy.targetX = enemy.homeX;
                enemy.targetY = enemy.homeY;
            } else {
                // Check leash distance from home
                const homeDx = enemy.x - enemy.homeX;
                const homeDy = enemy.y - enemy.homeY;
                const distFromHome = Math.hypot(homeDx, homeDy);
                if (distFromHome > LEASH_DISTANCE) {
                    // Too far from home: drop aggro and return
                    enemy.targetPlayerId = null;
                    enemy.targetX = enemy.homeX;
                    enemy.targetY = enemy.homeY;
                } else {
                    // Chase the player if out of range
                    const enemyCenterX = enemy.x + 12;
                    const enemyCenterY = enemy.y + 12;
                    const playerCenterX = player.x + 16;
                    const playerCenterY = player.y + 16;
                    const dx = playerCenterX - enemyCenterX;
                    const dy = playerCenterY - enemyCenterY;
                    const distance = Math.hypot(dx, dy);
                    const approachMargin = 3;
                    const desiredDistance = Math.max(0, enemy.attackRange - approachMargin);

                    if (distance > desiredDistance && distance > 0) {
                        const ratio = (distance - desiredDistance) / distance;
                        const targetCenterX = enemyCenterX + dx * ratio;
                        const targetCenterY = enemyCenterY + dy * ratio;
                        enemy.targetX = targetCenterX - 12; // enemy sprite 24x24
                        enemy.targetY = targetCenterY - 12;
                    } else {
                        enemy.targetX = undefined;
                        enemy.targetY = undefined;
                    }

                    // Attempt an attack if in range and off cooldown
                    if (distance <= enemy.attackRange) {
                        const now = Date.now() / 1000;
                        const timeSinceLast = now - (enemy.lastAttackTime ?? 0);
                        if (timeSinceLast >= enemy.attackSpeed) {
                            enemy.lastAttackTime = now;
                            const damage = rollEnemyDamage(enemy, player);
                            if (damage > 0) {
                                player.currHealth = Math.max(0, player.currHealth - damage);
                                // Record last incoming hit for the local player so the client can show damage numbers
                                if (gameState.selfId && player.id === gameState.selfId) {
                                    gameState.lastIncomingHit = {
                                        damage,
                                        timestamp: Date.now(),
                                        x: player.x,
                                        y: player.y,
                                    };
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // No target: if away from home, walk back
            const dxHome = enemy.homeX - enemy.x;
            const dyHome = enemy.homeY - enemy.y;
            const distHome = Math.hypot(dxHome, dyHome);
            if (distHome > 1) {
                enemy.targetX = enemy.homeX;
                enemy.targetY = enemy.homeY;
            } else {
                enemy.targetX = undefined;
                enemy.targetY = undefined;
            }
        }

        // Apply enemy movement if targetX/Y is set
        if (enemy.targetX !== undefined && enemy.targetY !== undefined) {
            const dx = enemy.targetX - enemy.x;
            const dy = enemy.targetY - enemy.y;
            const distance = Math.hypot(dx, dy);
            const maxDistance = enemy.speed * deltaSeconds;

            if (distance <= maxDistance || distance < 0.5) {
                enemy.x = enemy.targetX;
                enemy.y = enemy.targetY;
                enemy.targetX = undefined;
                enemy.targetY = undefined;
            } else {
                const ratio = maxDistance / distance;
                enemy.x += dx * ratio;
                enemy.y += dy * ratio;
            }
        }
    }

    // Also advance respawn logic once per tick
    void updateRespawns();
}

export function updateAutomaticAttack() {
    // Perform automatic attacks per selectedTargets
    for (const [playerId, enemyId] of Object.entries(gameState.selectedTargets)) {
        if (typeof enemyId === "number") {
            performAttack(playerId, enemyId);
        }
    }
}
