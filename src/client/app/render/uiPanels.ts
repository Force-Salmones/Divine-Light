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

export type PlayerSelf = PlayerPublic & PlayerPrivate;

/**
 * Draw top-left enemy info panel.
 */
export function drawSelectedEnemyPanel(
	ctx: CanvasRenderingContext2D,
	viewport: Viewport,
	enemy: EnemyPublic,
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
	ctx.fillText(enemy.name || `Enemy #${enemy.id}`, panelX + 10, panelY + 22);
	ctx.font = "12px sans-serif";
	ctx.fillText(`Level ${enemy.level}`, panelX + 10, panelY + 38);
	ctx.fillText(
		`HP: ${enemy.currHealth}/${enemy.maxHealth}`,
		panelX + 10,
		panelY + 54,
	);

	ctx.fillStyle = statusText === "In range" ? "lightgreen" : "lightcoral";
	ctx.fillText(statusText, panelX + 10, panelY + 70);

	const spriteImg = sprites.images.get(enemy.sprite);
	const spriteSize = INFO_PANEL_SPRITE_SIZE;
	const spriteX = panelX + panelWidth - spriteSize - 8;
	const spriteY = panelY + (panelHeight - spriteSize) / 2;
	if (spriteImg) {
		ctx.drawImage(spriteImg, spriteX, spriteY, spriteSize, spriteSize);
	} else {
		ctx.fillStyle = "green";
		ctx.fillRect(spriteX, spriteY, spriteSize, spriteSize);
	}

	ctx.restore();
}

/**
 * Draw top-left other-player info panel.
 */
export function drawSelectedPlayerPanel(
	ctx: CanvasRenderingContext2D,
	viewport: Viewport,
	player: PlayerPublic,
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
	ctx.fillText(player.name || "Player", panelX + 10, panelY + 22);
	ctx.font = "12px sans-serif";
	ctx.fillText(`Level ${player.level}`, panelX + 10, panelY + 38);
	ctx.fillText(
		`HP: ${player.currHealth}/${player.maxHealth}`,
		panelX + 10,
		panelY + 54,
	);

	ctx.fillStyle = statusText === "In range" ? "lightgreen" : "lightcoral";
	ctx.fillText(statusText, panelX + 10, panelY + 70);

	const spriteImg = sprites.images.get(player.sprite);
	const spriteSize = INFO_PANEL_SPRITE_SIZE;
	const spriteX = panelX + panelWidth - spriteSize - 8;
	const spriteY = panelY + (panelHeight - spriteSize) / 2;
	if (spriteImg) {
		ctx.drawImage(spriteImg, spriteX, spriteY, spriteSize, spriteSize);
	} else {
		ctx.fillStyle = "blue";
		ctx.fillRect(spriteX, spriteY, spriteSize, spriteSize);
	}

	ctx.restore();
}

/**
 * Draw bottom-right self status panel.
 */
export function drawPlayerInfoPanel(
	ctx: CanvasRenderingContext2D,
	viewport: Viewport,
	self: PlayerSelf,
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
}
