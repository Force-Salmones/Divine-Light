import type { Player, Enemy } from "./gamestate";

export type PhysicalAttackSource = Pick<Player, "STR" | "DEX">;
export type MagicalAttackSource = Pick<Player, "INT" | "WIS">;
export type DefenseTarget = Pick<Player | Enemy, "defense" | "resistance">;

// Base physical attack before defense: shown in stats panel
export function calcBasePhysicalAttack(attacker: PhysicalAttackSource): number {
	return 1 + 2 * attacker.STR + attacker.DEX;
}

// Base magical attack before resistance: shown in stats panel
export function calcBaseMagicalAttack(attacker: MagicalAttackSource): number {
	return 1 + 2 * attacker.INT + attacker.WIS;
}

function applyMitigation(baseDamage: number, mitigation: number): number {
	// Raw mitigated damage after subtracting defense/resistance
	const mitigatedRaw = baseDamage - mitigation;
	// Defense/resistance can only mitigate up to 80% of the base damage
	const minAfterMitigation = baseDamage * 0.2;
	const clamped = Math.max(minAfterMitigation, mitigatedRaw);
	// Never go below 0
	return Math.max(0, clamped);
}

function applyRandomVariance(damage: number): number {
	// Roll in [0.8, 1.2] range
	const roll = 0.8 + Math.random() * 0.4;
	return Math.max(0, Math.floor(damage * roll));
}

// Full physical damage roll from player -> enemy
export function rollPhysicalDamage(attacker: Player, defender: Enemy): number {
	const base = calcBasePhysicalAttack(attacker);
	const afterMitigation = applyMitigation(base, defender.defense);
	return applyRandomVariance(afterMitigation);
}

// Full magical damage roll from player -> enemy
export function rollMagicalDamage(attacker: Player, defender: Enemy): number {
	const base = calcBaseMagicalAttack(attacker);
	const afterMitigation = applyMitigation(base, defender.resistance);
	return applyRandomVariance(afterMitigation);
}

// Enemy -> Player damage, using enemy.damage as base
export function rollEnemyDamage(attacker: Enemy, defender: Player): number {
	const base = attacker.damage;
	const mitigation =
		attacker.damageType === "magical"
			? defender.resistance
			: defender.defense;
	const afterMitigation = applyMitigation(base, mitigation);
	return applyRandomVariance(afterMitigation);
}
