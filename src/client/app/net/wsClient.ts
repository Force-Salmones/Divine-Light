/**
 * WebSocket client for the game.
 *
 * Provides reconnect and a send queue so UI/input code can call send() before the
 * socket is open.
 */

import type {
	ClientToServerMessage,
	ServerToClientMessage,
} from "../../../shared/protocol/ws.js";

export type WsClient = {
	/** Connect to the server's WS endpoint. */
	connect: () => void;
	/** Send a message, queueing if not connected yet. */
	send: (msg: ClientToServerMessage) => void;
	/** Close the socket (best-effort). */
	close: () => void;
};

export type WsClientHandlers = {
	onMessage: (msg: ServerToClientMessage) => void | Promise<void>;
	onOpen?: () => void;
	onClose?: () => void;
};

/**
 * Create a WS client connecting to /ws on the current host.
 */
export function createWsClient(handlers: WsClientHandlers): WsClient {
	let socket: WebSocket | null = null;
	const pending: ClientToServerMessage[] = [];

	function send(msg: ClientToServerMessage) {
		if (socket && socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify(msg));
			return;
		}
		pending.push(msg);
	}

	function connect() {
		const protocol = window.location.protocol === "https:" ? "wss" : "ws";
		const url = `${protocol}://${window.location.host}/ws`;

		if (socket) {
			try {
				socket.close();
			} catch {}
		}

		socket = new WebSocket(url);

		socket.onopen = () => {
			handlers.onOpen?.();
			while (pending.length) {
				const msg = pending.shift();
				if (!msg) continue;
				try {
					socket?.send(JSON.stringify(msg));
				} catch {}
			}
		};

		socket.onmessage = async (event) => {
			try {
				const parsed = JSON.parse(event.data) as ServerToClientMessage;
				await handlers.onMessage(parsed);
			} catch (err) {
				console.error("WS message parse error:", err);
			}
		};

		socket.onclose = () => {
			handlers.onClose?.();
			console.warn("Game websocket closed, reconnecting in 1s...");
			window.setTimeout(connect, 1000);
		};

		socket.onerror = (event) => {
			console.error("Game websocket error:", event);
		};
	}

	function close() {
		try {
			socket?.close();
		} catch {}
		socket = null;
	}

	return { connect, send, close };
}
