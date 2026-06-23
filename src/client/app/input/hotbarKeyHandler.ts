import type { AppContext } from "../appContext";

export function registerHotbarKeyHandler(app: AppContext): () => void {
	const handler = (e: KeyboardEvent) => {
		const el = document.activeElement;
		if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
			return;
		const key = e.code;
		if (!/^(Digit|Numpad)\d$/.test(key)) return;
		const index = Number(key.match(/\d+/));

		if (Number.isNaN(index) || index < 1 || index > 9) return;

		e.preventDefault();

		app.ws.send({
			type: "activate",
			source: { kind: "hotbar", index: index - 1 },
		});
	};

	window.addEventListener("keydown", handler);

	return () => window.removeEventListener("keydown", handler);
}
