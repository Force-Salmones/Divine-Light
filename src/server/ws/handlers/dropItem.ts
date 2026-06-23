import { getPlayerFromId } from "@/server/util/getPlayerFromId";
import type { WsHandlerContext } from "./types";
import { createGroundItem } from "@/server/services/items/createGroundItem";
import { validateSlotRef } from "@/shared/protocol/helpers/validateSlotRef";
import type { SlotRef } from "@/shared/protocol/ws";
import type { Player } from "@/server/state/gameState";

function getSlot(player: Player, ref: SlotRef) {
	if (ref.from === "equipment") return player.equipment[ref.slotKey] ?? null;
	return player[ref.from].slots[ref.slotIndex] ?? null;
}

function setSlot(player: Player, ref: SlotRef, value = null) {
	if (ref.from === "equipment") {
		player.equipment[ref.slotKey] = value ?? null;
		return;
	}
	player[ref.from].slots[ref.slotIndex] = value ?? null;
}

export function handleDropItem(ctx: WsHandlerContext, msg: { slot: SlotRef }) {
	const player = getPlayerFromId(ctx.playerId);
	if (!player) return;

	const ref = validateSlotRef(msg.slot, player.bankOpen);
	if (!ref) return;

	const slotItem = getSlot(player, ref);
	if (!slotItem) return;

	createGroundItem(slotItem, player.x, player.y, player.size);
	setSlot(player, ref, null);
}
