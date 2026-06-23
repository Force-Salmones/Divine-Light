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
	hotbarContainer?: HTMLDivElement;
	skillBookContainer?: HTMLDivElement;
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
	if (handles.skillBookContainer) {
		handles.skillBookContainer.style.right = `${outsideRight + 290 + 270}px`;
		handles.skillBookContainer.style.bottom = `${panelBottom}px`;
	}
	if (handles.hotbarContainer) {
		const chatWidth = 600;
		const chatLeft = 10;
		const playerPanelWidth = 260;
		const margin = 10;

		// Center between chat right edge and player panel left edge
		const availableWidth =
			viewport.canvasCssWidth -
			chatLeft -
			chatWidth -
			playerPanelWidth -
			margin * 3;
		const hotbarWidth = 9 * 36 + 8 * 4 + 8; // 9 slots + 8 gaps + padding

		const left =
			chatLeft + chatWidth + margin + (availableWidth - hotbarWidth) / 2;

		handles.hotbarContainer.style.left = `${left}px`;
	}
}
