/**
 * Floating text effects.
 *
 * This is a generalized system for damage numbers, level-up text, emotes, and future
 * text effects.
 */

export type FloatingTextKind = "damage" | "levelup" | "emote" | "system";

export type FloatingTextEvent = {
	/** World-space x coordinate. */
	x: number;

	/** World-space y coordinate. */
	y: number;

	/** Text to display. */
	text: string;

	/** CSS color value. */
	color?: string;

	/** Optional semantic label. */
	kind?: FloatingTextKind;

	/** Optional timestamp (ms) for debugging/dedupe. */
	timestamp?: number;
};

export type FloatingText = {
	x: number;
	y: number;
	text: string;
	color: string;
	kind?: FloatingTextKind;
	timestamp?: number;
	elapsed: number;
	duration: number;
	amplitude: number;
	frequency: number;
};

export type FloatingTextManager = {
	texts: FloatingText[];
};

/**
 * Create a floating-text manager.
 */
export function createFloatingTextManager(): FloatingTextManager {
	return { texts: [] };
}

/**
 * Spawn a floating text.
 */
export function spawnFloatingText(
	mgr: FloatingTextManager,
	event: FloatingTextEvent,
) {
	mgr.texts.push({
		x: event.x,
		y: event.y,
		text: event.text,
		color: event.color ?? "white",
		kind: event.kind,
		timestamp: event.timestamp,
		elapsed: 0,
		duration: 0.9,
		amplitude: 10,
		frequency: 3,
	});
}

/**
 * Advance all floating texts and remove expired ones.
 */
export function updateFloatingTexts(
	mgr: FloatingTextManager,
	deltaMs: number,
) {
	mgr.texts = mgr.texts.filter((t) => {
		t.elapsed += deltaMs / 1000;
		return t.elapsed < t.duration;
	});
}

/**
 * Render floating texts.
 *
 * Assumes the caller has set a world-space transform.
 */
export function renderFloatingTexts(
	ctx: CanvasRenderingContext2D,
	mgr: FloatingTextManager,
) {
	for (const t of mgr.texts) {
		const progress = t.elapsed / t.duration;
		const alpha = 1 - progress;
		const x =
			t.x +
			Math.sin(progress * Math.PI * 2 * t.frequency) * t.amplitude;
		const y = t.y - progress * 40;

		ctx.save();
		ctx.globalAlpha = alpha;
		ctx.font = "16px sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStyle = t.color;
		ctx.strokeStyle = "rgba(0, 0, 0, 0.65)";
		ctx.lineWidth = 2;
		ctx.strokeText(t.text, x, y);
		ctx.fillText(t.text, x, y);
		ctx.restore();
	}
}