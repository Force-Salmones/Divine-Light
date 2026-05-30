import { serverGameState, type Player } from "../state/gameState";

export function getPlayerFromId(id: string): Player | undefined {
	if (!id) {
		console.warn(`Invalid id in getPlayerFromId: "${id}"`);
		return undefined;
	}
	return serverGameState.players[id];
}
