import { readFile } from "node:fs/promises";
import type { ItemDef, ItemId } from "../../../shared/items/itemTypes.js";
import { ItemDefsFileSchema } from "../../../shared/items/itemDefSchema.js";

let itemRegistry: Map<ItemId, ItemDef> | null = null;

export async function loadItemRegistry(): Promise<void> {
	if (itemRegistry) return;

	const raw = await readFile(
		new URL("../../../db/data/items.json", import.meta.url),
		"utf-8",
	);

	const parsed = ItemDefsFileSchema.parse(JSON.parse(raw));

	const map = new Map<ItemId, ItemDef>();
	for (const def of Object.values(parsed)) {
		map.set(def.id, def);
	}

	itemRegistry = map;
	return;
}

export function getItemDef(itemId: ItemId): ItemDef {
	if (!itemRegistry) {
		throw new Error("Item registry not loaded");
	}
	const def: ItemDef | undefined = itemRegistry.get(itemId);
	if (!def) {
		throw new Error(`Unknown item id: ${itemId}`);
	}
	return def;
}
