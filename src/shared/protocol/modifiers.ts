export type StatId =
	// Player primary
	| "STR"
	| "VIT"
	| "DEX"
	| "LUK"
	| "INT"
	| "WIS"
	// Player bonuses
	| "goldPlus"
	| "experiencePlus"
	// Player derived, Enemy primary
	| "maxHealth"
	| "maxMana"
	| "defense"
	| "resistance"
	| "speed"
	| "attackSpeed"
	| "attackRange"
	// Player final damage
	| "minDamage"
	| "maxDamage"
	// Enemy final damage
	| "damage";

export const statIds = [
	"STR",
	"VIT",
	"DEX",
	"LUK",
	"INT",
	"WIS",
	"goldPlus",
	"experiencePlus",
	"maxHealth",
	"maxMana",
	"defense",
	"resistance",
	"speed",
	"attackSpeed",
	"minDamage",
	"maxDamage",
];

export type StatBlock = Partial<Record<StatId, number>>;

export type ModifierSource = "equipment" | "skillEffect" | "useEffect";

export type ActiveEffect = {
	id: string;
	source: Exclude<ModifierSource, "equipment">;
	startedAtMs: number;
	expiresAtMs: number;

	primaryMods: StatBlock;

	// Anything calculated from another stat
	derivedMods: StatBlock;
};

export type ModifierBreakdown = {
	equipmentPrimary: StatBlock;
	equipmentDerived: StatBlock;

	skillPrimary: StatBlock;
	skillDerived: StatBlock;

	usePrimary: StatBlock;
	useDerived: StatBlock;
};

export type BaseStats = {
	STR: number;
	VIT: number;
	DEX: number;
	LUK: number;
	INT: number;
	WIS: number;
};

export type BaseTertiaryStats = {
	speed: number;
	attackSpeed: number;
	attackRange: number;
	critChance: number;
	critDamage: number;
	goldPlus: number;
	experiencePlus: number;
};

export const tertiaryStats = [
	"speed",
	"attackSpeed",
	"attackRange",
	"critChance",
	"critDamage",
	"goldPlus",
	"experiencePlus",
] as const;

export type EquipMeta = {
	statMods: StatBlock;
	requiredLevel?: number;
};
