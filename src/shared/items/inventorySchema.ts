import z from "zod";

export const InventorySlotSchema = z.union([
	z.null(),
	z.object({
		itemId: z.number().int().nonnegative(),
		quantity: z.number().int().positive(),
	}),
]);

export const InventorySchema = z.object({
	slots: z.array(InventorySlotSchema).length(25),
});
