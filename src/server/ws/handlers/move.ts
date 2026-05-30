import type { WsHandlerContext } from "./types";
import { serverGameState } from "@/server/state/gameState";
import { calculateApproachCoords } from "@/game/logic/movement/calculateApproachCoords";
import { getPlayerFromId } from "@/server/util/getPlayerFromId";

export function handleMove(ctx: WsHandlerContext, msg: any) {
	const { x, y, enemyId } = msg;

	const player = getPlayerFromId(ctx.playerId);
	if (!player) return;
	if (typeof enemyId === "number") {
		// Move toward enemy slightly inside attack range
		const enemy = serverGameState.enemies.find((e) => e.id === enemyId);
		if (!enemy) return;
		const approachCoords = calculateApproachCoords(player, enemy);
		if (approachCoords) {
			[player.targetX, player.targetY] = approachCoords;
		}
	} else if (typeof x === "number" && typeof y === "number") {
		player.targetX = x;
		player.targetY = y;
	}
}
