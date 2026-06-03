import type { ItemId } from "./itemTypes";

type StackItem = { kind: "stack"; itemId: ItemId; quantity: number };

type EquipItemInstance = {
	kind: "equip";
	instanceId: string;
	itemId: ItemId;
	meta: Record<string, unknown>;
};

export type SlotItem = StackItem | EquipItemInstance;
export type Slot = SlotItem | null;
