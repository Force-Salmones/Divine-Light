/**
 * Options panel UI (DOM overlay).
 */

import type { ClientStore } from "../state/store.js";
import type { GameStateSnapshot } from "../../../shared/protocol/gamestate.js";

export type OptionsPanelUI = {
	button: HTMLButtonElement;
	container: HTMLDivElement;
	update: (snapshot: GameStateSnapshot | null) => void;
};

/**
 * Create options panel and toggle button.
 */
export function createOptionsPanelUI(options: {
	store: ClientStore;
}): OptionsPanelUI {
	const button = document.createElement("button");
	button.textContent = "Options";
	button.style.position = "static";
	button.style.right = "";
	button.style.bottom = "";
	button.style.padding = "4px 8px";
	button.style.fontSize = "12px";
	button.style.fontFamily = "sans-serif";
	button.style.cursor = "pointer";
	button.style.background = "rgba(0, 0, 0, 0.8)";
	button.style.color = "#ffffff";
	button.style.border = "1px solid rgba(255, 255, 255, 0.5)";
	button.style.borderRadius = "3px";

	const container = document.createElement("div");
	container.style.position = "fixed";
	container.style.right = "290px";
	container.style.bottom = "120px";
	container.style.width = "260px";
	container.style.maxHeight = "300px";
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

	/**
	 * Render the options panel.
	 */
	function update(snapshot: GameStateSnapshot | null) {
		container.innerHTML = "";

		const header = document.createElement("div");
		header.textContent = "Options";
		header.style.fontSize = "14px";
		header.style.fontWeight = "bold";
		header.style.marginBottom = "6px";
		container.appendChild(header);

		// Show other Players' Damage
		const otherPlayersDmgRow = document.createElement("div");
		otherPlayersDmgRow.style.display = "flex";
		otherPlayersDmgRow.style.alignItems = "center";
		otherPlayersDmgRow.style.justifyContent = "space-between";
		otherPlayersDmgRow.style.gap = "8px";

		const otherPlayersDmgLabel = document.createElement("span");
		otherPlayersDmgLabel.textContent = "Show other players' damage";

		const otherPlayersDmgCheckbox = document.createElement("input");
		otherPlayersDmgCheckbox.type = "checkbox";
		otherPlayersDmgCheckbox.checked = options.store.showOtherPlayersDamage;
		otherPlayersDmgCheckbox.addEventListener("change", () => {
			options.store.showOtherPlayersDamage =
				otherPlayersDmgCheckbox.checked;
			localStorage.setItem(
				"showOtherPlayersDamage",
				options.store.showOtherPlayersDamage ? "1" : "0",
			);

			// When enabling, set baselines so we don't replay old events.
			if (options.store.showOtherPlayersDamage && snapshot) {
				options.store.processedOtherAttackEventKeys.clear();
				const events = snapshot.lastAttackEvents ?? [];
				if (events.length) {
					options.store.lastProcessedOtherAttackEventTimestamp =
						Math.max(...events.map((e) => e.timestamp ?? 0));
				} else {
					options.store.lastProcessedOtherAttackEventTimestamp =
						Date.now();
				}
			}
		});

		otherPlayersDmgRow.appendChild(otherPlayersDmgLabel);
		otherPlayersDmgRow.appendChild(otherPlayersDmgCheckbox);
		container.appendChild(otherPlayersDmgRow);

		const hint = document.createElement("div");
		hint.style.marginTop = "8px";
		hint.style.opacity = "0.8";
		hint.textContent =
			"Shows outgoing damage numbers for other players (light grey).";
		container.appendChild(hint);

		// Show FPS
		const showFPSRow = document.createElement("div");
		showFPSRow.style.display = "flex";
		showFPSRow.style.alignItems = "center";
		showFPSRow.style.justifyContent = "space-between";
		showFPSRow.style.gap = "8px";

		const showFPSLabel = document.createElement("span");
		showFPSLabel.textContent = "Show FPS Counter";

		const showFPSCheckbox = document.createElement("input");
		showFPSCheckbox.type = "checkbox";
		showFPSCheckbox.checked = options.store.showFpsCounter;
		showFPSCheckbox.addEventListener("change", () => {
			options.store.showFpsCounter = showFPSCheckbox.checked;
			localStorage.setItem(
				"showFpsCounter",
				options.store.showFpsCounter ? "1" : "0",
			);
		});

		showFPSRow.appendChild(showFPSLabel);
		showFPSRow.appendChild(showFPSCheckbox);
		container.appendChild(showFPSRow);
	}

	return { button, container, update };
}

/**
 * Returns true if the options panel is visible.
 */
export function isOptionsPanelVisible(options: OptionsPanelUI): boolean {
	return options.container.style.display !== "none";
}
