import { z } from "zod";

const DropDefSchema = z.object({
	rate: z.number().min(0).max(1),
	amount: z
		.tuple([z.number().int().min(1), z.number().int().min(1)])
		.refine(([min, max]) => min <= max, {
			message: "amount min must be <= max",
		}),
});

const DropsSchema = z
	.record(z.string(), DropDefSchema)
	.superRefine((drops, ctx) => {
		for (const key of Object.keys(drops)) {
			const n = Number(key);
			if (!Number.isInteger(n) || n < 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Invalid drop itemId key "${key}" (must be int >= 0)`,
					path: [key],
				});
			}
		}
	});

export const MobDefSchema = z.object({
	id: z.number().int().min(0),
	name: z.string().min(1),
	level: z.number().int().min(1),
	experience: z.number().int().min(0),
	gold: z.number().int().min(0),
	health: z.number().int().min(1),
	damage: z.number().int().min(0),
	damageType: z.enum(["physical", "magical", "true"]),
	attackSpeed: z.number().positive(),
	attackRange: z.number().nonnegative(),
	defense: z.number().int().nonnegative(),
	resistance: z.number().int().nonnegative(),
	speed: z.number().nonnegative(),
	respawnTime: z.number().int().nonnegative(),
	aggressive: z.boolean(),
	retreats: z.boolean(),
	drops: DropsSchema,
	size: z.number().int().positive(),
});

export const MobDefsFileSchema = z
	.record(z.string(), MobDefSchema)
	.superRefine((defs, ctx) => {
		for (const [key, def] of Object.entries(defs)) {
			const n = Number(key);
			if (!Number.isInteger(n) || n < 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Invalid mob key "${key}" (must be int >= 0)`,
					path: [key],
				});
				continue;
			}
			if (def.id !== n) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Mob key "${key}" does not match def.id (${def.id})`,
					path: [key, "id"],
				});
			}
		}
	});
