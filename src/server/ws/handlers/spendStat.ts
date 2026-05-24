import type { WsHandlerContext } from "./types";
import { serverGameState } from "@/server/state/gameState";
import type { StatKey } from "@/shared/protocol/gamestate";
import { statKeys } from "@/shared/protocol/gamestate";
import { sendChatToPlayer } from "@/server/chatService";
import { recalcPlayerDerivedStats } from "@/server/services/progression/recalcPlayerStats";

export function handleSpendStat(ctx: WsHandlerContext, msg: any) {
	const pid = ctx.playerId;
	const { stat } = msg as { stat?: StatKey };
	const player = serverGameState.players[pid];
	if (!player) return;
	if (typeof stat !== "string") return;
	const upper = stat.toUpperCase();

	if (!statKeys.includes(stat)) {
		console.log(`attempted to allocate to invalid stat: ${stat}`);
		return;
	}
	if (player.unallocatedPoints <= 0) {
		sendChatToPlayer(pid, "No unallocated stat points available.", true);
		return;
	}
	(player as any)[upper] = ((player as any)[upper] ?? 0) + 1;
	player.unallocatedPoints -= 1;

	// Recalculate derived stats (HP, MP, defense, resistance)
	recalcPlayerDerivedStats(player);
}
