import { gameState, type Player, type Enemy } from "./gamestate";
import type { Request, Response, NextFunction } from "express";

export async function handlerMovePlayer(req: Request, res: Response, next: NextFunction) {
    const { x, y, enemyId, playerId } = req.body as { x?: number; y?: number; enemyId?: number; playerId?: string };

    const resolvedPlayerId: string | undefined = playerId ?? gameState.selfId ?? Object.keys(gameState.players)[0];
    if (!resolvedPlayerId) {
        return res.status(400).json({ success: false, message: "No player available" });
    }

    const player: Player | undefined = gameState.players[resolvedPlayerId] ?? gameState.player;
    if (!player) {
        return res.status(404).json({ success: false, message: "Player not found" });
    }

    if (typeof enemyId === "number") {
        const enemy = gameState.enemies.find((e: Enemy) => e.id === enemyId);
        if (!enemy) {
            return res.status(404).json({ success: false, message: "Enemy not found" });
        }

        // Use sprite centers for accurate range checks and targeting
        const playerCenterX = player.x + 16; // player sprite 32x32
        const playerCenterY = player.y + 16;
        const enemyCenterX = enemy.x + 12;  // enemy sprite 24x24
        const enemyCenterY = enemy.y + 12;

        const dx = enemyCenterX - playerCenterX;
        const dy = enemyCenterY - playerCenterY;
        const distance = Math.hypot(dx, dy);

        if (distance <= player.attackRange) {
            delete player.targetX;
            delete player.targetY;
            // Back-compat alias update
            if (gameState.selfId === resolvedPlayerId) {
                gameState.player = player;
            }
            return res.json({ success: true, message: "Already in attack range", gameState });
        }

        // Move slightly inside the range to avoid stopping just outside
        const approachMargin = 3; // pixels closer than exact range
        const desiredDistance = Math.max(0, player.attackRange - approachMargin);
        if (distance === 0) {
            // Edge case: already overlapping; just clear movement
            delete player.targetX;
            delete player.targetY;
            if (gameState.selfId === resolvedPlayerId) {
                gameState.player = player;
            }
            return res.json({ success: true, gameState });
        }

        const ratio = (distance - desiredDistance) / distance;
        const targetCenterX = playerCenterX + dx * ratio;
        const targetCenterY = playerCenterY + dy * ratio;

        // Convert back to top-left for movement system
        player.targetX = targetCenterX - 16;
        player.targetY = targetCenterY - 16;
        // Back-compat alias update
        if (gameState.selfId === resolvedPlayerId) {
            gameState.player = player;
        }
        return res.json({ success: true, gameState });
    }

    if (typeof x === "number" && typeof y === "number") {
        player.targetX = x;
        player.targetY = y;
        // Back-compat alias update
        if (gameState.selfId === resolvedPlayerId) {
            gameState.player = player;
        }
        return res.json({ success: true, gameState });
    }

    return res.status(400).json({ success: false, message: "Invalid move request" });
}

