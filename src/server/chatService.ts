import type { WebSocket, WebSocketServer } from "ws";

let wssRef: WebSocketServer | null = null;

export function initChatService(wss: WebSocketServer) {
	wssRef = wss;
}

type RawChatPayload = {
	type: "chat";
	from?: string;
	text: string;
	system: boolean;
	timestamp: number;
};

export function broadcastChatMessage(
	text: string,
	from?: string,
	system = false,
) {
	if (!wssRef) return;
	const payload: RawChatPayload = {
		type: "chat",
		from,
		text,
		system,
		timestamp: Date.now(),
	};
	const json = JSON.stringify(payload);
	wssRef.clients.forEach((client: WebSocket) => {
		if (client.readyState === 1) {
			client.send(json);
		}
	});
}

export function sendChatToPlayer(
	playerId: string,
	text: string,
	system = true,
) {
	if (!wssRef) return;
	const payload: RawChatPayload = {
		type: "chat",
		from: undefined,
		text,
		system,
		timestamp: Date.now(),
	};
	const json = JSON.stringify(payload);
	wssRef.clients.forEach((client: WebSocket) => {
		if (client.readyState === 1 && client.playerId === playerId) {
			client.send(json);
		}
	});
}
