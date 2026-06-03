import { randomUUID } from "node:crypto";
import { serverGameState } from "@/server/state/gameState";
import { randomInt } from "node:crypto";
import type { SlotItem } from "@/shared/items/itemInstance";

export function createGroundItem(
	item: SlotItem,
	x: number,
	y: number,
	jitterSize = 32,
) {
	const { dropX, dropY } = jitter(x, y, jitterSize);
	const id = randomUUID();
	const base = { id, x: dropX, y: dropY, spawnedAt: Date.now() };

	if (item.kind === "stack") {
		serverGameState.groundItems.set(id, {
			...base,
			kind: "stack",
			itemId: item.itemId,
			quantity: item.quantity,
		});
		return;
	}

	serverGameState.groundItems.set(id, {
		...base,
		kind: "equip",
		itemId: item.itemId,
		instanceId: item.instanceId,
		meta: item.meta,
	});
}

function jitter(x: number, y: number, enemySize: number) {
	const intX = Math.floor(x);
	const intY = Math.floor(y);
	const sizeMod = enemySize + 10;
	const dropX = randomInt(intX - sizeMod, intX + sizeMod + 1);
	const dropY = randomInt(intY - sizeMod, intY + sizeMod + 1);

	return { dropX, dropY };
}
