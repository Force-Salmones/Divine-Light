/**
 * Client-side state store.
 *
 * Stores the latest server snapshot plus client-only UI state such as selection,
 * toggles, and dedupe baselines for spawning floating text.
 */

import type { GameStateSnapshot } from "../../../shared/protocol/gamestate.js";

export type SelectedEntity =
	| { type: "player"; id: string }
	| { type: "enemy"; id: number }
	| null;

export type ClientStore = {
	/** Latest snapshot received from the server. */
	snapshot: GameStateSnapshot | null;

	/** Current selected entity for top-left panel and selection outline. */
	selectedEntity: SelectedEntity;

	/** Enemy instance id currently being auto-attacked. */
	attackTargetEnemyId: number | null;

	/** Whether to render other players' outgoing damage numbers. */
	showOtherPlayersDamage: boolean;

	/** Whether snapshot combat baselines have been initialized. */
	hasInitializedCombatHistory: boolean;

	/** Dedupe baseline for self outgoing hit events. */
	lastProcessedAttackTimestamp: number;

	/** Dedupe baseline for self incoming hit events. */
	lastProcessedIncomingHitTimestamp: number;

	/** Dedupe baseline for other-player outgoing hit events. */
	lastProcessedOtherAttackEventTimestamp: number;

	/** Key cache to avoid duplicate spawns for other-player events (pruned). */
	processedOtherAttackEventKeys: Map<string, number>;

	showFpsCounter: boolean;

	fps: number;
};

/**
 * Create a new store initialized from localStorage.
 */
export function createClientStore(): ClientStore {
	return {
		snapshot: null,
		selectedEntity: null,
		attackTargetEnemyId: null,
		showOtherPlayersDamage:
			(localStorage.getItem("showOtherPlayersDamage") ?? "0") === "1",
		hasInitializedCombatHistory: false,
		lastProcessedAttackTimestamp: 0,
		lastProcessedIncomingHitTimestamp: 0,
		lastProcessedOtherAttackEventTimestamp: 0,
		processedOtherAttackEventKeys: new Map<string, number>(),
		showFpsCounter: false,
		fps: 0,
	};
}
