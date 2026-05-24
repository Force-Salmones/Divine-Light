/**
 * Client-side actions that send intents to the server.
 */

import type { AppContext } from "../appContext.js";
import type { StatKey } from "../../../shared/protocol/gamestate.js";

/**
 * Send a chat message.
 */
export function sendChat(app: AppContext, text: string) {
	app.ws.send({ type: "chat", text });
}

/**
 * Ask the server to move the player.
 */
export function movePlayer(
	app: AppContext,
	options: { x: number; y: number } | { enemyId: number },
) {
	if ("enemyId" in options) {
		app.ws.send({ type: "move", enemyId: options.enemyId });
		return;
	}
	app.ws.send({ type: "move", x: options.x, y: options.y });
}

/**
 * Start (or refresh) auto-attack against an enemy instance.
 */
export function attackEnemy(app: AppContext, enemyId: number) {
	app.store.attackTargetEnemyId = enemyId;
	app.ws.send({ type: "attack", enemyId });
}

/**
 * Stop auto-attack.
 */
export function stopAttack(app: AppContext) {
	app.store.attackTargetEnemyId = null;
	app.ws.send({ type: "stopAttack" });
}

/**
 * Spend an unallocated stat point.
 */
export function spendStat(app: AppContext, stat: StatKey) {
	app.ws.send({ type: "spendStat", stat });
}

/**
 * Attempt to bonk another player.
 */
export function bonkPlayer(app: AppContext, targetPlayerId: string) {
	app.ws.send({ type: "bonkPlayer", targetPlayerId });
}

/**
 * Loot nearest item in range (if any)
 */
export function pickupItem(app: AppContext) {
	app.ws.send({ type: "pickupItem" });
}
