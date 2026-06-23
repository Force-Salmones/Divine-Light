import { SkillDefsFileSchema } from "@/shared/skills/skillDefSchema";
import type { SkillDef, SkillId } from "@/shared/skills/skillTypes";
import { readFile } from "node:fs/promises";

let skillRegistry: Map<SkillId, SkillDef> | null = null;

export async function loadSkillRegistry(): Promise<void> {
	if (skillRegistry) return;

	const raw = await readFile(
		new URL("../../../../db/data/skills.json", import.meta.url),
		"utf-8",
	);

	const parsed = SkillDefsFileSchema.parse(JSON.parse(raw));

	const map = new Map<SkillId, SkillDef>();
	for (const def of Object.values(parsed)) {
		map.set(def.id, def);
	}

	skillRegistry = map;
	return;
}

export function getSkillDef(skillId: SkillId): SkillDef {
	if (!skillRegistry) {
		throw new Error("Skill registry not loaded");
	}
	const def: SkillDef | undefined = skillRegistry.get(skillId);
	if (!def) {
		throw new Error(`Unknown skill id: ${skillId}`);
	}
	return def;
}
