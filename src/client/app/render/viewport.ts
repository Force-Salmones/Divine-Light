/**
 * Viewport / transform utilities.
 *
 * The world is drawn in "world units" (matching the world background image dimensions).
 * The browser viewport may have a different aspect ratio, so we letterbox the world to fit.
 */

export type Viewport = {
	/** World size in world units. */
	worldWidth: number;
	worldHeight: number;

	/** Device pixel ratio used for high-DPI crispness. */
	dpr: number;

	/** Screen size in CSS pixels. */
	canvasCssWidth: number;
	canvasCssHeight: number;

	/** World->screen scale factor (CSS px / world unit). */
	viewScale: number;

	/** Letterbox offset in CSS pixels. */
	viewOffsetX: number;
	viewOffsetY: number;
};

/**
 * Create a viewport with default world size.
 */
export function createViewport(options?: {
	worldWidth?: number;
	worldHeight?: number;
}): Viewport {
	return {
		worldWidth: options?.worldWidth ?? 1536,
		worldHeight: options?.worldHeight ?? 864,
		dpr: window.devicePixelRatio || 1,
		canvasCssWidth: window.innerWidth,
		canvasCssHeight: window.innerHeight,
		viewScale: 1,
		viewOffsetX: 0,
		viewOffsetY: 0,
	};
}

/**
 * Recompute the letterbox transform given the current world and screen dimensions.
 */
export function updateViewTransform(viewport: Viewport) {
	viewport.viewScale = Math.min(
		viewport.canvasCssWidth / viewport.worldWidth,
		viewport.canvasCssHeight / viewport.worldHeight,
	);
	viewport.viewOffsetX =
		(viewport.canvasCssWidth - viewport.worldWidth * viewport.viewScale) /
		2;
	viewport.viewOffsetY =
		(viewport.canvasCssHeight - viewport.worldHeight * viewport.viewScale) /
		2;
}

/**
 * Apply a world-space transform to the canvas context.
 */
export function setWorldTransform(
	ctx: CanvasRenderingContext2D,
	viewport: Viewport,
) {
	ctx.setTransform(
		viewport.viewScale * viewport.dpr,
		0,
		0,
		viewport.viewScale * viewport.dpr,
		viewport.viewOffsetX * viewport.dpr,
		viewport.viewOffsetY * viewport.dpr,
	);
}

/**
 * Apply a UI/screen-space transform to the canvas context.
 */
export function setUiTransform(ctx: CanvasRenderingContext2D, viewport: Viewport) {
	ctx.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
}

/**
 * Resize the canvas backing buffer to match the browser viewport.
 */
export function resizeCanvasToScreen(
	canvas: HTMLCanvasElement,
	viewport: Viewport,
) {
	viewport.dpr = window.devicePixelRatio || 1;
	viewport.canvasCssWidth = window.innerWidth;
	viewport.canvasCssHeight = window.innerHeight;

	canvas.style.position = "fixed";
	canvas.style.left = "0";
	canvas.style.top = "0";
	canvas.style.width = `${viewport.canvasCssWidth}px`;
	canvas.style.height = `${viewport.canvasCssHeight}px`;

	canvas.width = Math.floor(viewport.canvasCssWidth * viewport.dpr);
	canvas.height = Math.floor(viewport.canvasCssHeight * viewport.dpr);

	updateViewTransform(viewport);
}

/**
 * Convert a click coordinate (clientX/clientY) into world coordinates.
 */
export function screenToWorld(
	canvas: HTMLCanvasElement,
	viewport: Viewport,
	clientX: number,
	clientY: number,
) {
	const rect = canvas.getBoundingClientRect();
	const sx = clientX - rect.left;
	const sy = clientY - rect.top;

	const wx = (sx - viewport.viewOffsetX) / viewport.viewScale;
	const wy = (sy - viewport.viewOffsetY) / viewport.viewScale;
	return { x: wx, y: wy };
}

/**
 * Returns the world viewport rectangle in CSS pixels.
 * Used to place DOM overlays inside the visible world area (not in letterbox bars).
 */
export function getWorldViewportRectCss(viewport: Viewport) {
	const width = viewport.worldWidth * viewport.viewScale;
	const height = viewport.worldHeight * viewport.viewScale;
	return {
		left: viewport.viewOffsetX,
		top: viewport.viewOffsetY,
		width,
		height,
		right: viewport.viewOffsetX + width,
		bottom: viewport.viewOffsetY + height,
	};
}