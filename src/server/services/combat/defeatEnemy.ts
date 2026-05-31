import { gainExperience } from "../progression/gainExperience";
import type { Player, Enemy } from "@/server/state/gameState";
import { getRandomBetween } from "@/shared/util/random";
import { randomInt } from "node:crypto";
import { createGroundItem } from "../items/createGroundItem";

export function defeatEnemy(player: Player, enemy: Enemy): void {
	gainExperience(player, enemy.experience);
	player.gold += getRandomBetween(enemy.gold);

	for (const [itemIdStr, drop] of Object.entries(enemy.drops)) {
		const itemId = Number(itemIdStr);
		if (!Number.isInteger(itemId) || itemId < 0) continue;
		if (Math.random() >= drop.rate) continue;

		const qty = randomInt(drop.amount[0], drop.amount[1] + 1);
		if (qty <= 0) continue;

		createGroundItem(itemId, qty, enemy.x, enemy.y, enemy.size);
	}
}
