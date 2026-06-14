import type { Player } from "@/server/state/gameState";
import { statKeys } from "@/shared/protocol/gamestate";
import { tertiaryStats, type StatBlock } from "@/shared/protocol/modifiers";
import { recalcPlayerDerivedStats } from "../progression/recalcPlayerStats";
import { equipmentSlotKeys } from "@/shared/items/inventory";

const primaryKeys = statKeys;
const primaryKeySet = new Set<string>(primaryKeys);

function splitPhase(mods: StatBlock): {
	primary: StatBlock;
	derived: StatBlock;
} {
	const primary: StatBlock = {};
	const derived: StatBlock = {};
	for (const [k, v] of Object.entries(mods)) {
		if (typeof v !== "number") continue;
		(primaryKeySet.has(k) ? primary : derived)[k] = v;
	}
	return { primary, derived };
}

function addBlock(into: StatBlock, from: StatBlock): void {
	for (const [k, v] of Object.entries(from)) {
		if (typeof v !== "number") continue;
		into[k] = (into[k] ?? 0) + v;
	}
}

function numericStatBlockFromUnknown(obj: unknown): StatBlock {
	if (!obj || typeof obj !== "object") return {};
	const out: StatBlock = {};
	for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
		if (typeof v === "number") out[k] = v;
	}
	return out;
}

function collectEquipmentMods(player: Player): StatBlock {
	const equipStats: StatBlock = {};

	for (const equipKey of equipmentSlotKeys) {
		const equip = player.equipment[equipKey];
		if (equip && equip.kind === "equip") {
			const statMods = numericStatBlockFromUnknown(equip.meta?.statMods);
			addBlock(equipStats, statMods);
		}
	}
	return equipStats;
}

export function recomputePlayerStats(player: Player, nowMs = Date.now()): void {
	for (const k of primaryKeys) {
		player[k] = player.baseStats[k];
	}

	for (const k of tertiaryStats) {
		player[k] = player.baseTertiaryStats[k];
	}

	const equipMods = collectEquipmentMods(player);
	const equipSplit = splitPhase(equipMods);

	const skillPrimary: StatBlock = {};
	const skillDerived: StatBlock = {};
	const usePrimary: StatBlock = {};
	const useDerived: StatBlock = {};

	for (const eff of player.activeEffects ?? []) {
		if (eff.expiresAtMs <= nowMs) continue;

		const primSplit = splitPhase(eff.primaryMods ?? {});
		//defensive split in case a derived stat sneaks in to primary
		const derivedFromPrimary = primSplit.derived;

		if (eff.source === "skillEffect") {
			addBlock(skillPrimary, primSplit.primary);
			addBlock(skillDerived, derivedFromPrimary);
			addBlock(skillDerived, eff.derivedMods ?? {});
		} else if (eff.source === "useEffect") {
			addBlock(usePrimary, primSplit.primary);
			addBlock(useDerived, derivedFromPrimary);
			addBlock(useDerived, eff.derivedMods ?? {});
		}
	}

	player.modBreakdown = {
		equipmentPrimary: equipSplit.primary,
		equipmentDerived: equipSplit.derived,
		skillPrimary,
		skillDerived,
		usePrimary,
		useDerived,
	};

	const totalPrimary: StatBlock = {};
	addBlock(totalPrimary, equipSplit.primary);
	addBlock(totalPrimary, skillPrimary);
	addBlock(totalPrimary, usePrimary);

	for (const k of primaryKeys) {
		const delta = totalPrimary[k];
		if (typeof delta === "number") player[k] += delta;
	}

	recalcPlayerDerivedStats(player);

	const totalDerived: StatBlock = {};
	addBlock(totalDerived, equipSplit.derived);
	addBlock(totalDerived, skillDerived);
	addBlock(totalDerived, useDerived);

	if (typeof totalDerived.maxHealth === "number")
		player.maxHealth += totalDerived.maxHealth;
	if (typeof totalDerived.maxMana === "number")
		player.maxMana += totalDerived.maxMana;
	if (typeof totalDerived.defense === "number")
		player.defense += totalDerived.defense;
	if (typeof totalDerived.resistance === "number")
		player.resistance += totalDerived.resistance;

	for (const k of tertiaryStats) {
		const delta = totalDerived[k];
		if (typeof delta === "number") player[k] += delta;
	}

	player.maxHealth = Math.max(0, player.maxHealth);
	player.maxMana = Math.max(0, player.maxMana);
	player.currHealth = Math.min(player.currHealth, player.maxHealth);
	player.currMana = Math.min(player.currMana, player.maxMana);
	player.defense = Math.max(0, player.defense);
	player.resistance = Math.max(0, player.resistance);
}
