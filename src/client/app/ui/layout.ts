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

	if (handles.statsContainer) {
		handles.statsContainer.style.right = `${outsideRight + 20}px`;
		handles.statsContainer.style.bottom = `${panelBottom}px`;
	}

	if (handles.optionsContainer) {
		handles.optionsContainer.style.right = `${outsideRight + 20 + 270}px`;
		handles.optionsContainer.style.bottom = `${panelBottom}px`;
	}
}
