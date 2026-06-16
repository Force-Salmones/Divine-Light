import type { WsHandlerContext } from "./types";
import type { StatKey } from "@/shared/protocol/gamestate";
import { statKeys } from "@/shared/protocol/gamestate";
import { sendChatToPlayer } from "@/server/chatService";
import { getPlayerFromId } from "@/server/util/getPlayerFromId";
import { recomputePlayerStats } from "@/server/services/modifiers/recomputePlayerStats";

export function handleSpendStat(ctx: WsHandlerContext, msg: any) {
	const pid = ctx.playerId;
	const { stat } = msg as { stat?: StatKey };
	const player = getPlayerFromId(pid);
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
	(player as any).baseStats[upper] =
		((player as any).baseStats[upper] ?? 0) + 1;
	player.unallocatedPoints -= 1;

	// Recalculate derived stats (HP, MP, defense, resistance)
	recomputePlayerStats(player);
}
