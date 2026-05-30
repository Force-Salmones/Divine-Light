import { gainExperience } from "../progression/gainExperience";
import type { Player, Enemy } from "@/server/state/gameState";
import { getRandomBetween } from "@/shared/util/random";
import { serverGameState } from "@/server/state/gameState";
import { randomUUID, randomInt } from "node:crypto";
import { getItemDef } from "../items/itemRegistry";

export function defeatEnemy(player: Player, enemy: Enemy): void {
	gainExperience(player, enemy.experience);
	player.gold += getRandomBetween(enemy.gold);

	for (const [itemIdStr, drop] of Object.entries(enemy.drops)) {
		const itemId = Number(itemIdStr);
		if (!Number.isInteger(itemId) || itemId < 0) continue;
		if (Math.random() >= drop.rate) continue;

		const qty = randomInt(drop.amount[0], drop.amount[1] + 1);
		if (qty <= 0) continue;

		const def = getItemDef(itemId);
		const { dropX: x, dropY: y } = jitter(enemy.x, enemy.y, enemy.size);

		const id = randomUUID();
		serverGameState.groundItems.set(id, {
			id: id,
			itemId: def.id,
			quantity: qty,
			x,
			y,
			spawnedAt: Date.now(),
		});
	}
}

function jitter(x: number, y: number, enemySize: number) {
	const intX = Math.floor(x);
	const intY = Math.floor(y);
	const sizeMod = enemySize + 10;
	const dropX = randomInt(intX - sizeMod, intX + sizeMod + 1);
	const dropY = randomInt(intY - sizeMod, intY + sizeMod + 1);

	return { dropX, dropY };
}
