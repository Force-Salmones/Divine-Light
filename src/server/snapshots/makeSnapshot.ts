import type {
	GameStateSnapshot,
	PlayerPublic,
} from "@/shared/protocol/gamestate";
import { serverGameState } from "../state/gameState";
import { playerToPublic } from "./playerToPublic";
import { getPlayerFromId } from "../util/getPlayerFromId";
import { getNpcReg } from "../services/npcs/npcRegistry";

/**
 * Builds a per-player snapshot from the authoritative server state.
 * Sent to the browser over WS.
 */

export function makeGameStateSnapshot(playerId: string): GameStateSnapshot {
	const player = getPlayerFromId(playerId);
	if (!player) {
		throw new Error(`Player not found for snapshot: ${playerId}`);
	}

	const players: Record<string, PlayerPublic> = {};

	for (const player in serverGameState.players) {
		if (!serverGameState.players[player]) {
			continue;
		}
		players[player] = playerToPublic(serverGameState.players[player]);
	}

	const npcReg = getNpcReg();

	return {
		players: players,
		enemies: serverGameState.enemies,
		npcs: [...npcReg.values()],
		groundItems: Array.from(serverGameState.groundItems.values()),
		selfId: playerId,
		player: player,
		selectedEnemyId: serverGameState.selectedTargets[playerId] ?? null,
		lastAttackEvents: serverGameState.lastAttackEvents,
		// Temporary for compatibility
		lastAttackEvent: player.lastAttackEvent,
		lastIncomingHit: player.lastIncomingHit,
	};
}
