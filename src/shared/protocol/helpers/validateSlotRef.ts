import type { SlotRef } from "../../../shared/protocol/ws.js";

export function validateSlotRef(
	ref: unknown,
	bankOpen: boolean,
): SlotRef | undefined {
	if (!ref || typeof ref !== "object") return;

	const from = (ref as any).from;

	if (from === "inventory" || from === "bank") {
		const slotIndex = (ref as any).slotIndex;
		if (!Number.isInteger(slotIndex)) return;
		if (from === "bank" && !bankOpen) return;

		const size = from === "inventory" ? 25 : 98;
		if (slotIndex < 0 || slotIndex >= size) return;

		return { from, slotIndex };
	}

	if (from === "equipment") {
		const slotKey = (ref as any).slotKey;
		if (slotKey !== "weapon" && slotKey !== "charm") return;
		return { from, slotKey };
	}

	return;
}
