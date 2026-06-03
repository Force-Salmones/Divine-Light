import { gainExperience } from "../progression/gainExperience";
import type { Player, Enemy } from "@/server/state/gameState";
import { getRandomBetween } from "@/shared/util/random";
import { randomInt, randomUUID } from "node:crypto";
import { createGroundItem } from "../items/createGroundItem";
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

		if (def.type === "equip") {
			for (let i = 0; i < qty; i++) {
				createGroundItem(
					{
						kind: "equip",
						itemId,
						instanceId: randomUUID(),
						meta: {},
					},
					enemy.x,
					enemy.y,
					enemy.size,
				);
			}
		} else {
			createGroundItem(
				{ kind: "stack", itemId, quantity: qty },
				enemy.x,
				enemy.y,
				enemy.size,
			);
		}
	}
}
