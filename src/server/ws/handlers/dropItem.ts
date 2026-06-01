import { getPlayerFromId } from "@/server/util/getPlayerFromId";
import type { WsHandlerContext } from "./types";
import { createGroundItem } from "@/server/services/items/createGroundItem";
import type { SlotRef } from "@/shared/protocol/ws";
import { validateSlotRef } from "@/shared/protocol/helpers/validateSlotRef";

export function handleDropItem(ctx: WsHandlerContext, msg: any) {
	const player = getPlayerFromId(ctx.playerId);
	if (!player) return;

	const res: SlotRef | undefined = validateSlotRef(msg.slot, player.bankOpen);
	if (!res) return;
	const { from, slotIndex } = res;

	const slot = player[from].slots[slotIndex];
	if (!slot) return;
	createGroundItem(
		slot.itemId,
		slot.quantity,
		player.x,
		player.y,
		player.size,
	);

	player[from].slots[slotIndex] = null;
}
