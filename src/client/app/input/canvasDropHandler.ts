import type { AppContext } from "../appContext";
import type { DragPayload } from "./dragPayload.js";

export function registerCanvasDropHandler(app: AppContext) {
	app.canvas.addEventListener("dragover", (e) => {
		e.preventDefault();
	});

	app.canvas.addEventListener("drop", (e) => {
		e.preventDefault();

		const raw = e.dataTransfer?.getData("application/x-slot-index") ?? "";
		let payload: DragPayload | null = null;

		try {
			payload = JSON.parse(raw) as DragPayload;
		} catch {}

		if (
			!payload ||
			payload.type !== "slotItem" ||
			(payload.from !== "inventory" && payload.from !== "bank") ||
			!Number.isInteger(payload.slotIndex)
		) {
			console.warn("Invalid drag payload in canvas drop:", raw);
			return;
		}

		app.ws.send({
			type: "dropItem",
			slot: { from: payload.from, slotIndex: payload.slotIndex },
		});
	});
}
