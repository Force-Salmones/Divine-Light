import type { EquipmentSlotKey } from "@/shared/items/inventory";
import type { StatBlock, StatId } from "@/shared/protocol/modifiers";
import {
	getStatRollsForSubType,
	type StatRollChance,
} from "./statRollsRegistry";

function getRandomStatBlockCount(counter = 0, probability = 0.5): number {
	while (true) {
		if (Math.random() < probability) {
			counter++;
			probability *= 0.7;
			continue;
		}
		break;
	}
	return counter;
}

export function generateEquipStatMods(
	subType: EquipmentSlotKey,
	itemLevel: number,
	baseMods: StatBlock,
): StatBlock {
	const newBlockCount = getRandomStatBlockCount();
	const newStats: StatBlock = { ...baseMods };
	if (newBlockCount) {
		const table = getStatRollsForSubType(subType);
		const pools: Record<StatRollChance, StatId[]> = {
			high: [],
			medium: [],
			low: [],
			verylow: [],
		};
		for (const key in table) {
			const stat = key as StatId;
			if (!table[stat]?.chance) continue;
			const chance: StatRollChance = table[stat].chance;
			pools[chance].push(stat);
		}

		for (let i = 0; i < newBlockCount; i++) {
			const chosenPool: StatRollChance = choosePool();

			const randomIndex = Math.floor(
				Math.random() * pools[chosenPool].length,
			);

			const newStatType = pools[chosenPool][randomIndex];
			if (!newStatType || !table[newStatType]) {
				i--;
				continue;
			}

			const newStatAmount = mutateValue(
				table[newStatType].base +
					table[newStatType].perLevel * itemLevel,
			);

			newStats[newStatType] =
				(newStats[newStatType] ?? 0) + Math.round(newStatAmount);
		}
	}
	return newStats;
}

function choosePool(): StatRollChance {
	const roll = Math.random();
	if (roll < 0.6) return "high";
	else if (roll < 0.85) return "medium";
	else if (roll < 0.99) return "low";
	else return "verylow";
}

function mutateValue(value: number): number {
	const dir = Math.random() < 0.5 ? 1 : -1;
	let out = value;

	let safety = 0;
	do {
		const pct = Math.random() * 0.1;
		out = out * (1 + dir * pct);

		if (++safety > 100) break;
	} while (Math.random() < 0.25);

	return out;
}
