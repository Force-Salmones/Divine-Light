import type { ItemId } from "./itemTypes.js";

export type InventorySlot = null | { itemId: ItemId; quantity: number };

export type Inventory = {
	slots: InventorySlot[]; //25
};
