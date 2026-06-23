import type { SkillId } from "../../../shared/skills/skillTypes.js";
import type { GameStateSnapshot } from "../../../shared/protocol/gamestate.js";
import { createSlotEl } from "./createSlotEl.js";
import type { DragPayload } from "../input/dragPayload.js";

export type SkillPanelUI = {
	button: HTMLButtonElement;
	container: HTMLDivElement;
	update: (snapshot: GameStateSnapshot | null) => void;
};

export function createSkillPanelUI(opts: {
	onLevelUpSkill?: (id: SkillId) => void;
}): SkillPanelUI {
	const button = document.createElement("button");
	button.textContent = "Skills";
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
	container.style.right = "20px";
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
	header.textContent = "Skill Book";
	header.style.fontSize = "14px";
	header.style.fontWeight = "bold";
	header.style.marginBottom = "6px";
	container.appendChild(header);

	const selectedInfo = document.createElement("div");
	selectedInfo.style.marginBottom = "8px";
	selectedInfo.style.minHeight = "36px";
	container.appendChild(selectedInfo);

	const levelUpButton = document.createElement("button");
	levelUpButton.textContent = "Level Up";
	levelUpButton.style.padding = "4px 8px";
	levelUpButton.style.fontSize = "12px";
	levelUpButton.style.fontFamily = "sans-serif";
	levelUpButton.style.cursor = "pointer";
	levelUpButton.style.background = "rgba(0,0,0,0.8)";
	levelUpButton.style.color = "#ffffff";
	levelUpButton.style.border = "1px solid rgba(255,255,255, 0.5)";
	levelUpButton.style.borderRadius = "3px";
	levelUpButton.style.marginBottom = "8px";

	container.appendChild(levelUpButton);

	const grid = document.createElement("div");
	grid.style.display = "grid";
	grid.style.gridTemplateColumns = "repeat(4, 1fr)";
	grid.style.gap = "6px";
	container.appendChild(grid);

	button.addEventListener("click", () => {
		const visible = container.style.display !== "none";
		container.style.display = visible ? "none" : "block";
	});

	const slotEls: HTMLDivElement[] = [];
	const slotImgs: HTMLImageElement[] = [];
	const slotBadges: HTMLDivElement[] = [];

	let skillIds: SkillId[] = [];
	let selectedSkillId: SkillId | null = null;

	function resetSlotStyles() {
		slotEls.forEach((s) => {
			s.style.border = "1px solid rgba(255,255,255,0.35)";
			s.style.background = "rgba(255,255,255,0.06)";
		});
	}

	function updateSelectedInfo(snapshot: GameStateSnapshot | null) {
		selectedInfo.innerHTML = "";

		if (!snapshot || selectedSkillId === null) {
			const hint = document.createElement("div");
			hint.textContent = "Click a skill to view details.";
			hint.style.opacity = "0.7";
			selectedInfo.appendChild(hint);
			levelUpButton.disabled = true;
			levelUpButton.style.opacity = "0.5";
			return;
		}
		const skillPoints = snapshot.player.skillPoints ?? 0;
		const level = snapshot.player.skillBook?.[selectedSkillId] ?? 0;

		levelUpButton.disabled = skillPoints <= 0;
		levelUpButton.style.opacity = skillPoints > 0 ? "1" : "0.5";

		const nameEl = document.createElement("div");
		nameEl.textContent = `Skill: ${selectedSkillId}`;
		nameEl.style.fontWeight = "bold";
		selectedInfo.appendChild(nameEl);

		const levelEl = document.createElement("div");
		levelEl.textContent = `Level: ${level}`;
		selectedInfo.appendChild(levelEl);

		const pointsEl = document.createElement("div");
		pointsEl.textContent = `Skill Points: ${skillPoints}`;
		selectedInfo.appendChild(pointsEl);
	}

	levelUpButton.addEventListener("click", () => {
		if (selectedSkillId !== null) {
			opts.onLevelUpSkill?.(selectedSkillId);
		}
	});

	function renderSlotContent(
		index: number,
		snapshot: GameStateSnapshot | null,
	) {
		const skill = snapshot ? snapshot.player.skillBook[index] : undefined;

		const slot = slotEls[index]!;
		const img = slotImgs[index]!;
		const badge = slotBadges[index]!;

		const skillId = skillIds[index];
		const level =
			snapshot && skillId !== undefined
				? snapshot.player.skillBook?.[skillId]
				: undefined;

		if (!snapshot || skillId === undefined || level === undefined) {
			slot.draggable = false;
			img.style.display = "none";
			img.src = "";
			badge.style.display = "none";
			badge.textContent = "";
			slot.title = "";
			slot.style.cursor = "pointer";
			return;
		}

		slot.title = `Skill ${skillId} (Level ${level})`;
		slot.style.cursor = "pointer";

		img.src = `/assets/skills/${skillId}.png`;
		img.style.display = "block";

		if (level > 1) {
			badge.textContent = String(level);
			badge.style.display = "block";
			// different color for max level later
		} else {
			badge.style.display = "none";
			badge.textContent = "";
		}
	}
	function update(snapshot: GameStateSnapshot | null) {
		if (!snapshot) {
			skillIds = [];
			selectedSkillId = null;
			updateSelectedInfo(null);
			return;
		}

		const book = snapshot.player.skillBook ?? {};

		const entries = Object.entries(book).sort(
			(a, b) => Number(a[0]) - Number(b[0]),
		);

		skillIds = entries.map(([idStr]) => Number(idStr) as SkillId);

		if (selectedSkillId !== null && book[selectedSkillId] === undefined) {
			selectedSkillId = null;
		}

		// Dynamically grow slots to match learned skills
		while (slotEls.length < skillIds.length) {
			const index = slotEls.length;
			const { slot, img, badge } = createSlotEl(index);

			slot.draggable = true;

			slot.addEventListener("click", () => {
				const id = skillIds[index];
				if (id === undefined) return;

				selectedSkillId = id;
				updateSelectedInfo(snapshot);
				resetSlotStyles();
				slot.style.border = "2px solid #ffff00";
				slot.style.background = "rgba(255,255,255,0.15)";
			});

			slot.addEventListener("dragstart", (e) => {
				const id = skillIds[index];
				if (id === undefined) return;
				const payload: DragPayload = { type: "skill", skillId: id };
				e.dataTransfer?.setData(
					"application/x-slot-index",
					JSON.stringify(payload),
				);
			});

			slotEls.push(slot);
			slotImgs.push(img);
			slotBadges.push(badge);
			grid.appendChild(slot);
		}

		updateSelectedInfo(snapshot);

		for (let i = 0; i < skillIds.length; i++) {
			renderSlotContent(i, snapshot);
		}
		for (let i = skillIds.length; i < slotEls.length; i++) {
			renderSlotContent(i, null);
		}
	}

	return { button, container, update };
}

export function isSkillPanelVisible(skill: SkillPanelUI): boolean {
	return skill.container.style.display !== "none";
}
