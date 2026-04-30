import { wsByPlayerId } from "..";


export function sendWsToPlayer(playerId: string, payload: any) {
    const ws = wsByPlayerId.get(playerId);
    if (!ws) return;
    if (ws.readyState !== 1) return;
    try {
        ws.send(JSON.stringify(payload));
    } catch (err) {
        console.error("Failed to send ws payload", { playerId, payloadType: payload?.type }, err);
    }
}
