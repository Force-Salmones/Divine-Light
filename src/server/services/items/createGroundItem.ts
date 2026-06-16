import { randomUUID } from "node:crypto";
import { serverGameState } from "@/server/state/gameState";
import { randomInt } from "node:crypto";
import type { SlotItem } from "@/shared/items/itemInstance";
import { getItemDef } from "./itemRegistry";
import { generateEquipStatMods } from "./generateEquipStats";
import type { StatBlock } from "@/shared/protocol/modifiers";

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

	const def = getItemDef(item.itemId);
	const meta: Record<string, unknown> = { ...(item.meta ?? {}) };

	if (def.type === "equip") {
		const statMods = meta.statMods;
		if (!statMods || typeof statMods !== "object") {
			meta.statMods = def.typeProps.statMods ?? {};
		}
		const lvl =
			typeof meta.requiredLevel === "number"
				? meta.requiredLevel
				: (def.typeProps.requiredLevel ?? 1);
		meta.requiredLevel = lvl;
		if (meta.statsRolled !== true) {
			meta.statMods = generateEquipStatMods(
				def.typeProps.subType,
				lvl,
				meta.statMods as StatBlock,
			);
			meta.statsRolled = true;
			if (!meta.displayName) meta.displayName = def.name;
		}
	}
	serverGameState.groundItems.set(id, {
		...base,
		kind: "equip",
		itemId: item.itemId,
		instanceId: item.instanceId,
		meta,
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
