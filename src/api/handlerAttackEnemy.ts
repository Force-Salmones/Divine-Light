import { gameState, type Player } from "./gamestate";
import type { Request, Response, NextFunction } from "express";
import { performAttack } from "./performAttack";

export async function handlerAttackEnemy(req: Request, res: Response, next: NextFunction) {
    const { enemyId, playerId } = req.body as { enemyId?: number; playerId?: string };

    if (typeof enemyId !== "number") {
        return res.status(400).json({ success: false, message: "Invalid enemy ID" });
    }

    const resolvedPlayerId: string | undefined = playerId ?? gameState.selfId ?? Object.keys(gameState.players)[0];
    if (!resolvedPlayerId) {
        return res.status(400).json({ success: false, message: "No player available" });
    }

    const player: Player | undefined = gameState.players[resolvedPlayerId] ?? gameState.player;
    if (!player) {
        return res.status(404).json({ success: false, message: "Player not found" });
    }

    const result = performAttack(resolvedPlayerId, enemyId);

    if (!result) {
        const enemy = gameState.enemies.find(e => e.id === enemyId);
        if (!enemy) {
            return res.status(404).json({ success: false, message: "Enemy not found" });
        }

        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distance = Math.hypot(dx, dy);
        if (distance > player.attackRange) {
            return res.status(400).json({ success: false, message: "Enemy out of range" });
        }

        const now = Date.now() / 1000;
        const timeSinceLastAttack = now - player.lastAttackTime;
        const cooldownRemaining = Math.max(0, player.attackSpeed - timeSinceLastAttack);
        return res.status(429).json({ success: false, message: "Attack on cooldown", cooldownRemaining });
    }

    // Record selected enemy for automatic attacks
    gameState.selectedTargets[resolvedPlayerId] = enemyId;
    if (gameState.selfId === resolvedPlayerId) {
        gameState.selectedEnemyId = enemyId; // back-compat alias
    }

    res.json(result);
}