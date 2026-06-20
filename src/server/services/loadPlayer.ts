import { getUserById } from "@/db/queries/users";
import type { User } from "@/db/schema";
import type { Player } from "../state/gameState";
import { expToLevelUp } from "./progression/gainExperience";
import { validateInventory } from "./items/validateInventory";
import { validateBank } from "./items/validateBank";
import { validateEquipment } from "./items/validateEquipment";
import { recomputePlayerStats } from "./modifiers/recomputePlayerStats";

export async function loadPlayer(
	playerId: string,
): Promise<Player | undefined> {
	const dbUser: User | undefined = await getUserById(playerId);
	if (!dbUser) {
		throw new Error("Player not found");
	}

	const baseStats = {
		STR: dbUser.baseSTR,
		VIT: dbUser.baseVIT,
		DEX: dbUser.baseDEX,
		LUK: dbUser.baseLUK,
		INT: dbUser.baseINT,
		WIS: dbUser.baseWIS,
	};

	const baseTertiaryStats = {
		speed: 100,
		attackRange: 50,
		attackSpeed: 1,
		critChance: 0,
		critDamage: 50,
		goldPlus: 0,
		experiencePlus: 0,
	};

	const maxHealth = calcHealth(dbUser);
	const maxMana = calcMana(dbUser);

	const player: Player = {
		id: dbUser.id,
		name: dbUser.name,
		level: dbUser.level,
		experience: dbUser.experience,
		expToNextLevel: expToLevelUp(dbUser.level),
		gold: dbUser.gold,
		STR: dbUser.baseSTR,
		VIT: dbUser.baseVIT,
		DEX: dbUser.baseDEX,
		LUK: dbUser.baseLUK,
		INT: dbUser.baseINT,
		WIS: dbUser.baseWIS,
		unallocatedPoints: dbUser.unallocatedPoints,
		maxHealth: calcHealth(dbUser),
		currHealth: Math.max(dbUser.currHealth, maxHealth),
		maxMana: calcMana(dbUser),
		currMana: Math.max(dbUser.currMana, maxMana),
		defense: Math.max(calcDefense(dbUser), 0),
		resistance: Math.max(calcResistance(dbUser), 0),
		speed: baseTertiaryStats.speed,
		attackSpeed: baseTertiaryStats.attackSpeed,
		attackRange: baseTertiaryStats.attackRange,
		critChance: baseTertiaryStats.critChance,
		critDamage: baseTertiaryStats.critDamage,
		goldPlus: baseTertiaryStats.goldPlus,
		experiencePlus: baseTertiaryStats.experiencePlus,
		baseStats: baseStats,
		baseTertiaryStats: baseTertiaryStats,
		x: dbUser.posX,
		y: dbUser.posY,
		sprite: "/assets/player-temp.png",
		lastAttackTime: 0,
		inventory: await validateInventory(dbUser.inventory, dbUser.id),
		bank: await validateBank(dbUser.bank, dbUser.id),
		bankOpen: false,
		equipment: await validateEquipment(dbUser.equipment),
		size: 32,
		activeEffects: [],
		modBreakdown: {
			equipmentPrimary: {},
			equipmentDerived: {},
			skillPrimary: {},
			skillDerived: {},
			usePrimary: {},
			useDerived: {},
		},
		cooldowns: {},
	};
	recomputePlayerStats(player);
	return player;
}
export function calcHealth(user: User): number {
	const level = user.level;
	return (
		Math.floor(level ** 1.7 / 3) +
		level +
		9 +
		user.baseVIT * (5 + Math.floor(level / 5)) +
		user.baseSTR * (3 + Math.floor(level / 10)) +
		user.baseDEX * (1 + Math.floor(level / 20)) +
		user.baseWIS * (1 + Math.floor(level / 15))
	);
}
export function calcMana(user: User): number {
	const level = user.level;
	return (
		Math.floor(level ** 2 / 15) +
		level +
		9 +
		user.baseINT * (5 + Math.floor(level / 5)) +
		user.baseWIS * (3 + Math.floor(level / 10))
	);
}
export function calcDefense(user: User): number {
	const level = user.level;
	return Math.floor(
		(level ** 1.2 / 10 +
			user.baseVIT * (1.5 + Math.floor(level / 30)) +
			user.baseSTR * (1 + Math.floor(level / 40)) +
			user.baseDEX * (1 + Math.floor(level / 50))) *
			0.5 -
			10,
	);
}
export function calcResistance(user: User): number {
	const level = user.level;
	return Math.floor(
		(level ** 1.1 / 10 +
			user.baseWIS * (1.5 + Math.floor(level / 30)) +
			user.baseINT * (1 + Math.floor(level / 40)) +
			user.baseLUK * (1 + Math.floor(level / 50))) *
			0.5 -
			10,
	);
}
