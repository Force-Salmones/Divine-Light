import { gameState } from "./gamestate";
import type { Request, Response, NextFunction } from "express";
import { performAttack } from "./performAttack";

export async function handlerAttackEnemy(req: Request, res: Response, next: NextFunction) {
    const { enemyId } = req.body;
    
    if (typeof enemyId === "number") {
        const result = performAttack(enemyId);
        
        if (!result) {
            const enemy = gameState.enemies.find(e => e.id === enemyId);
            if (!enemy) {
                return res.status(404).json({ success: false, message: "Enemy not found" });
            }
            
            const dx = enemy.x - gameState.player.x;
            const dy = enemy.y - gameState.player.y;
            const distance = Math.hypot(dx, dy);
            if (distance > gameState.player.attackRange) {
                return res.status(400).json({ success: false, message: "Enemy out of range" });
            }
            
            const now = Date.now() / 1000;
            const timeSinceLastAttack = now - gameState.player.lastAttackTime;
            const cooldownRemaining = gameState.player.attackSpeed - timeSinceLastAttack;
            return res.status(429).json({ success: false, message: "Attack on cooldown", cooldownRemaining });
        }

        // Set selected enemy for automatic attacks
        gameState.selectedEnemyId = enemyId;
        res.json(result);
    } else {
        res.status(400).json({ success: false, message: "Invalid enemy ID" });
    }
}