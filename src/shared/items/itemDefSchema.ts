import { z } from "zod";

const ItemTypeSchema = z.enum(["etc", "use"]);

const ItemBaseDefSchema = z.object({
	id: z.number().int().min(0),
	name: z.string().min(1),
	type: ItemTypeSchema,
	stackSize: z.number().int().min(1),
	flavor: z.string().optional(),
});

const ItemEtcDefSchema = ItemBaseDefSchema.extend({
	type: z.literal("etc"),
	typeProps: z.record(z.string(), z.never()).default({}),
});

const ItemUseDefSchema = ItemBaseDefSchema.extend({
	type: z.literal("use"),
	typeProps: z.object({
		effectId: z.string().min(1),
	}),
});

export const ItemDefSchema = z.discriminatedUnion("type", [
	ItemEtcDefSchema,
	ItemUseDefSchema,
]);

export const ItemDefsFileSchema = z
	.record(z.string(), ItemDefSchema)
	.superRefine((defs, ctx) => {
		for (const [key, def] of Object.entries(defs)) {
			const n = Number(key);
			if (!Number.isInteger(n) || n < 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Invalid item key ${key} must be int >= 0`,
					path: [key, "id"],
				});
				continue;
			}
			if (def.id !== n) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Item key "${key}" does not match def.id (${def.id})`,
					path: [key, "id"],
				});
			}
		}
	});
