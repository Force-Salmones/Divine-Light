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

		if (deltaMs > 0) {
			const instantFps = 1000 / deltaMs;
			app.store.fps = app.store.fps
				? app.store.fps * 0.9 + instantFps * 0.1
				: instantFps;
		}

		updateFloatingTexts(app.floatingText, deltaMs);
		renderFrame(app);

		requestAnimationFrame(frame);
	}

	requestAnimationFrame(frame);
}
