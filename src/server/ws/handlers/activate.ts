import { getPlayerFromId } from "@/server/util/getPlayerFromId";
import type { WsHandlerContext } from "./types";
import { applyUseEffect } from "@/server/services/items/useEffects";
import { getItemDef } from "@/server/services/items/itemRegistry";
import { validateSlotRef } from "@/shared/protocol/helpers/validateSlotRef";

export function handleActivate(ctx: WsHandlerContext, msg: any) {
	const player = getPlayerFromId(ctx.playerId);
	if (!player) return;

	const source = msg?.source;
	if (!source || typeof source !== "object") return;
	if (source.kind === "itemId") {
		const itemId = source.itemId;
		if (!Number.isInteger(itemId)) return;
		const slots = player.inventory.slots;
		const slotIndex = slots.findIndex(
			(s) => s?.itemId === itemId && (s?.quantity ?? 0) > 0,
		);
		if (slotIndex === -1) return;

		const slot = slots[slotIndex]!;
		const def = getItemDef(slot.itemId);
		if (def.type !== "use") return;

		applyUseEffect(def.typeProps.effectId, player);

		slot.quantity -= 1;
		if (slot.quantity <= 0) {
			slots[slotIndex] = null;
		}
		return;
	} else if (source.kind === "inventorySlot") {
		const ref = validateSlotRef(source.slot, player.bankOpen);
		if (!ref) return;

		if (ref.from !== "inventory") return;

		const slot = player.inventory.slots[ref.slotIndex];
		if (!slot || slot.quantity < 1) return;

		const def = getItemDef(slot.itemId);
		if (def.type !== "use") return;

		applyUseEffect(def.typeProps.effectId, player);

		slot.quantity -= 1;
		if (slot.quantity <= 0) {
			player.inventory.slots[ref.slotIndex] = null;
		}
		return;
	}
	//skills later
}
