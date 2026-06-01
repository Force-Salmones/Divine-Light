import type { GameStateSnapshot } from "../../../shared/protocol/gamestate.js";
import { createSlotEl } from "./createSlotEl.js";

export type BankPanelUI = {
	container: HTMLDivElement;
	sync: (snapshot: GameStateSnapshot | null) => void;
};

export function createBankPanelUi(opts: { onClose: () => void }): BankPanelUI {
	const container = document.createElement("div");
	container.style.position = "fixed";
	container.style.right = "560px";
	container.style.bottom = "120px";
	container.style.width = "332px";
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

	const headerRow = document.createElement("div");
	headerRow.style.display = "flex";
	headerRow.style.alignItems = "center";
	headerRow.style.justifyContent = "space-between";
	headerRow.style.marginBottom = "8px";

	const title = document.createElement("div");
	title.textContent = "Bank";
	title.style.fontSize = "14px";
	title.style.fontWeight = "bold";

	const closeButton = document.createElement("button");
	closeButton.textContent = "Close";
	closeButton.style.padding = "4px 8px";
	closeButton.style.fontSize = "12px";
	closeButton.style.fontFamily = "sans-serif";
	closeButton.style.cursor = "pointer";
	closeButton.style.background = "rgba(0,0,0,0.8)";
	closeButton.style.color = "#ffffff";
	closeButton.style.border = "1px solid rgba(255,255,255, 0.5)";
	closeButton.style.borderRadius = "3px";
	closeButton.addEventListener("click", () => {
		opts.onClose();
	});

	headerRow.appendChild(title);
	headerRow.appendChild(closeButton);
	container.appendChild(headerRow);

	const gridWrapper = document.createElement("div");
	gridWrapper.style.maxHeight = "360px";
	gridWrapper.style.overflowY = "auto";
	gridWrapper.style.paddingRight = "12px";
	container.append(gridWrapper);

	const grid = document.createElement("div");
	grid.style.display = "grid";
	grid.style.gridTemplateColumns = "repeat(7, 1fr)";
	grid.style.gap = "6px";
	gridWrapper.appendChild(grid);

	const slotEls: HTMLDivElement[] = [];
	const slotImgs: HTMLImageElement[] = [];
	const slotBadges: HTMLDivElement[] = [];

	for (let i = 0; i < 98; i++) {
		const { slot, img, badge } = createSlotEl(i);
		slotEls.push(slot);
		slotImgs.push(img);
		slotBadges.push(badge);
		grid.appendChild(slot);
	}

	function sync(snapshot: GameStateSnapshot | null) {
		if (!snapshot) return;
		const open = !!snapshot?.player?.bankOpen;
		container.style.display = open ? "block" : "none";
		if (!open) return;

		const slots = snapshot?.player?.bank?.slots ?? [];
		for (let i = 0; i < 98; i++) {
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

	document.body.appendChild(container);
	return { container, sync };
}
