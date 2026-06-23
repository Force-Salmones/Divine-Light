import type { GameStateSnapshot } from "../../../shared/protocol/gamestate.js";
import type { DragPayload } from "../input/dragPayload.js";
import { createSlotEl } from "./createSlotEl.js";

export type Hotbar = {
	container: HTMLDivElement;
	update: (snapshot: GameStateSnapshot | null) => void;
	setSendBindHotbar: (
		fn: (toIndex: number, source: BindHotbarSource) => void,
	) => void;
};

type BindHotbarSource =
	| { kind: "inventory"; slotIndex: number }
	| {
			kind: "skillBook";
			skillId: Extract<DragPayload, { type: "skill" }>["skillId"];
	  };

export function createHotbar(): Hotbar {
	let sendBindHotbar:
		| ((toIndex: number, source: BindHotbarSource) => void)
		| null = null;

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

	const slots: {
		slot: HTMLDivElement;
		img: HTMLImageElement;
		badge: HTMLDivElement;
	}[] = [];
	for (let i = 0; i < 9; i++) {
		const { slot, img, badge } = createSlotEl(i);
		badge.textContent = String(i + 1);
		badge.style.display = "block";

		slot.addEventListener("dragover", (e) => {
			e.preventDefault();
		});
		slot.addEventListener("drop", (e) => {
			e.preventDefault();
			const raw = e.dataTransfer?.getData("application/x-slot-index");
			if (!raw || !sendBindHotbar) return;

			let payload: DragPayload;
			try {
				payload = JSON.parse(raw) as DragPayload;
			} catch {
				return;
			}
			if (payload.type === "slotItem") {
				if (payload.from !== "inventory") return;
				sendBindHotbar(i, {
					kind: "inventory",
					slotIndex: payload.slotIndex,
				});
				return;
			}
			if (payload.type === "skill") {
				sendBindHotbar(i, {
					kind: "skillBook",
					skillId: payload.skillId,
				});
				return;
			}
		});

		container.appendChild(slot);
		slots.push({ slot, img, badge });
	}

	document.body.appendChild(container);

	function update(snapshot: GameStateSnapshot | null) {
		if (!snapshot) {
			for (const { img } of slots) {
				img.style.display = "none";
				img.src = "";
			}
			return;
		}
		const hotbarSlots = snapshot.player.hotbar.slots ?? [];
		for (let i = 0; i < 9; i++) {
			const binding = hotbarSlots[i] ?? null;
			const img = slots[i]!.img;

			if (!binding) {
				img.style.display = "none";
				img.src = "";
				continue;
			}

			if (binding.kind === "useItem") {
				img.src = `/assets/items/${binding.itemId}.png`;
				img.style.display = "block";
			} else if (binding.kind === "skill") {
				img.src = `/assets/skills/${binding.skillId}.png`;
				img.style.display = "block";
			}
		}
	}
	function setSendBindHotbar(
		fn: (toIndex: number, source: BindHotbarSource) => void,
	) {
		sendBindHotbar = fn;
	}

	return { container, update, setSendBindHotbar };
}
