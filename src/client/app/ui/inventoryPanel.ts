import type { GameStateSnapshot } from "../../../shared/protocol/gamestate.js";

export type InventoryPanelUI = {
	button: HTMLButtonElement;
	container: HTMLDivElement;
	update: (snapshot: GameStateSnapshot | null) => void;
};

export function createInventoryPanelUI(): InventoryPanelUI {
	const button = document.createElement("button");
	button.textContent = "Inventory";
	button.style.position = "fixed";
	button.style.right = "440px";
	button.style.bottom = "20px";
	button.style.padding = "4px 8px";
	button.style.fontSize = "12px";
	button.style.fontFamily = "sans-serif";
	button.style.cursor = "pointer";
	button.style.background = "rgba(0,0,0,0.8)";
	button.style.color = "#ffffff";
	button.style.border = "1px solid rgba(255,255,255, 0.5)";
	button.style.borderRadius = "3px";

	const container = document.createElement("div");
	container.style.position = "fixed";
	container.style.right = "560px";
	container.style.bottom = "120px";
	container.style.width = "260px";
	container.style.maxHeight = "360px";
	container.style.overflowY = "auto";
	container.style.background = "rgba(0, 0, 0, 0.85)";
	container.style.border = "1px solid rgba(255, 255, 255, 0.5)";
	container.style.borderRadius = "4px";
	container.style.padding = "8px";
	container.style.boxSizing = "border-box";
	container.style.fontFamily = "sans-serif";
	container.style.fontSize = "12px";
	container.style.color = "#ffffff";
	container.style.display = "none";

	document.body.appendChild(button);
	document.body.appendChild(container);

	button.addEventListener("click", () => {
		const visible = container.style.display !== "none";
		container.style.display = visible ? "none" : "block";
	});

	function update(snapshot: GameStateSnapshot | null) {
		container.innerHTML = "";

		const header = document.createElement("div");
		header.textContent = "Inventory";
		header.style.fontSize = "14px";
		header.style.fontWeight = "bold";
		header.style.marginBottom = "6px";

		container.appendChild(header);

		const goldRow = document.createElement("div");
		goldRow.style.marginBottom = "8px";
		const gold = snapshot?.player?.gold ?? 0;
		goldRow.textContent = `Gold: ${gold}`;
		container.appendChild(goldRow);

		const invGrid = document.createElement("div");
		invGrid.style.display = "grid";
		invGrid.style.gridTemplateColumns = "repeat(5, 1fr)";
		invGrid.style.gap = "6px";

		for (let i = 0; i < 25; i++) {
			const slot = document.createElement("div");
			slot.style.height = "36px";
			slot.style.border = "1px solid rgba(255,255,255,0.35)";
			slot.style.background = "rgba(255,255,255,0.06)";
			slot.style.borderRadius = "3px";

			invGrid.appendChild(slot);
		}

		container.appendChild(invGrid);
	}
	return { button, container, update };
}

export function isInventoryPanelVisible(inv: InventoryPanelUI): boolean {
	return inv.container.style.display !== "none";
}
