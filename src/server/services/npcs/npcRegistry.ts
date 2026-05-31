import { readFile } from "node:fs/promises";
import type { Npc } from "@/shared/protocol/gamestate";

let npcRegistry: Map<number, Npc> | null = null;

export async function loadNpcRegistry(): Promise<void> {
	if (npcRegistry) return;

	const raw: Npc[] = JSON.parse(
		await readFile(
			new URL("../../../db/data/npcs.json", import.meta.url),
			"utf8",
		),
	);

	const map: Map<number, Npc> = new Map();

	for (const npc of Object.values(raw)) {
		map.set(npc.id, npc);
	}

	npcRegistry = map;
}

export function populateBankerList() {
	if (!npcRegistry) {
		throw new Error("Npc registry not loaded");
	}
	const bankers = [];
	for (const npc of npcRegistry.values()) {
		if (npc.functionId === "openBank") {
			bankers.push({ x: npc.x, y: npc.y });
		}
	}
	return bankers;
}

export function getNpcDef(id: number): Npc | undefined {
	if (!npcRegistry) {
		throw new Error("Npc registry not loaded");
	}
	if (!npcRegistry.get(id)) return;

	return npcRegistry.get(id);
}

export function getNpcReg() {
	if (!npcRegistry) throw new Error("Npc registry not loaded");
	return npcRegistry;
}
