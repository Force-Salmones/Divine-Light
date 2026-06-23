import type { EquipmentSlotKey } from "./inventory";

export type ItemId = number;

export type ItemType = "etc" | "use" | "equip";

export type UseEffectId = string;

export type ItemBaseDef = {
	id: ItemId;
	name: string;
	type: ItemType;
	stackSize: number;
	flavor?: string;
};

export type ItemUseDef = ItemBaseDef & {
	type: "use";
	typeProps: {
		effectId: UseEffectId;
	};
};

export type ItemEtcDef = ItemBaseDef & {
	type: "etc";
	typeProps: Record<string, never>;
};

export type ItemEquipDef = ItemBaseDef & {
	type: "equip";
	stackSize: 1;
	typeProps: {
		subType: EquipmentSlotKey;
		statMods?: Record<string, number>;
		requiredLevel?: number;
	};
};

export type ItemDef = ItemUseDef | ItemEtcDef | ItemEquipDef;
