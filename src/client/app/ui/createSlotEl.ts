export function createSlotEl(slotIndex: number) {
	const slot = document.createElement("div");
	slot.dataset.slotIndex = String(slotIndex);
	slot.style.height = "36px";
	slot.style.width = "36px";
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
