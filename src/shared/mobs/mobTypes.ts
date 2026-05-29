export type MobId = number;

export type MobDamageType = "physical" | "magical" | "true";

export type MobDropDef = {
	rate: number;
	amount: [number, number];
};

export type MobDropsDef = Record<string, MobDropDef>;

export type MobDef = {
	id: MobId;
	name: string;
	level: number;
	experience: number;
	gold: number;
	health: number;
	damage: number;
	damageType: MobDamageType;
	attackSpeed: number;
	attackRange: number;
	defense: number;
	resistance: number;
	speed: number;
	respawnTime: number;
	aggressive: boolean;
	retreats: boolean;
	drops: MobDropsDef;
	size: number;
};
