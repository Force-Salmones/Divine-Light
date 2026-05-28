/**
 * Snapshot application.
 *
 * Converts incoming snapshots into store updates, spawns floating texts, and refreshes
 * open UI panels.
 */

import type { AppContext } from "../appContext.js";
import type { GameStateSnapshot } from "../../../shared/protocol/gamestate.js";
import { refreshSpritesIfNeeded } from "../assets/spriteCache.js";
import { spawnFloatingText } from "../effects/floatingText.js";
import { attackEnemy, stopAttack } from "../actions/gameActions.js";
import { isWithinAttackRange } from "../game/range.js";
import { isOptionsPanelVisible } from "../ui/optionsPanel.js";
import { isStatsPanelVisible } from "../ui/statsPanel.js";
import { isInventoryPanelVisible } from "../ui/inventoryPanel.js";

/**
 * Apply a new snapshot from the server.
 */
export async function applySnapshot(
	app: AppContext,
	snapshot: GameStateSnapshot,
) {
	// Defensive defaults (older save data)
	if ((snapshot.player as any).speed === undefined)
		(snapshot.player as any).speed = 120;
	if ((snapshot.player as any).attackRange === undefined)
		(snapshot.player as any).attackRange = 48;
	if ((snapshot.player as any).attackSpeed === undefined)
		(snapshot.player as any).attackSpeed = 1;

	app.store.snapshot = snapshot;
	await refreshSpritesIfNeeded(app.sprites, snapshot);

	// Initialize dedupe baselines on first snapshot
	if (!app.store.hasInitializedCombatHistory) {
		if (snapshot.lastAttackEvent) {
			app.store.lastProcessedAttackTimestamp =
				snapshot.lastAttackEvent.timestamp;
		}
		if (snapshot.lastIncomingHit) {
			app.store.lastProcessedIncomingHitTimestamp =
				snapshot.lastIncomingHit.timestamp;
		}

		const initEvents = snapshot.lastAttackEvents ?? [];
		if (initEvents.length) {
			app.store.lastProcessedOtherAttackEventTimestamp = Math.max(
				...initEvents.map((e) => e.timestamp ?? 0),
			);
		}

		app.store.hasInitializedCombatHistory = true;
	}

	// Self outgoing damage number
	if (
		snapshot.lastAttackEvent &&
		snapshot.lastAttackEvent.timestamp >
			app.store.lastProcessedAttackTimestamp
	) {
		app.store.lastProcessedAttackTimestamp =
			snapshot.lastAttackEvent.timestamp;
		const evt = snapshot.lastAttackEvent;
		const enemySize =
			snapshot.enemies.find((e) => e.id === evt.enemyId)?.size ?? 12;
		spawnFloatingText(app.floatingText, {
			x: evt.x + enemySize / 2,
			y: evt.y,
			text: String(evt.damage),
			color: "white",
			kind: "damage",
			timestamp: evt.timestamp,
		});

		if (evt.enemyDead) {
			stopAttack(app);
			if (
				app.store.selectedEntity?.type === "enemy" &&
				app.store.selectedEntity.id === evt.enemyId
			) {
				app.store.selectedEntity = null;
			}
		}
	}

	// Incoming damage number
	if (
		snapshot.lastIncomingHit &&
		snapshot.lastIncomingHit.timestamp >
			app.store.lastProcessedIncomingHitTimestamp
	) {
		app.store.lastProcessedIncomingHitTimestamp =
			snapshot.lastIncomingHit.timestamp;
		const hit = snapshot.lastIncomingHit;
		spawnFloatingText(app.floatingText, {
			x: hit.x + snapshot.player.size / 2,
			y: hit.y,
			text: String(hit.damage),
			color: "red",
			kind: "damage",
			timestamp: hit.timestamp,
		});
	}

	// Other-player damage numbers (optional)
	if (app.store.showOtherPlayersDamage) {
		const now = Date.now();
		const events = snapshot.lastAttackEvents ?? [];

		// prune processed keys (keep ~10s)
		for (const [
			k,
			ts,
		] of app.store.processedOtherAttackEventKeys.entries()) {
			if (now - ts > 10_000)
				app.store.processedOtherAttackEventKeys.delete(k);
		}

		for (const evt of events) {
			if (evt.playerId === snapshot.selfId) continue;
			if (typeof evt.damage !== "number" || evt.damage <= 0) continue;
			if (
				evt.timestamp < app.store.lastProcessedOtherAttackEventTimestamp
			)
				continue;

			const key = `${evt.timestamp}:${evt.playerId}:${evt.enemyId}:${evt.damage}`;
			if (app.store.processedOtherAttackEventKeys.has(key)) continue;
			app.store.processedOtherAttackEventKeys.set(key, evt.timestamp);

			const enemySize =
				snapshot.enemies.find((e) => e.id === evt.enemyId)?.size ?? 12;
			spawnFloatingText(app.floatingText, {
				x: evt.x + enemySize,
				y: evt.y,
				text: String(evt.damage),
				color: "#d0d0d0",
				kind: "damage",
				timestamp: evt.timestamp,
			});
		}

		if (events.length) {
			const maxTs = Math.max(...events.map((e) => e.timestamp ?? 0));
			if (maxTs > app.store.lastProcessedOtherAttackEventTimestamp) {
				app.store.lastProcessedOtherAttackEventTimestamp = maxTs;
			}
		}
	}

	// Attack target sanity: if target no longer exists, stop.
	if (app.store.attackTargetEnemyId !== null) {
		const enemy = snapshot.enemies.find(
			(e) => e.id === app.store.attackTargetEnemyId,
		);
		if (!enemy) {
			stopAttack(app);
		} else if (isWithinAttackRange(snapshot.player, enemy)) {
			// Refresh attack intent when in range
			attackEnemy(app, enemy.id);
		}
	}

	// Update panels if visible
	if (isStatsPanelVisible(app.ui.stats)) {
		app.ui.stats.update(snapshot);
	}
	if (isOptionsPanelVisible(app.ui.options)) {
		app.ui.options.update(snapshot);
	}
	if (isInventoryPanelVisible(app.ui.inventory)) {
		app.ui.inventory.update(snapshot);
	}
}
