/**
 * Canvas drawing primitives.
 */

/**
 * Draw a selection outline rectangle.
 */
export function drawOutline(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
) {
	ctx.save();
	ctx.strokeStyle = "yellow";
	ctx.lineWidth = 3;
	ctx.strokeRect(x - 1, y - 1, width + 2, height + 2);
	ctx.restore();
}

/**
 * Draw a player name tag above an entity.
 */
export function drawNameTag(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	name: string,
) {
	const text = `<${name}>`;
	const textX = x + width / 2;
	const textY = y - 6;

	ctx.save();
	ctx.font = "12px sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "bottom";
	ctx.lineWidth = 3;
	ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
	ctx.fillStyle = "white";
	ctx.strokeText(text, textX, textY);
	ctx.fillText(text, textX, textY);
	ctx.restore();
}

/**
 * Draw a semi-transparent attack range circle around the local player.
 */
export function drawAttackRangeCircle(
	ctx: CanvasRenderingContext2D,
	playerX: number,
	playerY: number,
	playerSize: number,
	radius: number,
) {
	ctx.save();
	ctx.beginPath();
	ctx.strokeStyle = "rgba(255, 255, 0, 0.35)";
	ctx.lineWidth = 2;
	ctx.arc(
		playerX + playerSize / 2,
		playerY + playerSize / 2,
		radius,
		0,
		Math.PI * 2,
	);
	ctx.stroke();
	ctx.restore();
}
