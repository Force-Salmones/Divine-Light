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

export type CreateOptionsPanelOptions = {
	store: ClientStore;
};

/**
 * Create options panel and toggle button.
 */
export function createOptionsPanelUI(
	options: CreateOptionsPanelOptions,
): OptionsPanelUI {
	const button = document.createElement("button");
	button.textContent = "Options";
	button.style.position = "fixed";
	button.style.right = "360px";
	button.style.bottom = "20px";
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

		const row = document.createElement("div");
		row.style.display = "flex";
		row.style.alignItems = "center";
		row.style.justifyContent = "space-between";
		row.style.gap = "8px";

		const label = document.createElement("span");
		label.textContent = "Show other players' damage";

		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.checked = options.store.showOtherPlayersDamage;
		checkbox.addEventListener("change", () => {
			options.store.showOtherPlayersDamage = checkbox.checked;
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

		row.appendChild(label);
		row.appendChild(checkbox);
		container.appendChild(row);

		const hint = document.createElement("div");
		hint.style.marginTop = "8px";
		hint.style.opacity = "0.8";
		hint.textContent =
			"Shows outgoing damage numbers for other players (light grey).";
		container.appendChild(hint);
	}

	return { button, container, update };
}

/**
 * Returns true if the options panel is visible.
 */
export function isOptionsPanelVisible(options: OptionsPanelUI): boolean {
	return options.container.style.display !== "none";
}
