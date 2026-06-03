import type { Slot } from "./itemInstance";

export type Inventory = {
	slots: Slot[]; //25
};

export type Bank = {
	slots: Slot[]; //98
};

export type EquipmentSlotKey = "weapon" | "charm";

export type Equipment = {
	weapon: Slot | null;
	charm: Slot | null;
};
