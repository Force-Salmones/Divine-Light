import type { Inventory } from "../../../shared/items/inventory.js";
import type { SlotItem } from "@/shared/items/itemInstance.js";

export type AddToInventoryResult = {
	added: number;
	remaining: number;
	touchedSlots: number[];
};

export function addToInventory(
	inv: Inventory,
	item: SlotItem,
	stackSize?: number,
): AddToInventoryResult {
	if (!Array.isArray(inv.slots)) {
		throw new Error("addToInventory: inv.slots missing");
	}

	// Equip instances
	if (item.kind === "equip") {
		const i = inv.slots.findIndex((s) => s === null);
		if (i === -1) return { added: 0, remaining: 1, touchedSlots: [] };
		inv.slots[i] = item;
		return { added: 1, remaining: 0, touchedSlots: [i] };
	}

	// Stack items
	const quantity = item.quantity;

	if (!Number.isInteger(quantity) || quantity <= 0) {
		throw new Error(
			`addToInventory: quantity must be int > 0 (got ${quantity})`,
		);
	}
	if (!Number.isInteger(stackSize) || (stackSize as number) <= 0) {
		throw new Error(
			`addToInventory: stackSize must be int > 0 (got ${stackSize})`,
		);
	}

	let remaining = quantity;
	const touched = new Set<number>();

	// Fill existing stacks if possible
	if ((stackSize as number) > 1) {
		for (let i = 0; i < inv.slots.length && remaining > 0; i++) {
			const slot = inv.slots[i];
			if (!slot || slot.kind !== "stack") continue;
			if (slot.itemId !== item.itemId) continue;

			const canAdd = (stackSize as number) - slot.quantity;
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

		const toAdd = Math.min(stackSize as number, remaining);
		inv.slots[i] = { kind: "stack", itemId: item.itemId, quantity: toAdd };
		remaining -= toAdd;
		touched.add(i);
	}

	return {
		added: quantity - remaining,
		remaining,
		touchedSlots: [...touched.values()].sort((a, b) => a - b),
	};
}
