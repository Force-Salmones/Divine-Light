import { getPlayerFromId } from "@/server/util/getPlayerFromId";
import { validateSlotRef } from "@/shared/protocol/helpers/validateSlotRef";
import type { WsHandlerContext } from "./types";
import { getItemDef } from "@/server/services/items/itemRegistry";
import { recomputePlayerStats } from "@/server/services/modifiers/recomputePlayerStats";
import { isInBankRange } from "@/server/util/isInBankRange";

export function handleSwapItem(ctx: WsHandlerContext, msg: any) {
	const player = getPlayerFromId(ctx.playerId);
	if (!player) return;

	const a = validateSlotRef(msg.a, player.bankOpen);
	if (!a) return;
	const b = validateSlotRef(msg.b, player.bankOpen);
	if (!b) return;

	const slotA = getSlot(player, a);
	const slotB = getSlot(player, b);

	if (a.from === "bank" || b.from === "bank") {
		if (!isInBankRange(player.x, player.y)) {
			player.bankOpen = false;
			return;
		}
	}

	if (!canPlaceInto(player, b, slotA)) return;
	if (!canPlaceInto(player, a, slotB)) return;

	setSlot(player, b, slotA);
	setSlot(player, a, slotB);
	recomputePlayerStats(player);
}

function getSlot(player: any, ref: any) {
	if (ref.from === "equipment") return player.equipment[ref.slotKey] ?? null;
	return player[ref.from].slots[ref.slotIndex] ?? null;
}

function setSlot(player: any, ref: any, value: any) {
	if (ref.from === "equipment") {
		player.equipment[ref.slotKey] = value ?? null;
		return;
	}
	player[ref.from].slots[ref.slotIndex] = value ?? null;
}

function canPlaceInto(player: any, destRef: any, item: any): boolean {
	if (destRef.from !== "equipment") return true;

	if (!item) return true;

	if (item.kind !== "equip") return false;

	const def = getItemDef(item.itemId);
	if (def.type !== "equip") return false;

	return def.typeProps.subType === destRef.slotKey;
}
