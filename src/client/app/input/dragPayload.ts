export type DragPayload = {
	type: "slotItem";
	from: "inventory" | "bank";
	slotIndex: number;
};
