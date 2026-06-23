import { getPlayerFromId } from "@/server/util/getPlayerFromId";
import type { WsHandlerContext } from "./types";

export function handleClearHotbar(
	ctx: WsHandlerContext,
	msg: { index: number },
) {
	const player = getPlayerFromId(ctx.playerId);
	if (!player) {
		console.error(`Invalid pid in handleClearHotbar: ${ctx.playerId}`);
		return;
	}
	const index = msg.index;
	if (index < 0 || index > 8) {
		console.error(`Invalid msg.toIndex in handleClearHotbar: ${index}`);
		return;
	}
	player.hotbar.slots[index] = null;
}
