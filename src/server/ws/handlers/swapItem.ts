import { getPlayerFromId } from "@/server/util/getPlayerFromId";
import { validateSlotRef } from "@/shared/protocol/helpers/validateSlotRef";
import type { WsHandlerContext } from "./types";

export function handleSwapItem(ctx: WsHandlerContext, msg: any) {
	const player = getPlayerFromId(ctx.playerId);
	if (!player) return;

	const a = validateSlotRef(msg.a, player.bankOpen);
	if (!a) return;
	const b = validateSlotRef(msg.b, player.bankOpen);
	if (!b) return;

	const slotA = player[a.from].slots[a.slotIndex];
	const slotB = player[b.from].slots[b.slotIndex];
	const temp = slotB;
	player[b.from].slots[b.slotIndex] = slotA ?? null;
	player[a.from].slots[a.slotIndex] = temp ?? null;
}
