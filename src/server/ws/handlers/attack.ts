import { serverGameState } from "../../state/gameState";
import type { WsHandlerContext } from "./types";
import { calculateApproachCoords } from "../../../game/logic/movement/calculateApproachCoords";
import { performAttack } from "../../../server/services/combat/performAttack";
import { getPlayerFromId } from "@/server/util/getPlayerFromId";

export function handleAttack(ctx: WsHandlerContext, msg: { enemyId: number }) {
	const { enemyId } = msg;
	const pid = ctx.playerId;

	if (typeof enemyId !== "number") return;
	serverGameState.selectedTargets[ctx.playerId] = enemyId;

	// If out of range, also set a movement target toward the enemy
	const player = getPlayerFromId(pid);
	const enemy = serverGameState.enemies.find((e) => e.id === enemyId);

	if (player && enemy) {
		const approachCoords = calculateApproachCoords(player, enemy);
		if (approachCoords) {
			[player.targetX, player.targetY] = approachCoords;
		}
	}

	// Try an immediate attack; subsequent hits handled by server loop
	performAttack(pid, enemyId);
}
