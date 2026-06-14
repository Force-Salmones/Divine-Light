import type { Slot } from "./itemInstance";

export type Inventory = {
	slots: Slot[]; //25
};

export type Bank = {
	slots: Slot[]; //98
};

export type EquipmentSlotKey = "weapon" | "charm";
export const equipmentSlotKeys = ["weapon", "charm"] as const;

export type Equipment = {
	weapon: Slot | null;
	charm: Slot | null;
};
