import type { SlotRef } from "@/shared/protocol/ws";

export function validateSlotRef(
	ref: unknown,
	bankOpen: boolean,
): SlotRef | undefined {
	if (!ref || typeof ref !== "object") return;

	const from = (ref as any).from;
	const slotIndex = (ref as any).slotIndex;

	if (from !== "inventory" && from !== "bank") return;
	if (!Number.isInteger(slotIndex)) return;

	if (from === "bank" && !bankOpen) return;

	const size = from === "inventory" ? 25 : 98;
	if (slotIndex < 0 || slotIndex >= size) return;

	return { from, slotIndex };
}
