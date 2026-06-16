import type { Player } from "@/server/state/gameState";

// Recalculate derived stats (HP, MP, defense, resistance) from a Player's
// current level and primary stats.

export function recalcPlayerDerivedStats(player: Player): void {
	const level = player.level;

	const maxHealth = calcHealth(
		level,
		player.STR,
		player.VIT,
		player.DEX,
		player.WIS,
	);
	const maxMana = calcMana(level, player.INT, player.WIS);
	const defense = calcDefense(level, player.STR, player.VIT, player.DEX);
	const resistance = calcResistance(
		level,
		player.INT,
		player.WIS,
		player.LUK,
	);

	player.maxHealth = maxHealth;

	player.maxMana = maxMana;

	player.defense = Math.max(defense, 0);
	player.resistance = Math.max(resistance, 0);
}
export function calcHealth(
	level: number,
	STR: number,
	VIT: number,
	DEX: number,
	WIS: number,
): number {
	return (
		Math.floor(level ** 1.7 / 3) +
		level +
		9 +
		VIT * (5 + Math.floor(level / 5)) +
		STR * (3 + Math.floor(level / 10)) +
		DEX * (1 + Math.floor(level / 20)) +
		WIS * (1 + Math.floor(level / 15))
	);
}
export function calcMana(level: number, INT: number, WIS: number): number {
	return (
		Math.floor(level ** 2 / 15) +
		level +
		9 +
		INT * (5 + Math.floor(level / 5)) +
		WIS * (3 + Math.floor(level / 10))
	);
}
export function calcDefense(
	level: number,
	STR: number,
	VIT: number,
	DEX: number,
): number {
	return (
		(Math.floor(level ** 1.2 / 10) +
			VIT * (1.5 + Math.floor(level / 30)) +
			STR * (1 + Math.floor(level / 40)) +
			DEX * (1 + Math.floor(level / 50))) *
			0.5 -
		10
	);
}
export function calcResistance(
	level: number,
	INT: number,
	WIS: number,
	LUK: number,
): number {
	return (
		(Math.floor(level ** 1.1 / 10) +
			WIS * (1.5 + Math.floor(level / 30)) +
			INT * (1 + Math.floor(level / 40)) +
			LUK * (1 + Math.floor(level / 50))) *
			0.5 -
		10
	);
}
