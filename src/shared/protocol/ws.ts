/**
 * Shared WebSocket message types.
 *
 * IMPORTANT: This module must stay platform-agnostic (no imports from server/client code).
 */

import type { EquipmentSlotKey } from "../items/inventory.js";
import type { ItemId } from "../items/itemTypes.js";
import type { SkillId } from "../skills/skillTypes.js";
import type { GameStateSnapshot, StatKey } from "./gamestate.js";

export type SlotContainer = "inventory" | "bank" | "equipment";

export type SlotRef =
	| {
			from: "inventory" | "bank";
			slotIndex: number;
	  }
	| {
			from: "equipment";
			slotKey: EquipmentSlotKey;
	  };

export type ClientToServerMessage =
	| { type: "chat"; text: string }
	| { type: "move"; x: number; y: number }
	| { type: "move"; enemyId: number }
	| { type: "attack"; enemyId: number }
	| { type: "stopAttack" }
	| { type: "bonkPlayer"; targetPlayerId: string }
	| { type: "spendStat"; stat: StatKey }
	| { type: "levelUpSkill"; id: SkillId }
	| { type: "pickupItem"; groundItemId?: string }
	| { type: "dropItem"; slot: SlotRef }
	| { type: "swapItem"; a: SlotRef; b: SlotRef }
	| { type: "openBank" }
	| { type: "closeBank" }
	| {
			type: "activate";
			source: ActivateSource;
			target?: ActivateTarget;
	  }
	| {
			type: "bindHotbar";
			toIndex: number;
			source:
				| { kind: "inventory"; slotIndex: number }
				| { kind: "skillBook"; skillId: SkillId };
	  }
	| { type: "clearHotbar"; index: number };

export type ActivateTarget =
	| { kind: "self" }
	| { kind: "player"; playerId: string }
	| { kind: "enemy"; enemyId: number }
	| { kind: "position"; x: number; y: number };

export type ActivateSource =
	| { kind: "itemId"; itemId: ItemId }
	| { kind: "inventorySlot"; slot: SlotRef }
	| { kind: "skillId"; skillId: SkillId }
	| { kind: "hotbar"; index: number };

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
