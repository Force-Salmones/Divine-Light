import { gameState, type Player, type Enemy } from "./gamestate";
import type { Request, Response, NextFunction } from "express";
import { makeGameStateSnapshot } from "./makeSnapshot";
import { PLAYER_SIZE } from "../constants.js";

export async function handlerMovePlayer(req: Request, res: Response, next: NextFunction) {
    const { x, y, enemyId } = req.body as { x?: number; y?: number; enemyId?: number };

    // Prefer authenticated playerId (set by requireJwtForApi). Fall back to request body for older/dev callers.
    const resolvedPlayerId: string | undefined = (req as any).userId ?? (req.body as any).playerId;
    if (!resolvedPlayerId) {
        return res.status(400).json({ success: false, message: "No playerId provided" });
    }

    const player: Player | undefined = gameState.players[resolvedPlayerId];
    if (!player) {
        return res.status(404).json({ success: false, message: "Player not found" });
    }

    if (typeof enemyId === "number") {
        const enemy = gameState.enemies.find((e: Enemy) => e.id === enemyId);
        if (!enemy) {
            return res.status(404).json({ success: false, message: "Enemy not found" });
        }

        // Use sprite centers for accurate range checks and targeting
        const playerCenterX = player.x + PLAYER_SIZE / 2;
        const playerCenterY = player.y + PLAYER_SIZE / 2;
        const enemyCenterX = enemy.x + enemy.size / 2;
        const enemyCenterY = enemy.y + enemy.size / 2;

        const dx = enemyCenterX - playerCenterX;
        const dy = enemyCenterY - playerCenterY;
        const distance = Math.hypot(dx, dy);

        if (distance <= player.attackRange) {
            delete player.targetX;
            delete player.targetY;
            return res.json({ success: true, message: "Already in attack range", gameState: makeGameStateSnapshot(resolvedPlayerId) });
        }

        // Move slightly inside the range to avoid stopping just outside
        const approachMargin = 3; // pixels closer than exact range
        const desiredDistance = Math.max(0, player.attackRange - approachMargin);
        if (distance === 0) {
            // Edge case: already overlapping; just clear movement
            delete player.targetX;
            delete player.targetY;
            return res.json({ success: true, gameState: makeGameStateSnapshot(resolvedPlayerId) });
        }

        const ratio = (distance - desiredDistance) / distance;
        const targetCenterX = playerCenterX + dx * ratio;
        const targetCenterY = playerCenterY + dy * ratio;

        // Convert back to top-left for movement system
        player.targetX = targetCenterX - PLAYER_SIZE / 2;
        player.targetY = targetCenterY - PLAYER_SIZE / 2;
        return res.json({ success: true, gameState: makeGameStateSnapshot(resolvedPlayerId) });
    }

    if (typeof x === "number" && typeof y === "number") {
        player.targetX = x;
        player.targetY = y;
        return res.json({ success: true, gameState: makeGameStateSnapshot(resolvedPlayerId) });
    }

    return res.status(400).json({ success: false, message: "Invalid move request" });
}

