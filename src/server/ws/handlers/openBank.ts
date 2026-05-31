import { getPlayerFromId } from "@/server/util/getPlayerFromId";
import type { WsHandlerContext } from "./types";
import { isInBankRange } from "@/server/util/isInBankRange";

export function handleOpenBank(ctx: WsHandlerContext, msg: any) {
	const player = getPlayerFromId(ctx.playerId);
	if (!player) return;
	if (isInBankRange(player.x, player.y)) {
		player.bankOpen = true;
		return;
	}
	player.bankOpen = false;
}
