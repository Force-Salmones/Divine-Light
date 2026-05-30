import { serverGameState } from "@/server/state/gameState";
import type { WsHandlerContext } from "./types";
import { calcDistance } from "../../../shared/util/calcDistance.js";
import { PICKUP_RANGE } from "@/constants";
import { addToInventory } from "@/server/services/items/addToInventory";
import { getItemDef } from "@/server/services/items/itemRegistry";
import { getPlayerFromId } from "@/server/util/getPlayerFromId.js";

export function handlePickupItem(ctx: WsHandlerContext, msg: any) {
	const groundItemId = msg.groundItemId;
	if (!groundItemId) return;
	const foundItem = serverGameState.groundItems.get(groundItemId);
	if (!foundItem) return;
	const foundPlayer = getPlayerFromId(ctx.playerId);
	if (!foundPlayer) return;

	if (
		calcDistance(foundItem.x, foundItem.y, foundPlayer.x, foundPlayer.y) >
		PICKUP_RANGE
	)
		return;

	const itemDef = getItemDef(Number(foundItem.itemId));
	const res = addToInventory(
		foundPlayer.inventory,
		Number(foundItem.itemId),
		foundItem.quantity,
		itemDef.stackSize,
	);

	if (res.remaining > 0) {
		foundItem.quantity = res.remaining;
	} else {
		serverGameState.groundItems.delete(groundItemId);
	}
}
