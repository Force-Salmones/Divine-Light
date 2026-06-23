import { z } from "zod";

export const HotbarSlotSchema = z.union([
	z.null(),
	z.object({
		kind: z.literal("useItem"),
		itemId: z.number().int().nonnegative(),
	}),
	z.object({
		kind: z.literal("skill"),
		skillId: z.number().int().nonnegative(),
	}),
]);

export const HotbarSchema = z.object({
	slots: z.array(HotbarSlotSchema).length(9),
});
export type HotbarSlot = z.infer<typeof HotbarSlotSchema>;
export type Hotbar = z.infer<typeof HotbarSchema>;
