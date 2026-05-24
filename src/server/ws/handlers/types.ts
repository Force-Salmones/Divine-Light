import type WebSocket from "ws";

export type WsHandlerContext = {
	ws: WebSocket;
	playerId: string;
};
