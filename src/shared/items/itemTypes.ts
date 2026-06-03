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
		//cooldown later
	};
};

export type ItemEtcDef = ItemBaseDef & {
	type: "etc";
	typeProps: Record<string, never>;
};

type EquipSubType = "weapon" | "charm";

export type ItemEquipDef = ItemBaseDef & {
	type: "equip";
	stackSize: 1;
	typeProps: {
		subType: EquipSubType;
	};
};

export type ItemDef = ItemUseDef | ItemEtcDef | ItemEquipDef;
