/**
 * DOM overlay layout.
 */

import type { Viewport } from "../render/viewport.js";
import { getWorldViewportRectCss } from "../render/viewport.js";

export type OverlayHandles = {
	chatContainer?: HTMLDivElement;
	statsContainer?: HTMLDivElement;
	optionsContainer?: HTMLDivElement;
	inventoryContainer?: HTMLDivElement;
	bankContainer?: HTMLDivElement;
	equipmentContainer?: HTMLDivElement;
	uiButtonsContainer?: HTMLDivElement;
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

	const panelGapFromButtons = 10;
	const panelBottom = buttonBottom + panelGapFromButtons;

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

	if (handles.uiButtonsContainer) {
		handles.uiButtonsContainer.style.right = "0px";
		handles.uiButtonsContainer.style.bottom = `${playerPanelHeight + 20 + 100}px`;
	}
}
