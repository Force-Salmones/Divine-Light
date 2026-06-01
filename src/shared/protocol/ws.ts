/**
 * Shared WebSocket message types.
 *
 * IMPORTANT: This module must stay platform-agnostic (no imports from server/client code).
 */

import type { GameStateSnapshot, StatKey } from "./gamestate.js";

export type SlotContainer = "inventory" | "bank";

export type SlotRef = {
	from: SlotContainer;
	slotIndex: number;
};

export type ClientToServerMessage =
	| { type: "chat"; text: string }
	| { type: "move"; x: number; y: number }
	| { type: "move"; enemyId: number }
	| { type: "attack"; enemyId: number }
	| { type: "stopAttack" }
	| { type: "bonkPlayer"; targetPlayerId: string }
	| { type: "spendStat"; stat: StatKey }
	| { type: "pickupItem"; groundItemId?: string }
	| { type: "dropItem"; slot: SlotRef }
	| { type: "swapItem"; a: SlotRef; b: SlotRef }
	| { type: "openBank" }
	| { type: "closeBank" };

export type ServerToClientMessage =
	| { type: "gameState"; gameState: GameStateSnapshot }
	| {
			type: "chat";
			text: string;
			from?: string;
			system?: boolean;
			timestamp: number;
	  }
	| {
			type: "bonk";
			fromId: string;
			toId: string;
			x: number;
			y: number;
			timestamp: number;
	  };
