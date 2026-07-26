import { wsByPlayerId } from "..";

export function sendWsToPlayer(playerId: string, payload: unknown) {
	const ctx = wsByPlayerId.get(playerId);
	if (!ctx) return;
	if (ctx.ws.readyState !== 1) return;
	try {
		ctx.ws.send(JSON.stringify(payload));
	} catch (err) {
		console.error("Failed to send ws payload", { playerId, payload }, err);
	}
}
