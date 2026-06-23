import type { Bank, Equipment, Inventory } from "../items/inventory.js";
import type { ItemId } from "../items/itemTypes.js";
import type { Hotbar } from "../skills/hotbarSchema.js";
import type { SkillId } from "../skills/skillTypes.js";
import type {
	ActiveEffect,
	BaseStats,
	ModifierBreakdown,
	BaseTertiaryStats,
} from "./modifiers.js";

export type StatKey = "STR" | "VIT" | "DEX" | "LUK" | "INT" | "WIS";
export const statKeys = ["STR", "VIT", "DEX", "LUK", "INT", "WIS"] as const;

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
	activeEffects: ActiveEffect[];
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
	attackSpeed: number;
	attackRange: number;
	critChance: number;
	critDamage: number;
	goldPlus: number;
	experiencePlus: number;
	baseStats: BaseStats;
	baseTertiaryStats: BaseTertiaryStats;
	modBreakdown: ModifierBreakdown;
	lastAttackTime: number;
	targetX?: number;
	targetY?: number;
	inventory: Inventory;
	bank: Bank;
	equipment: Equipment;
	skillBook: Record<SkillId, number>;
	skillPoints: number;
	hotbar: Hotbar;
	bankOpen: boolean;
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
	activeEffects: ActiveEffect[];
};

export type GroundItemBase = {
	id: string;
	itemId: ItemId;
	x: number;
	y: number;
	spawnedAt: number;
};

export type GroundItemStack = GroundItemBase & {
	kind: "stack";
	quantity: number;
};

export type GroundItemEquip = GroundItemBase & {
	kind: "equip";
	instanceId: string;
	meta: Record<string, unknown>;
};

export type GroundItem = GroundItemStack | GroundItemEquip;

export type Npc = {
	id: number;
	name: string;
	x: number;
	y: number;
	functionId: string;
	size: number;
};

export type GameStateSnapshot = {
	players: Record<string, PlayerPublic>;
	enemies: EnemyPublic[];
	npcs: Npc[];
	groundItems: GroundItem[];
	selfId: string;
	player: PlayerPublic & PlayerPrivate;
	selectedEnemyId: number | null;
	lastAttackEvents: AttackEvent[];

	//temporary for compatibility
	lastAttackEvent?: AttackEvent;
	lastIncomingHit?: IncomingHit;
};
