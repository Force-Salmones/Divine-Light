/**
 * requestAnimationFrame game loop.
 */

import type { AppContext } from "../appContext.js";
import { updateFloatingTexts } from "../effects/floatingText.js";
import { renderFrame } from "../render/renderFrame.js";

/**
 * Start the animation loop.
 */
export function startGameLoop(app: AppContext) {
	let lastTime = 0;

	function frame(timestamp: number) {
		const deltaMs = timestamp - lastTime;
		lastTime = timestamp;

		updateFloatingTexts(app.floatingText, deltaMs);
		renderFrame(app);

		requestAnimationFrame(frame);
	}

	requestAnimationFrame(frame);
}
