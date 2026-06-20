/**
 * Stats panel UI (DOM overlay).
 */

import type {
	GameStateSnapshot,
	StatKey,
} from "../../../shared/protocol/gamestate.js";

export type StatsPanelUI = {
	button: HTMLButtonElement;
	container: HTMLDivElement;
	update: (snapshot: GameStateSnapshot) => void;
};

export type CreateStatsPanelOptions = {
	onSpendStat: (stat: StatKey) => void;
};

/**
 * Create the stats toggle button and panel.
 */
export function createStatsPanelUI(
	options: CreateStatsPanelOptions,
): StatsPanelUI {
	const button = document.createElement("button");
	button.textContent = "Stats";
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
	container.style.right = "20px";
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
	 * Render the panel from the current snapshot.
	 */
	function update(snapshot: GameStateSnapshot) {
		const p = snapshot.player;
		container.innerHTML = "";

		const header = document.createElement("div");
		header.textContent = "Stats";
		header.style.fontSize = "14px";
		header.style.fontWeight = "bold";
		header.style.marginBottom = "6px";
		container.appendChild(header);

		const makeRow = (
			label: string,
			value: string,
			canSpend: boolean,
			statKey?: StatKey,
		) => {
			const row = document.createElement("div");
			row.style.display = "flex";
			row.style.justifyContent = "space-between";
			row.style.alignItems = "center";
			row.style.marginBottom = "4px";

			const labelSpan = document.createElement("span");
			labelSpan.textContent = label;

			const valueSpan = document.createElement("span");
			valueSpan.textContent = value;

			row.appendChild(labelSpan);
			row.appendChild(valueSpan);

			if (canSpend && statKey) {
				const btn = document.createElement("button");
				btn.textContent = "+";
				btn.style.marginLeft = "6px";
				btn.style.padding = "0 4px";
				btn.style.fontSize = "11px";
				btn.style.cursor = "pointer";
				btn.addEventListener("click", () => {
					if (snapshot.player.unallocatedPoints <= 0) return;
					options.onSpendStat(statKey);
				});
				row.appendChild(btn);
			}

			container.appendChild(row);
		};

		makeRow("STR", String(p.STR), true, "STR");
		makeRow("VIT", String(p.VIT), true, "VIT");
		makeRow("DEX", String(p.DEX), true, "DEX");
		makeRow("LUK", String(p.LUK), true, "LUK");
		makeRow("INT", String(p.INT), true, "INT");
		makeRow("WIS", String(p.WIS), true, "WIS");

		const basePhys = 1 + 2 * p.STR + p.DEX;
		const baseMag = 1 + 2 * p.INT + p.WIS;
		const attackMin = Math.floor(basePhys * 0.8);
		const attackMax = Math.ceil(basePhys * 1.2);
		const magicMin = Math.floor(baseMag * 0.8);
		const magicMax = Math.ceil(baseMag * 1.2);

		makeRow("Attack", `${attackMin} - ${attackMax}`, false);
		makeRow("Magic Attack", `${magicMin} - ${magicMax}`, false);
		makeRow("Defense", String(p.defense), false);
		makeRow("Resistance", String(p.resistance), false);
		makeRow("Speed", String(p.speed), false);
		makeRow("Attack Speed", String(p.attackSpeed), false);

		const footer = document.createElement("div");
		footer.style.marginTop = "8px";
		footer.textContent = `Unallocated points: ${p.unallocatedPoints}`;
		container.appendChild(footer);
	}

	return { button, container, update };
}

/**
 * Returns true if the stats panel is visible.
 */
export function isStatsPanelVisible(stats: StatsPanelUI): boolean {
	return stats.container.style.display !== "none";
}
