import type { ItemId } from "../../../shared/items/itemTypes.js";
import type { Inventory } from "../../../shared/items/inventory.js";

export type AddToInventoryResult = {
	added: number;
	remaining: number;
	touchedSlots: number[];
};

export function addToInventory(
	inv: Inventory,
	itemId: ItemId,
	quantity: number,
	stackSize: number,
): AddToInventoryResult {
	if (!Number.isInteger(quantity) || quantity <= 0) {
		throw new Error(
			`addToInventory: quantity must be int > 0 (got ${quantity})`,
		);
	}
	if (!Number.isInteger(stackSize) || stackSize <= 0) {
		throw new Error(
			`addToInventory: stackSize must be int > 0 (got ${stackSize})`,
		);
	}
	if (!Array.isArray(inv.slots)) {
		throw new Error("addToInventory: inv.slots missing");
	}

	let remaining = quantity;
	const touched = new Set<number>();

	// Fill existing stacks if possible
	if (stackSize > 1) {
		for (let i = 0; i < inv.slots.length && remaining > 0; i++) {
			const slot = inv.slots[i];
			if (!slot) continue;
			if (slot.itemId !== itemId) continue;

			const canAdd = stackSize - slot.quantity;
			if (canAdd <= 0) continue;

			const toAdd = Math.min(canAdd, remaining);
			slot.quantity += toAdd;
			remaining -= toAdd;
			touched.add(i);
		}
	}

	// Fill new slots
	for (let i = 0; i < inv.slots.length && remaining > 0; i++) {
		const slot = inv.slots[i];
		if (slot !== null) continue;

		const toAdd = Math.min(stackSize, remaining);
		inv.slots[i] = { itemId, quantity: toAdd };
		remaining -= toAdd;
		touched.add(i);
	}

	return {
		added: quantity - remaining,
		remaining,
		touchedSlots: [...touched.values()].sort((a, b) => a - b),
	};
}
