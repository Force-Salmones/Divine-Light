import { z } from "zod";
import { statIds, type StatId } from "../protocol/modifiers";

const SkillTypeSchema = z.enum(["attack", "effect"]);

const SkillBaseDefSchema = z.object({
	id: z.number(),
	name: z.string(),
	type: SkillTypeSchema,
	cost: z.number(),
	cooldown: z.number(),
	flavor: z.string(),
	maxLevel: z.number(),
	perLevel: z.record(z.string(), z.number()),
});

const SkillAttackDefSchema = SkillBaseDefSchema.extend({
	type: z.literal("attack"),
});

const SkillEffectTargetTypeSchema = z.enum([
	"self",
	"players",
	"enemies",
	"any",
]);

const SkillEffectDefSchema = SkillBaseDefSchema.extend({
	type: z.literal("effect"),
	duration: z.number(),
	target: SkillEffectTargetTypeSchema,
	mods: z.record(
		z.string().refine((s): s is StatId => statIds.includes(s as StatId)),
		z.number(),
	),
});

export const SkillDefSchema = z.discriminatedUnion("type", [
	SkillAttackDefSchema,
	SkillEffectDefSchema,
]);

export const SkillDefsFileSchema = z
	.record(z.string(), SkillDefSchema)
	.superRefine((defs, ctx) => {
		for (const [key, def] of Object.entries(defs)) {
			const n = Number(key);
			if (!Number.isInteger(n) || n < 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Invalid skill key ${key} must be int >= 0`,
					path: [key, "id"],
				});
				continue;
			}
			if (def.id !== n) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Skill key "${key}" does not match def.id (${def.id})`,
					path: [key, "id"],
				});
			}
		}
	});
