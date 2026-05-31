import type { GameStateSnapshot } from "../../../shared/protocol/gamestate.js";

export type InventoryPanelUI = {
	button: HTMLButtonElement;
	container: HTMLDivElement;
	slotEls: HTMLDivElement[];
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

	const header = document.createElement("div");
	header.textContent = "Inventory";
	header.style.fontSize = "14px";
	header.style.fontWeight = "bold";
	header.style.marginBottom = "6px";

	container.appendChild(header);

	const goldRow = document.createElement("div");
	goldRow.style.marginBottom = "8px";
	const gold = 0;
	goldRow.textContent = `Gold: ${gold}`;

	container.appendChild(goldRow);

	button.addEventListener("click", () => {
		const visible = container.style.display !== "none";
		container.style.display = visible ? "none" : "block";
	});

	// offscreen drag preview canvas
	const dragPreview = document.createElement("canvas");
	dragPreview.width = 32;
	dragPreview.height = 32;
	dragPreview.style.position = "fixed";
	dragPreview.style.left = "-9999px";
	dragPreview.style.top = "-9999px";
	document.body.appendChild(dragPreview);
	const dragPreviewCtx = dragPreview.getContext("2d");

	function createSlotEl(slotIndex: number) {
		const slot = document.createElement("div");
		slot.dataset.slotIndex = String(slotIndex);
		slot.style.height = "36px";
		slot.style.border = "1px solid rgba(255,255,255,0.35)";
		slot.style.background = "rgba(255,255,255,0.06)";
		slot.style.borderRadius = "3px";
		slot.style.position = "relative";
		slot.style.boxSizing = "border-box";
		slot.draggable = false;

		const img = document.createElement("img");
		img.style.width = "100%";
		img.style.height = "100%";
		img.style.objectFit = "contain";
		img.style.display = "none";
		img.draggable = false;
		slot.appendChild(img);

		const badge = document.createElement("div");
		badge.style.position = "absolute";
		badge.style.right = "2px";
		badge.style.bottom = "2px";
		badge.style.padding = "0 3px";
		badge.style.fontSize = "10px";
		badge.style.lineHeight = "12px";
		badge.style.background = "rgba(0,0,0,0.7)";
		badge.style.border = "1px solid rgba(255,255,255,0.35)";
		badge.style.borderRadius = "2px";
		badge.style.display = "none";
		slot.appendChild(badge);

		return { slot, img, badge };
	}

	const slotEls: HTMLDivElement[] = [];
	const slotImgs: HTMLImageElement[] = [];
	const slotBadges: HTMLDivElement[] = [];

	const invGrid = document.createElement("div");
	invGrid.style.display = "grid";
	invGrid.style.gridTemplateColumns = "repeat(5, 1fr)";
	invGrid.style.gap = "6px";

	for (let i = 0; i < 25; i++) {
		const { slot, img, badge } = createSlotEl(i);
		slot.addEventListener("dragstart", (e) => {
			e.dataTransfer?.setData("text/plain", slot.dataset.slotIndex ?? "");
			e.dataTransfer!.effectAllowed = "move";
			if (dragPreviewCtx) {
				dragPreviewCtx.clearRect(0, 0, 32, 32);
				dragPreviewCtx.drawImage(img, 0, 0, 32, 32);
				e.dataTransfer?.setDragImage(dragPreview, 32, 32);
			}
		});
		slotEls.push(slot);
		slotImgs.push(img);
		slotBadges.push(badge);
		invGrid.appendChild(slot);
	}

	container.appendChild(invGrid);

	function update(snapshot: GameStateSnapshot | null) {
		const gold = snapshot?.player?.gold ?? 0;
		goldRow.textContent = `Gold: ${gold}`;

		const slots = snapshot?.player?.inventory?.slots ?? [];

		for (let i = 0; i < 25; i++) {
			const item = slots[i] ?? null;
			const slot = slotEls[i]!;
			const img = slotImgs[i]!;
			const badge = slotBadges[i]!;

			if (!item) {
				slot.draggable = false;
				delete slot.dataset.itemId;
				delete slot.dataset.quantity;
				img.style.display = "none";
				img.src = "";
				badge.style.display = "none";
				badge.textContent = "";
				slot.title = "";
				continue;
			}

			slot.dataset.itemId = String(item.itemId);
			slot.dataset.quantity = String(item.quantity);
			slot.draggable = true;

			img.src = `/assets/items/${item.itemId}.png`;
			img.style.display = "block";

			if (item.quantity > 1) {
				badge.textContent = String(item.quantity);
				badge.style.display = "block";
			} else {
				badge.style.display = "none";
			}

			slot.title = `Item ${item.itemId}`;
		}
	}

	return { button, container, slotEls, update };
}

export function isInventoryPanelVisible(inv: InventoryPanelUI): boolean {
	return inv.container.style.display !== "none";
}
