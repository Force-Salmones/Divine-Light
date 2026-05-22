/**
 * Canvas click handler.
 */

import type { AppContext } from "../appContext.js";
import { screenToWorld } from "../render/viewport.js";
import { getEntityAt } from "./hitTest.js";
import {
	attackEnemy,
	bonkPlayer,
	movePlayer,
	stopAttack,
} from "../actions/gameActions.js";
import {
	isWithinAttackRange,
	isWithinPlayerAttackRange,
} from "../game/range.js";

/**
 * Register the click handler on the game canvas.
 */
export function registerCanvasClickHandler(app: AppContext) {
	app.canvas.addEventListener("click", (event) => {
		const snapshot = app.store.snapshot;
		if (!snapshot) return;

		const pt = screenToWorld(
			app.canvas,
			app.viewport,
			event.clientX,
			event.clientY,
		);

		if (
			pt.x < 0 ||
			pt.y < 0 ||
			pt.x > app.viewport.worldWidth ||
			pt.y > app.viewport.worldHeight
		) {
			// Clicked outside the world (letterboxed area)
			return;
		}

		const x = pt.x;
		const y = pt.y;

		const hit = getEntityAt(snapshot, x, y);

		// Alt+click on empty world space: put coordinates into chat input
		if (event.altKey && !hit) {
			const sx = Math.round(x);
			const sy = Math.round(y);
			app.ui.chat.input.value = `${sx} ${sy}`;
			app.ui.chat.input.focus();
			app.ui.chat.input.select();
			app.ui.chat.append({
				text: `World coords: ${sx} ${sy}`,
				system: true,
				timestamp: Date.now(),
			});
			return;
		}

		if (hit?.type === "enemy") {
			const enemy = snapshot.enemies.find((e) => e.id === hit.id);
			if (!enemy) return;

			// Alt+click: put enemy instance id into chat input
			if (event.altKey) {
				app.ui.chat.input.value = String(enemy.id);
				app.ui.chat.input.focus();
				app.ui.chat.input.select();
				app.ui.chat.append({
					text: `Enemy instance id: ${enemy.id}`,
					system: true,
					timestamp: Date.now(),
				});
				return;
			}

			// Clicking the same enemy twice triggers attack and (if needed) move-to-range.
			if (
				app.store.selectedEntity?.type === "enemy" &&
				app.store.selectedEntity.id === hit.id
			) {
				app.store.selectedEntity = hit;
				app.store.attackTargetEnemyId = enemy.id;
				if (!isWithinAttackRange(snapshot.player, enemy)) {
					movePlayer(app, { enemyId: enemy.id });
				}
				attackEnemy(app, enemy.id);
				return;
			}

			stopAttack(app);
			app.store.selectedEntity = hit;
			return;
		}

		if (hit?.type === "player") {
			stopAttack(app);

			// If clicking the already-targeted player again, attempt a bonk.
			if (
				hit.id !== snapshot.selfId &&
				app.store.selectedEntity?.type === "player" &&
				app.store.selectedEntity.id === hit.id
			) {
				const target = snapshot.players[hit.id];
				if (
					target &&
					isWithinPlayerAttackRange(snapshot.player, target)
				) {
					bonkPlayer(app, hit.id);
				}
				return;
			}

			app.store.selectedEntity = hit;
			return;
		}

		if (hit) {
			stopAttack(app);
			app.store.selectedEntity = hit;
			return;
		}

		// Empty ground click: clear selection and move.
		stopAttack(app);
		app.store.selectedEntity = null;
		movePlayer(app, {
			x: x - snapshot.player.size / 2,
			y: y - snapshot.player.size / 2,
		});
	});
}
