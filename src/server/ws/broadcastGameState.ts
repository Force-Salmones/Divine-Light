import { makeGameStateSnapshot } from "../snapshots/makeSnapshot";
import { wss } from "../init/startServer";
import { wsByPlayerId } from "..";

export function broadcastGameState() {
	if (!wss) return;

	wss.clients.forEach((client) => {
		try {
			if (client.readyState !== 1) return;

			// Find the playerId for this WebSocket via wsByPlayerId
			let pid: string | undefined;
			for (const [playerId, ctx] of wsByPlayerId.entries()) {
				if (ctx.ws === client) {
					pid = playerId;
					break;
				}
			}
			if (!pid) return;

			const snapshot = makeGameStateSnapshot(pid);
			client.send(
				JSON.stringify({ type: "gameState", gameState: snapshot }),
			);
		} catch (err) {
			console.error("Failed to broadcast snapshot", err);
		}
	});
}
