export type DragPayload =
	| { type: "slotItem"; from: "inventory" | "bank"; slotIndex: number }
	| { type: "slotItem"; from: "equipment"; slotKey: "weapon" | "charm" };
