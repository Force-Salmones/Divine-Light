import type { SlotRef } from "../../../shared/protocol/ws.js";
import type { GameStateSnapshot } from "../../../shared/protocol/gamestate.js";
import { createSlotEl } from "./createSlotEl.js";
import type { DragPayload } from "../input/dragPayload.js";

export type EquipmentPanelUI = {
	button: HTMLButtonElement;
	container: HTMLDivElement;
	update: (snapshot: GameStateSnapshot | null) => void;
};

type SlotItemDragPayload = Extract<DragPayload, { type: "slotItem" }>;

export function createEquipmentPanelUI(options: {
	onSwapItem: (a: SlotRef, b: SlotRef) => void;
}): EquipmentPanelUI {
	const button = document.createElement("button");
	button.textContent = "Equipment";
	button.style.position = "static";
	button.style.right = "";
	button.style.bottom = "";
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
	header.textContent = "Equipment";
	header.style.fontSize = "14px";
	header.style.fontWeight = "bold";
	header.style.marginBottom = "10px";
	container.appendChild(header);

	// offscreen drag preview canvas
	const dragPreview = document.createElement("canvas");
	dragPreview.width = 32;
	dragPreview.height = 32;
	dragPreview.style.position = "fixed";
	dragPreview.style.left = "-9999px";
	dragPreview.style.top = "-9999px";
	document.body.appendChild(dragPreview);
	const dragPreviewCtx = dragPreview.getContext("2d");

	button.addEventListener("click", () => {
		const visible = container.style.display !== "none";
		container.style.display = visible ? "none" : "block";
	});

	function parsePayload(raw: string): DragPayload | null {
		try {
			return JSON.parse(raw) as DragPayload;
		} catch {
			return null;
		}
	}

	function payloadToSlotRef(p: SlotItemDragPayload): SlotRef {
		if (p.from === "equipment")
			return { from: "equipment", slotKey: p.slotKey };
		return { from: p.from, slotIndex: p.slotIndex };
	}

	function wireSlot(
		slotEl: HTMLDivElement,
		img: HTMLImageElement,
		slotKey: "weapon" | "charm",
	) {
		const payload: DragPayload = {
			type: "slotItem",
			from: "equipment",
			slotKey,
		};

		slotEl.addEventListener("dragstart", (e) => {
			e.dataTransfer?.setData(
				"application/x-slot-index",
				JSON.stringify(payload) ?? "",
			);
			e.dataTransfer!.effectAllowed = "move";
			if (dragPreviewCtx) {
				dragPreviewCtx.clearRect(0, 0, 32, 32);
				dragPreviewCtx.drawImage(img, 0, 0, 32, 32);
				e.dataTransfer?.setDragImage(dragPreview, 32, 32);
			}
		});

		slotEl.addEventListener("dragover", (e) => {
			e.preventDefault();
		});

		slotEl.addEventListener("drop", (e) => {
			e.preventDefault();
			const raw =
				e.dataTransfer?.getData("application/x-slot-index") ?? "";
			const parsed = parsePayload(raw);

			if (!parsed || parsed.type !== "slotItem") return;

			const a = payloadToSlotRef(parsed);
			const b: SlotRef = { from: "equipment", slotKey };

			if (a.from === "equipment") {
				return;
			}

			options.onSwapItem(a, b);
		});
	}

	// Weapon slot
	const weaponWrap = document.createElement("div");
	weaponWrap.style.display = "flex";
	weaponWrap.style.flexDirection = "column";
	weaponWrap.style.alignItems = "center";
	weaponWrap.style.gap = "6px";

	const {
		slot: weaponSlot,
		img: weaponImg,
		badge: weaponBadge,
	} = createSlotEl(0);
	weaponBadge.style.display = "none";
	wireSlot(weaponSlot, weaponImg, "weapon");

	const weaponLabel = document.createElement("div");
	weaponLabel.textContent = "Weapon";
	weaponLabel.style.opacity = "0.9";

	weaponWrap.appendChild(weaponSlot);
	weaponWrap.appendChild(weaponLabel);
	container.appendChild(weaponWrap);

	// Separator
	const sep = document.createElement("div");
	sep.style.height = "1px";
	sep.style.background = "rgba(255,255,255,0.2)";
	sep.style.margin = "12px 0";
	container.appendChild(sep);

	// Charm slot
	const charmWrap = document.createElement("div");
	charmWrap.style.display = "flex";
	charmWrap.style.flexDirection = "column";
	charmWrap.style.alignItems = "center";
	charmWrap.style.gap = "6px";

	const {
		slot: charmSlot,
		img: charmImg,
		badge: charmBadge,
	} = createSlotEl(1);
	charmBadge.style.display = "none";
	wireSlot(charmSlot, charmImg, "charm");

	const charmLabel = document.createElement("div");
	charmLabel.textContent = "Charm";
	charmLabel.style.opacity = "0.9";

	charmWrap.appendChild(charmSlot);
	charmWrap.appendChild(charmLabel);
	container.appendChild(charmWrap);

	function update(snapshot: GameStateSnapshot | null) {
		const eq = snapshot?.player?.equipment;
		const weapon = eq?.weapon ?? null;
		const charm = eq?.charm ?? null;

		// weapon render
		if (!weapon) {
			weaponSlot.draggable = false;
			delete weaponSlot.dataset.itemId;
			weaponImg.style.display = "none";
			weaponImg.src = "";
			weaponSlot.title = "";
		} else {
			weaponSlot.draggable = true;
			weaponSlot.dataset.itemId = String(weapon.itemId);
			weaponImg.src = `/assets/items/${weapon.itemId}.png`;
			weaponImg.style.display = "block";
			weaponSlot.title = `Item ${weapon.itemId}`;
		}

		// charm render
		if (!charm) {
			charmSlot.draggable = false;
			delete charmSlot.dataset.itemId;
			charmImg.style.display = "none";
			charmImg.src = "";
			charmSlot.title = "";
		} else {
			charmSlot.draggable = true;
			charmSlot.dataset.itemId = String(charm.itemId);
			charmImg.src = `/assets/items/${charm.itemId}.png`;
			charmImg.style.display = "block";
			charmSlot.title = `Item ${charm.itemId}`;
		}
	}

	return { button, container, update };
}

export function isEquipmentPanelVisible(eq: EquipmentPanelUI): boolean {
	return eq.container.style.display !== "none";
}
