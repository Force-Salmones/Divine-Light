/**
 * Main frame renderer.
 */

import type { AppContext } from "../appContext.js";
import { setUiTransform, setWorldTransform } from "./viewport.js";
import {
	drawAttackRangeCircle,
	drawNameTag,
	drawOutline,
} from "./primitives.js";
import { renderFloatingTexts } from "../effects/floatingText.js";
import { drawPlayerInfoPanel, drawSelectedEntityPanel } from "./uiPanels.js";
import {
	isWithinAttackRange,
	isWithinPlayerAttackRange,
} from "../game/range.js";
const ITEM_SIZE = 16;
//import { ITEM_SIZE } from "../../../constants.js";

/**
 * Render one animation frame.
 */
export function renderFrame(app: AppContext) {
	const snapshot = app.store.snapshot;
	if (!snapshot) return;

	const { ctx, canvas, viewport } = app;

	// Clear
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Letterbox background
	setUiTransform(ctx, viewport);
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, viewport.canvasCssWidth, viewport.canvasCssHeight);

	// --- World ---
	setWorldTransform(ctx, viewport);
	ctx.drawImage(
		app.worldImage,
		0,
		0,
		viewport.worldWidth,
		viewport.worldHeight,
	);

	const showAttackRange =
		app.store.selectedEntity?.type === "enemy" ||
		app.store.selectedEntity?.type === "player" ||
		app.store.attackTargetEnemyId !== null;
	if (showAttackRange) {
		drawAttackRangeCircle(
			ctx,
			snapshot.player.x,
			snapshot.player.y,
			snapshot.player.size,
			snapshot.player.attackRange,
		);
	}

	// Enemies
	for (const e of snapshot.enemies) {
		const img = app.sprites.images.get(e.sprite);
		if (img) {
			ctx.drawImage(img, e.x, e.y, e.size, e.size);
		} else {
			ctx.fillStyle = "green";
			ctx.fillRect(e.x, e.y, e.size, e.size);
		}
		if (
			app.store.selectedEntity?.type === "enemy" &&
			app.store.selectedEntity.id === e.id
		) {
			drawOutline(ctx, e.x, e.y, e.size, e.size);
		}
	}

	// Ground items
	for (const gi of snapshot.groundItems ?? []) {
		const sprite = `/assets/items/${gi.itemId}.png`;
		const img = app.sprites.images.get(sprite);
		if (img) ctx.drawImage(img, gi.x, gi.y, ITEM_SIZE, ITEM_SIZE);
		else {
			ctx.fillStyle = "rgba(255,255,0,0,0.8)";
			ctx.fillRect(gi.x, gi.y, ITEM_SIZE, ITEM_SIZE);
		}
	}

	// Npcs
	for (const npc of snapshot.npcs ?? []) {
		const sprite = `/assets/npcs/${npc.id}.png`;
		const img = app.sprites.images.get(sprite);
		if (img) ctx.drawImage(img, npc.x, npc.y, npc.size, npc.size);
		else {
			ctx.fillStyle = "rgba(0,255,255,0,0.8)";
			ctx.fillRect(npc.x, npc.y, npc.size, npc.size);
		}
	}

	// Other players
	for (const p of Object.values(snapshot.players ?? {})) {
		if (p.id === snapshot.selfId) continue;

		const img = app.sprites.images.get(p.sprite);
		if (img) {
			ctx.drawImage(img, p.x, p.y, p.size, p.size);
		} else {
			ctx.fillStyle = "rgba(0, 140, 255, 0.65)";
			ctx.fillRect(p.x, p.y, p.size, p.size);
		}

		if (p.name) drawNameTag(ctx, p.x, p.y, p.size, p.name);

		if (
			app.store.selectedEntity?.type === "player" &&
			app.store.selectedEntity.id === p.id
		) {
			drawOutline(ctx, p.x, p.y, p.size, p.size);
		}
	}

	// Self
	const selfImg = app.sprites.images.get(snapshot.player.sprite);
	if (selfImg) {
		ctx.drawImage(
			selfImg,
			snapshot.player.x,
			snapshot.player.y,
			snapshot.player.size,
			snapshot.player.size,
		);
	} else {
		ctx.fillStyle = "blue";
		ctx.fillRect(
			snapshot.player.x,
			snapshot.player.y,
			snapshot.player.size,
			snapshot.player.size,
		);
	}
	if (snapshot.player.name)
		drawNameTag(
			ctx,
			snapshot.player.x,
			snapshot.player.y,
			snapshot.player.size,
			snapshot.player.name,
		);
	if (
		app.store.selectedEntity?.type === "player" &&
		app.store.selectedEntity.id === snapshot.selfId
	) {
		drawOutline(
			ctx,
			snapshot.player.x,
			snapshot.player.y,
			snapshot.player.size,
			snapshot.player.size,
		);
	}

	// Floating texts
	renderFloatingTexts(ctx, app.floatingText);

	// --- UI space ---

	// Selected Entity Panel
	setUiTransform(ctx, viewport);
	const sel = app.store.selectedEntity;
	if (sel?.type === "enemy") {
		const enemy = snapshot.enemies.find((e) => e.id === sel.id);
		if (enemy) {
			const inRange = isWithinAttackRange(snapshot.player, enemy);
			drawSelectedEntityPanel(
				ctx,
				viewport,
				enemy,
				"enemy",
				app.sprites,
				inRange ? "In range" : "Out of range",
			);
		}
	} else if (sel?.type === "player") {
		const player = snapshot.players[sel.id];
		if (player && player.id !== snapshot.selfId) {
			const inRange = isWithinPlayerAttackRange(snapshot.player, player);
			drawSelectedEntityPanel(
				ctx,
				viewport,
				player,
				"player",
				app.sprites,
				inRange ? "In range" : "Out of range",
			);
		}
	}

	drawPlayerInfoPanel(ctx, viewport, snapshot.player, app.sprites);

	// FPS counter
	if (app.store.showFpsCounter) {
		ctx.save();
		ctx.font = "12px comic-sans-ms";
		ctx.textAlign = "right";

		const text = `FPS: ${Math.round(app.store.fps)}`;
		const x = viewport.canvasCssWidth - 10;
		const y = 20;

		ctx.fillText(text, x, y);
		ctx.restore();
	}
}
