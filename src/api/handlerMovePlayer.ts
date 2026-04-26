import { gameState } from "./gamestate";
import type { Request, Response, NextFunction } from "express";
import type { Enemy } from "./gamestate";

export async function handlerMovePlayer(req: Request, res: Response, next: NextFunction) {
    const { x, y, enemyId } = req.body;

    if (typeof enemyId === "number") {
        const enemy = gameState.enemies.find((e: Enemy) => e.id === enemyId);
        if (!enemy) {
            return res.status(404).json({ success: false, message: "Enemy not found" });
        }

        const dx = enemy.x - gameState.player.x;
        const dy = enemy.y - gameState.player.y;
        const distance = Math.hypot(dx, dy);

        if (distance <= gameState.player.attackRange) {
            delete gameState.player.targetX;
            delete gameState.player.targetY;
            return res.json({ success: true, message: "Already in attack range", gameState });
        }

        const ratio = (distance - gameState.player.attackRange) / distance;
        gameState.player.targetX = gameState.player.x + dx * ratio;
        gameState.player.targetY = gameState.player.y + dy * ratio;
        return res.json({ success: true, gameState });
    }

    if (typeof x === "number" && typeof y === "number") {
        gameState.player.targetX = x;
        gameState.player.targetY = y;
        return res.json({ success: true, gameState });
    }

    return res.status(400).json({ success: false, message: "Invalid move request" });
}

