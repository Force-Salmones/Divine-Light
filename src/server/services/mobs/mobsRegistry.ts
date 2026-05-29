import { MobDefsFileSchema } from "@/shared/mobs/mobSchema";
import type { MobId, MobDef } from "@/shared/mobs/mobTypes";
import { readFile } from "node:fs/promises";

let mobRegistry: Map<MobId, MobDef> | null = null;

export async function loadMobRegistry(): Promise<void> {
	if (mobRegistry) return;

	const raw = await readFile(
		new URL("../../../db/data/mobs.json", import.meta.url),
		"utf8",
	);

	const parsed = MobDefsFileSchema.parse(JSON.parse(raw));

	const map = new Map<MobId, MobDef>();
	for (const def of Object.values(parsed)) {
		map.set(def.id, def);
	}

	mobRegistry = map;
}

export function getMobDef(mobId: MobId) {
	if (!mobRegistry) throw new Error("Mob registry not loaded");
	const def = mobRegistry.get(mobId);
	if (!def) throw new Error(`Unknown mob id: ${mobId}`);
	return def;
}
