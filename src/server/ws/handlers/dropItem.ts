import { getPlayerFromId } from "@/server/util/getPlayerFromId";
import type { WsHandlerContext } from "./types";
import { createGroundItem } from "@/server/services/items/createGroundItem";

export function handleDropItem(ctx: WsHandlerContext, msg: any) {
	const { slotIndex } = msg;
	if (!Number.isInteger(slotIndex)) return;
	if (slotIndex > 24 || slotIndex < 0) return;
	const player = getPlayerFromId(ctx.playerId);
	if (!player) return;

	const slot = player.inventory.slots[slotIndex];
	if (!slot) return;
	createGroundItem(
		slot.itemId,
		slot.quantity,
		player.x,
		player.y,
		player.size,
	);

	player.inventory.slots[slotIndex] = null;
}
