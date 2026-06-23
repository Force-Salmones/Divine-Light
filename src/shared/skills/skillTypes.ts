import type { StatId } from "../protocol/modifiers";

export type SkillId = number;

export type SkillType = "attack" | "effect";

export type EffectSkillTarget = "self" | "players" | "enemies" | "any";

export type SkillBaseDef = {
	id: number;
	name: string;
	type: SkillType;
	cost: number;
	cooldown: number;
	flavor: string;
	maxLevel: number;
	perLevel: Record<StatId, number>;
};

export type SkillAttackDef = {
	type: "attack";
};

export type SkillEffectId = string;

export type SkillEffectDef = SkillBaseDef & {
	type: "effect";
	duration: number;
	target: EffectSkillTarget;
	mods: Record<StatId, number>;
};

export type SkillDef = SkillAttackDef | SkillEffectDef;
