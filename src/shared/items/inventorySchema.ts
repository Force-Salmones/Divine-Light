import z from "zod";

export const SlotSchema = z.union([
	z.null(),
	z.object({
		kind: z.literal("stack"),
		itemId: z.number().int().nonnegative(),
		quantity: z.number().int().positive(),
	}),
	z.object({
		kind: z.literal("equip"),
		instanceId: z.string().min(1),
		itemId: z.number().int().nonnegative(),
		meta: z.record(z.string(), z.unknown()),
	}),
]);

export const InventorySchema = z.object({
	slots: z.array(SlotSchema).length(25),
});

export const BankSchema = z.object({
	slots: z.array(SlotSchema).length(98),
});

export const EquipmentSchema = z.object({
	weapon: SlotSchema,
	charm: SlotSchema,
});
