import type { Inventory } from "../items/inventory.js";
import type { ItemId } from "../items/itemTypes.js";

export type StatKey = "STR" | "VIT" | "DEX" | "LUK" | "INT" | "WIS";
export const statKeys = ["STR", "VIT", "DEX", "LUK", "INT", "WIS"];

export type AttackEvent = {
	playerId: string;
	enemyId: number;
	damage: number;
	timestamp: number;
	x: number;
	y: number;
	enemyDead: boolean;
};

export type IncomingHit = {
	damage: number;
	timestamp: number;
	x: number;
	y: number;
};

export type LevelUpEvent = {
	level: number;
	timestamp: number;
};

export type PlayerPublic = {
	id: string;
	name: string;
	level: number;
	x: number;
	y: number;
	sprite: string;
	currHealth: number;
	maxHealth: number;
	currMana: number;
	maxMana: number;
	size: number;
};

export type PlayerPrivate = {
	experience: number;
	expToNextLevel: number;
	gold: number;
	STR: number;
	VIT: number;
	DEX: number;
	LUK: number;
	INT: number;
	WIS: number;
	unallocatedPoints: number;
	defense: number;
	resistance: number;
	speed: number;
	attackRange: number;
	attackSpeed: number;
	lastAttackTime: number;
	targetX?: number;
	targetY?: number;
	inventory: Inventory;
	lastAttackEvent?: AttackEvent;
	lastIncomingHit?: IncomingHit;
	lastLevelUp?: LevelUpEvent;
};

export type EnemyPublic = {
	id: number;
	mobId: number;
	name: string;
	level: number;
	currHealth: number;
	maxHealth: number;
	x: number;
	y: number;
	sprite: string;
	size: number;
};

export type GroundItem = {
	id: string;
	itemId: ItemId;
	quantity: number;
	x: number;
	y: number;
};

export type GameStateSnapshot = {
	players: Record<string, PlayerPublic>;
	enemies: EnemyPublic[];
	groundItems: GroundItem[];
	selfId: string;
	player: PlayerPublic & PlayerPrivate;
	selectedEnemyId: number | null;
	lastAttackEvents: AttackEvent[];

	//temporary for compatibility
	lastAttackEvent?: AttackEvent;
	lastIncomingHit?: IncomingHit;
};
