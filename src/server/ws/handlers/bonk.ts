import type { WsHandlerContext } from "./types";
import { serverGameState } from "@/server/state/gameState";
import { calculateTargetDistance } from "@/game/logic/movement/calculateTargetDistance";
import { sendWsToPlayer } from "../sendWsToPlayer";

export function handleBonk(ctx: WsHandlerContext, msg: any) {
	const { targetPlayerId } = msg as {
		targetPlayerId?: string;
	};
	const pid = ctx.playerId;

	if (typeof targetPlayerId !== "string" || !targetPlayerId) return;
	if (targetPlayerId === pid) return;

	const bonker = serverGameState.players[pid];
	const bonkee = serverGameState.players[targetPlayerId];
	if (!bonker || !bonkee) return;

	const distance = calculateTargetDistance(bonker, bonkee);

	if (distance > bonker.attackRange) {
		return;
	}

	const evt = {
		type: "bonk",
		fromId: pid,
		toId: targetPlayerId,
		x: bonkee.x,
		y: bonkee.y,
		timestamp: Date.now(),
	};

	sendWsToPlayer(pid, evt);
	sendWsToPlayer(targetPlayerId, evt);
}
