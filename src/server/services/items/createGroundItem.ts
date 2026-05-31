import { getItemDef } from "./itemRegistry";
import { randomUUID } from "node:crypto";
import { serverGameState } from "@/server/state/gameState";
import { randomInt } from "node:crypto";

export function createGroundItem(
	itemId: number,
	qty: number,
	x: number,
	y: number,
	jitterSize = 32,
) {
	const def = getItemDef(itemId);
	const { dropX, dropY } = jitter(x, y, jitterSize);

	const id = randomUUID();
	serverGameState.groundItems.set(id, {
		id: id,
		itemId: def.id,
		quantity: qty,
		x: dropX,
		y: dropY,
		spawnedAt: Date.now(),
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
