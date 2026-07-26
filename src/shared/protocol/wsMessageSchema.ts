import { z } from "zod";

const SlotRefSchema = z.union([
	z.object({
		from: z.literal("inventory"),
		slotIndex: z.number().int().min(0).max(24),
	}),
	z.object({
		from: z.literal("bank"),
		slotIndex: z.number().int().min(0).max(97),
	}),
	z.object({
		from: z.literal("equipment"),
		slotKey: z.enum(["weapon", "charm"]),
	}),
]);

const ActivateSourceSchema = z.union([
	z.object({ kind: z.literal("itemId"), itemId: z.number().int().min(0) }),
	z.object({ kind: z.literal("inventorySlot"), slot: SlotRefSchema }),
	z.object({ kind: z.literal("skillId"), skillId: z.number().int().min(0) }),
	z.object({
		kind: z.literal("hotbar"),
		index: z.number().int().min(0).max(8),
	}),
]);

const ActivateTargetSchema = z.union([
	z.object({ kind: z.literal("self") }),
	z.object({ kind: z.literal("player"), playerId: z.string().min(1) }),
	z.object({ kind: z.literal("enemy"), enemyId: z.number().int().min(0) }),
	z.object({ kind: z.literal("position"), x: z.number(), y: z.number() }),
]);

export const ChatMessageSchema = z.object({
	type: z.literal("chat"),
	text: z.string().min(1),
});

export const MovePositionSchema = z.object({
	type: z.literal("move"),
	x: z.number(),
	y: z.number(),
});

export const MoveEnemySchema = z.object({
	type: z.literal("move"),
	enemyId: z.number().int().min(0),
});

export const AttackSchema = z.object({
	type: z.literal("attack"),
	enemyId: z.number().int().min(0),
});

export const StopAttackSchema = z.object({
	type: z.literal("stopAttack"),
});

export const BonkPlayerSchema = z.object({
	type: z.literal("bonkPlayer"),
	targetPlayerId: z.string().min(1),
});

export const SpendStatSchema = z.object({
	type: z.literal("spendStat"),
	stat: z.enum(["STR", "VIT", "DEX", "LUK", "INT", "WIS"]),
});

export const LevelUpSkillSchema = z.object({
	type: z.literal("levelUpSkill"),
	id: z.number().int().min(0),
});

export const PickupItemSchema = z.object({
	type: z.literal("pickupItem"),
	groundItemId: z.string().optional(),
});

export const DropItemSchema = z.object({
	type: z.literal("dropItem"),
	slot: SlotRefSchema,
});

export const SwapItemSchema = z.object({
	type: z.literal("swapItem"),
	a: SlotRefSchema,
	b: SlotRefSchema,
});

export const OpenBankSchema = z.object({
	type: z.literal("openBank"),
});

export const CloseBankSchema = z.object({
	type: z.literal("closeBank"),
});

export const ActivateSchema = z.object({
	type: z.literal("activate"),
	source: ActivateSourceSchema,
	target: ActivateTargetSchema.optional(),
});

export const BindHotbarSchema = z.object({
	type: z.literal("bindHotbar"),
	toIndex: z.number().int().min(0).max(8),
	source: z.union([
		z.object({
			kind: z.literal("inventory"),
			slotIndex: z.number().int().min(0).max(24),
		}),
		z.object({
			kind: z.literal("skillBook"),
			skillId: z.number().int().min(0),
		}),
	]),
});

export const ClearHotbarSchema = z.object({
	type: z.literal("clearHotbar"),
	index: z.number().int().min(0).max(8),
});

export const ClientToServerMessageSchema = z.union([
	ChatMessageSchema,
	MovePositionSchema,
	MoveEnemySchema,
	AttackSchema,
	StopAttackSchema,
	BonkPlayerSchema,
	SpendStatSchema,
	LevelUpSkillSchema,
	PickupItemSchema,
	DropItemSchema,
	SwapItemSchema,
	OpenBankSchema,
	CloseBankSchema,
	ActivateSchema,
	BindHotbarSchema,
	ClearHotbarSchema,
]);

export const ServerToClientMessageSchema = z.discriminatedUnion("type", [
	z.object({ type: z.literal("gameState"), gameState: z.any() }),
	z.object({
		type: z.literal("chat"),
		text: z.string().min(1),
		from: z.string().optional(),
		system: z.boolean().optional(),
		timestamp: z.number(),
	}),
	z.object({
		type: z.literal("bonk"),
		fromId: z.string(),
		toId: z.string(),
		x: z.number(),
		y: z.number(),
		timestamp: z.number(),
	}),
]);
