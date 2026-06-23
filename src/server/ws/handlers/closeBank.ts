import { getPlayerFromId } from "@/server/util/getPlayerFromId";
import type { WsHandlerContext } from "./types";

export function handleCloseBank(ctx: WsHandlerContext) {
	const player = getPlayerFromId(ctx.playerId);
	if (!player) return;
	player.bankOpen = false;
}
