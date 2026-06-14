/**
 * Canvas-drawn UI panels.
 */

import type { Viewport } from "./viewport.js";
import { getWorldViewportRectCss } from "./viewport.js";
import type {
	EnemyPublic,
	PlayerPublic,
	PlayerPrivate,
} from "../../../shared/protocol/gamestate.js";
import type { SpriteCache } from "../assets/spriteCache.js";
import { INFO_PANEL_SPRITE_SIZE } from "../../../app/constants.js";
import type { ActiveEffect } from "../../../shared/protocol/modifiers.js";

export type PlayerSelf = PlayerPublic & PlayerPrivate;

/**
 * Draw top-left selected entity info panel.
 */
export function drawSelectedEntityPanel(
	ctx: CanvasRenderingContext2D,
	viewport: Viewport,
	entity: PlayerPublic | EnemyPublic,
	kind: "player" | "enemy",
	sprites: SpriteCache,
	statusText: string,
) {
	const vp = getWorldViewportRectCss(viewport);
	const panelX = vp.left + 10;
	const panelY = vp.top + 10;
	const panelWidth = 220;
	const panelHeight = 80;

	ctx.save();
	ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
	ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
	ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
	ctx.lineWidth = 2;
	ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

	ctx.fillStyle = "white";
	ctx.font = "14px sans-serif";
	ctx.fillText(
		entity.name || kind.charAt(0).toUpperCase() + kind.slice(1),
		panelX + 10,
		panelY + 22,
	);
	ctx.font = "12px sans-serif";
	ctx.fillText(`Level ${entity.level}`, panelX + 10, panelY + 38);
	ctx.fillText(
		`HP: ${entity.currHealth}/${entity.maxHealth}`,
		panelX + 10,
		panelY + 54,
	);

	ctx.fillStyle = statusText === "In range" ? "lightgreen" : "lightcoral";
	ctx.fillText(statusText, panelX + 10, panelY + 70);

	const spriteImg = sprites.images.get(entity.sprite);
	const spriteSize = INFO_PANEL_SPRITE_SIZE;
	const spriteX = panelX + panelWidth - spriteSize - 8;
	const spriteY = panelY + (panelHeight - spriteSize) / 2;
	if (spriteImg) {
		ctx.drawImage(spriteImg, spriteX, spriteY, spriteSize, spriteSize);
	} else {
		ctx.fillStyle = kind === "player" ? "blue" : "green";
		ctx.fillRect(spriteX, spriteY, spriteSize, spriteSize);
	}

	ctx.restore();

	drawEffectDrawer(
		ctx,
		panelX,
		panelY + panelHeight + 6,
		panelWidth,
		entity.activeEffects,
		sprites,
		{ iconSize: 18, maxRows: 1 },
	);
}

/**
 * Draw bottom-right self status panel.
 */
export function drawPlayerInfoPanel(
	ctx: CanvasRenderingContext2D,
	viewport: Viewport,
	self: PlayerSelf,
	sprites: SpriteCache,
) {
	const vp = getWorldViewportRectCss(viewport);
	const panelWidth = 260;
	const panelHeight = 90;
	const panelX = vp.right - panelWidth - 10;
	const panelY = vp.bottom - panelHeight - 10;

	ctx.save();
	ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
	ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
	ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
	ctx.lineWidth = 2;
	ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

	ctx.fillStyle = "white";
	ctx.font = "14px sans-serif";
	ctx.fillText(self.name || "Player", panelX + 10, panelY + 20);
	ctx.font = "12px sans-serif";
	ctx.fillText(`Level ${self.level}`, panelX + 10, panelY + 36);
	ctx.fillText(
		`HP: ${self.currHealth}/${self.maxHealth}`,
		panelX + 10,
		panelY + 52,
	);
	ctx.fillText(
		`MP: ${self.currMana}/${self.maxMana}`,
		panelX + 10,
		panelY + 66,
	);
	ctx.fillText(
		`EXP: ${self.experience}/${self.expToNextLevel}`,
		panelX + 10,
		panelY + 80,
	);

	ctx.restore();

	const drawerHeight = measureEffectGridHeight(
		panelWidth,
		self.activeEffects.length,
		3,
		18,
		4,
	).height;

	const drawerY = panelY - 6 - drawerHeight;

	drawEffectDrawer(
		ctx,
		panelX,
		drawerY,
		panelWidth,
		self.activeEffects,
		sprites,
		{ iconSize: 30, maxRows: 3 },
	);
}

function measureEffectGridHeight(
	width: number,
	effectsCount: number,
	maxRows: number,
	iconSize: number,
	pad: number,
) {
	if (effectsCount <= 0) return { iconsPerRow: 0, rows: 0, height: 0 };
	const iconsPerRow = Math.max(
		1,
		Math.floor((width - pad) / (iconSize + pad)),
	);
	const totalRows = Math.ceil(effectsCount / iconsPerRow);
	const rows = Math.min(totalRows, maxRows);
	const height = rows * (iconSize + pad) + pad;

	return { iconsPerRow, rows, height };
}

type DrawEffectIconsOpts = {
	iconSize?: number;
	pad?: number;
	margin?: number;
	maxRows?: number;
};

function drawEffectDrawer(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	effects: ActiveEffect[],
	sprites: SpriteCache,
	opts?: DrawEffectIconsOpts,
) {
	if (!effects || effects.length === 0) return;

	const pad = opts?.pad ?? 4;
	const iconSize = opts?.iconSize ?? 18;

	const { iconsPerRow, rows, height } = measureEffectGridHeight(
		width,
		effects.length,
		opts?.maxRows ?? 1,
		iconSize,
		pad,
	);

	ctx.save();
	ctx.fillStyle = "rgba(0,0,0,0.65)";
	ctx.fillRect(x, y, width, height);
	ctx.strokeStyle = "rgba(255,255,255,0.65)";
	ctx.lineWidth = 1;
	ctx.strokeRect(x, y, width, height);

	const maxIcons = iconsPerRow * rows;

	for (let i = 0; i < Math.min(effects.length, maxIcons); i++) {
		const eff = effects[i];
		const row = Math.floor(i / iconsPerRow);
		const col = i % iconsPerRow;

		const ix = x + pad + col * (iconSize + pad);
		const iy = y + pad + row * (iconSize + pad);

		const src = `/assets/effectIcons/${eff?.id}.png`;
		const img = sprites.images.get(src);

		if (img) ctx.drawImage(img, ix, iy, iconSize, iconSize);
		else {
			ctx.fillStyle = "rgba(200,80,80,0.9)";
			ctx.fillRect(ix, iy, iconSize, iconSize);
		}

		ctx.strokeStyle = "rgba(255,255,255, 0.35)";
		ctx.strokeRect(ix, iy, iconSize, iconSize);
	}

	ctx.restore();
	return height;
}
