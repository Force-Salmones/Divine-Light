import type { WsHandlerContext } from "./types";
import { calculateTargetDistance } from "@/game/logic/movement/calculateTargetDistance";
import { sendWsToPlayer } from "../sendWsToPlayer";
import { getPlayerFromId } from "@/server/util/getPlayerFromId";

export function handleBonk(
	ctx: WsHandlerContext,
	msg: { targetPlayerId: string },
) {
	const targetPlayerId = msg.targetPlayerId;
	const pid = ctx.playerId;

	if (typeof targetPlayerId !== "string" || !targetPlayerId) return;
	if (targetPlayerId === pid) return;

	const bonker = getPlayerFromId(pid);
	const bonkee = getPlayerFromId(targetPlayerId);
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
