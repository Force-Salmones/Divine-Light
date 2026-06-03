/**
 * DOM overlay layout.
 */

import type { Viewport } from "../render/viewport.js";
import { getWorldViewportRectCss } from "../render/viewport.js";

export type OverlayHandles = {
	chatContainer?: HTMLDivElement;
	statsButton?: HTMLButtonElement;
	statsContainer?: HTMLDivElement;
	optionsButton?: HTMLButtonElement;
	optionsContainer?: HTMLDivElement;
	inventoryButton?: HTMLButtonElement;
	inventoryContainer?: HTMLDivElement;
	bankContainer?: HTMLDivElement;
	equipmentButton?: HTMLButtonElement;
	equipmentContainer?: HTMLDivElement;
};

/**
 * Position DOM overlays within the world viewport.
 */
export function layoutOverlayElements(
	viewport: Viewport,
	handles: OverlayHandles,
) {
	const vp = getWorldViewportRectCss(viewport);
	const outsideRight = Math.max(0, viewport.canvasCssWidth - vp.right);
	const outsideBottom = Math.max(0, viewport.canvasCssHeight - vp.bottom);

	if (handles.chatContainer) {
		const maxWidth = Math.max(280, vp.width - 20);
		handles.chatContainer.style.left = `${vp.left + 10}px`;
		handles.chatContainer.style.bottom = `${outsideBottom + 10}px`;
		handles.chatContainer.style.width = `${Math.min(600, maxWidth)}px`;
	}

	const playerPanelHeight = 90;
	const playerPanelMargin = 10;
	const buttonGapFromPlayerPanel = 12;
	const buttonBottom =
		outsideBottom +
		playerPanelHeight +
		playerPanelMargin +
		buttonGapFromPlayerPanel;

	const statsBtnHeight = handles.statsButton?.offsetHeight ?? 24;
	const panelGapFromButtons = 10;
	const panelBottom = buttonBottom + statsBtnHeight + panelGapFromButtons;

	if (handles.statsButton) {
		handles.statsButton.style.right = `${outsideRight + 20}px`;
		handles.statsButton.style.bottom = `${buttonBottom}px`;
	}

	if (handles.optionsButton) {
		handles.optionsButton.style.right = `${outsideRight + 110}px`;
		handles.optionsButton.style.bottom = `${buttonBottom}px`;
	}

	if (handles.inventoryButton) {
		handles.inventoryButton.style.right = `${outsideRight + 220}px`;
		handles.inventoryButton.style.bottom = `${buttonBottom}px`;
	}

	if (handles.statsContainer) {
		handles.statsContainer.style.right = `${outsideRight + 20}px`;
		handles.statsContainer.style.bottom = `${panelBottom}px`;
	}

	if (handles.optionsContainer) {
		handles.optionsContainer.style.right = `${outsideRight + 290}px`;
		handles.optionsContainer.style.bottom = `${panelBottom}px`;
	}

	if (handles.inventoryContainer) {
		handles.inventoryContainer.style.right = `${outsideRight + 290 + 270}px`;
		handles.inventoryContainer.style.bottom = `${panelBottom}px`;
	}

	if (handles.bankContainer) {
		handles.bankContainer.style.right = `${outsideRight + 290 + 270 + 380}px`;
		handles.bankContainer.style.bottom = `${panelBottom}px`;
	}

	if (handles.equipmentContainer) {
		handles.equipmentContainer.style.right = `${outsideRight + 290}px`;
		handles.equipmentContainer.style.bottom = `${panelBottom}px`;
	}
	if (handles.equipmentButton) {
		handles.equipmentButton.style.right = `${outsideRight + 200}px`;
		handles.equipmentButton.style.bottom = `${buttonBottom - 30}px`;
	}
}
