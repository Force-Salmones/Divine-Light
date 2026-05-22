import { serverGameState, type Player } from "./gamestate";
import type { Request, Response, NextFunction } from "express";
import { performAttack } from "./performAttack";
import { makeGameStateSnapshot } from "./makeSnapshot";

export async function handlerAttackEnemy(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	const { enemyId } = req.body as { enemyId?: number };

	if (typeof enemyId !== "number") {
		return res
			.status(400)
			.json({ success: false, message: "Invalid enemy ID" });
	}

	// Prefer authenticated playerId (set by requireJwtForApi). Fall back to request body for older/dev callers.
	const resolvedPlayerId: string | undefined =
		(req as any).userId ?? (req.body as any).playerId;
	if (!resolvedPlayerId) {
		return res
			.status(400)
			.json({ success: false, message: "No playerId provided" });
	}

	const player: Player | undefined =
		serverGameState.players[resolvedPlayerId];
	if (!player) {
		return res
			.status(404)
			.json({ success: false, message: "Player not found" });
	}

	const result = performAttack(resolvedPlayerId, enemyId);

	if (!result) {
		const enemy = serverGameState.enemies.find((e) => e.id === enemyId);
		if (!enemy) {
			return res
				.status(404)
				.json({ success: false, message: "Enemy not found" });
		}

		const dx = enemy.x - player.x;
		const dy = enemy.y - player.y;
		const distance = Math.hypot(dx, dy);
		if (distance > player.attackRange) {
			return res
				.status(400)
				.json({ success: false, message: "Enemy out of range" });
		}

		const now = Date.now() / 1000;
		const timeSinceLastAttack = now - player.lastAttackTime;
		const cooldownRemaining = Math.max(
			0,
			player.attackSpeed - timeSinceLastAttack,
		);
		return res
			.status(429)
			.json({
				success: false,
				message: "Attack on cooldown",
				cooldownRemaining,
			});
	}

	// Record selected enemy for automatic attacks
	serverGameState.selectedTargets[resolvedPlayerId] = enemyId;

	res.json({ ...result, gameState: makeGameStateSnapshot(resolvedPlayerId) });
}
