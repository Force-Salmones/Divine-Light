import { gameState, type Player, type Enemy } from "../api/gamestate";
import { performAttack } from "../api/performAttack";
import { updateRespawns } from "./respawn";
import { rollEnemyDamage } from "../api/calcDamage";
import { sendChatToPlayer } from "./chatService";

function respawnPlayer(player: Player) {
    // For now: treat 0 HP as "death" and instantly respawn.
    sendChatToPlayer(player.id, "You were defeated! Respawning...", true);

    player.x = 970;
    player.y = 374;
    delete player.targetX;
    delete player.targetY;

    // Heal on respawn (prevents getting stuck at 0 HP)
    player.currHealth = player.maxHealth;
    player.currMana = player.maxMana;

    // Stop any server-side auto-attack selection
    gameState.selectedTargets[player.id] = null;

    // Drop aggro from enemies currently targeting this player
    for (const enemy of gameState.enemies) {
        if (enemy.targetPlayerId === player.id) {
            enemy.targetPlayerId = null;
            enemy.targetX = enemy.homeX;
            enemy.targetY = enemy.homeY;
        }
    }
}

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
                                const before = player.currHealth;
                                player.currHealth = Math.max(0, player.currHealth - damage);

                                // Record last incoming hit for THIS player so their own client can show damage numbers
                                player.lastIncomingHit = {
                                    damage,
                                    timestamp: Date.now(),
                                    x: player.x,
                                    y: player.y,
                                };

                                // Death/respawn
                                if (before > 0 && player.currHealth <= 0) {
                                    respawnPlayer(player);
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // No target: if no movement target, decide whether to roam (step-by-step) or return home.
            const dxFromHome = enemy.x - enemy.homeX;
            const dyFromHome = enemy.y - enemy.homeY;
            const distFromHome = Math.hypot(dxFromHome, dyFromHome);

            const hasMoveTarget = enemy.targetX !== undefined && enemy.targetY !== undefined;
            if (!hasMoveTarget) {
                // If we somehow got pushed far outside the roam area, walk back home.
                const ROAM_AREA_RADIUS = 200;
                const HARD_RETURN_RADIUS = ROAM_AREA_RADIUS + 20;
                if (distFromHome > HARD_RETURN_RADIUS) {
                    enemy.targetX = enemy.homeX;
                    enemy.targetY = enemy.homeY;
                } else {
                    // Idle roaming: periodically attempt to take a 50-100px step, staying within ROAM_AREA_RADIUS.
                    const nowMs = Date.now();
                    if (nowMs >= enemy.nextRoamTimeMs) {
                        // Mildly reduce roam frequency by adding a chance to "do nothing" this cycle.
                        const ROAM_CHANCE = 0.65;
                        if (Math.random() > ROAM_CHANCE) {
                            // Try again a bit later
                            enemy.nextRoamTimeMs = nowMs + 3000 + Math.random() * 4000;
                        } else {
                            const STEP_MIN = 50;
                            const STEP_MAX = 100;
                            const step = STEP_MIN + Math.random() * (STEP_MAX - STEP_MIN);

                            // Sample a step direction; keep within the roam area circle around home.
                            let chosenX: number | undefined;
                            let chosenY: number | undefined;
                            for (let i = 0; i < 12; i++) {
                                const angle = Math.random() * Math.PI * 2;
                                const tx = enemy.x + Math.cos(angle) * step;
                                const ty = enemy.y + Math.sin(angle) * step;
                                const ddx = tx - enemy.homeX;
                                const ddy = ty - enemy.homeY;
                                if (Math.hypot(ddx, ddy) <= ROAM_AREA_RADIUS) {
                                    chosenX = tx;
                                    chosenY = ty;
                                    break;
                                }
                            }

                            // Fallback: step toward home if we couldn't find a legal direction quickly.
                            if (chosenX === undefined || chosenY === undefined) {
                                const toHomeDx = enemy.homeX - enemy.x;
                                const toHomeDy = enemy.homeY - enemy.y;
                                const toHomeDist = Math.hypot(toHomeDx, toHomeDy) || 1;
                                const ratio = step / toHomeDist;
                                chosenX = enemy.x + toHomeDx * ratio;
                                chosenY = enemy.y + toHomeDy * ratio;
                            }

                            enemy.targetX = chosenX;
                            enemy.targetY = chosenY;

                            // Do NOT schedule the next roam here; we want to pause at the destination.
                            // We'll set nextRoamTimeMs when the enemy arrives.
                            enemy.nextRoamTimeMs = Number.POSITIVE_INFINITY;
                        }
                    }
                }
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

                // If idle (not aggro'd), pause for a bit at the destination before roaming again.
                if (!enemy.targetPlayerId) {
                    const nowMs = Date.now();
                    enemy.nextRoamTimeMs = nowMs + 4000 + Math.random() * 6000;
                }
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
