import { createSlotEl } from "./createSlotEl.js";

export type Hotbar = {
	container: HTMLDivElement;
	//update: () => void;
	//onActivate: (slotIdx: number) => void;
};

export function createHotbar(): Hotbar {
	const container = document.createElement("div");
	container.style.position = "fixed";
	container.style.bottom = "10px";
	container.style.display = "flex";
	container.style.gap = "4px";
	container.style.background = "rgba(0, 0, 0, 0.6)";
	container.style.border = "1px solid rgba(255, 255, 255, 0.25)";
	container.style.borderRadius = "4px";
	container.style.padding = "4px";
	container.style.boxSizing = "border-box";

	const slots = [];
	for (let i = 0; i < 9; i++) {
		const { slot, img, badge } = createSlotEl(i);
		badge.textContent = String(i + 1);
		badge.style.display = "block";
		container.appendChild(slot);
		slots.push({ slot, img, badge });
	}

	document.body.appendChild(container);

	return { container };
}
