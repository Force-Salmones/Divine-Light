import type { AppContext } from "../appContext";

export function registerCanvasDropHandler(app: AppContext) {
	app.canvas.addEventListener("dragover", (e) => {
		e.preventDefault();
	});

	app.canvas.addEventListener("drop", (e) => {
		e.preventDefault();

		const raw = e.dataTransfer?.getData("text/plain") ?? "";
		const slotIndex = Number(raw);

		if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex > 24) {
			console.warn(
				`Invalid slot index in app.canvas drop listener: ${slotIndex}`,
			);
			return;
		}
		app.ws.send({ type: "dropItem", slotIndex });
	});
}
