import z from "zod";
import { readFile } from "node:fs/promises";
import type { EquipmentSlotKey } from "@/shared/items/inventory";

const ChanceSchema = z.enum(["high", "medium", "low", "verylow"]);

const StatRollDefSchema = z.object({
	base: z.number(),
	perLevel: z.number(),
	chance: ChanceSchema,
});

const StatRollsFileSchema = z.object({
	weapon: z.record(z.string(), StatRollDefSchema),
	charm: z.record(z.string(), StatRollDefSchema),
});

export type StatRollChance = z.infer<typeof ChanceSchema>;
export type StatRollDef = z.infer<typeof StatRollDefSchema>;
export type StatRollTable = Record<string, StatRollDef>;
export type StatRollsFile = z.infer<typeof StatRollsFileSchema>;

let statRolls: StatRollsFile | null = null;

export async function loadStatRollsRegistry(): Promise<void> {
	if (statRolls) return;

	const raw = await readFile(
		new URL("../../../db/data/statRolls.json", import.meta.url),
		"utf-8",
	);

	statRolls = StatRollsFileSchema.parse(JSON.parse(raw));
}

export function getStatRollsForSubType(
	subType: EquipmentSlotKey,
): StatRollTable {
	if (!statRolls) throw new Error("Stat rolls registry not loaded");

	const table = statRolls[subType];

	if (!table) throw new Error(`Unknown statRolls subType: ${subType}`);
	return table;
}
