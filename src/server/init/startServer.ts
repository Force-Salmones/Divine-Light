import { serverGameState } from "../state/gameState";
import { loadPlayer } from "../services/loadPlayer";
import { makeGameStateSnapshot } from "../snapshots/makeSnapshot";
import { getJwtFromReq, validateJWT } from "@/auth/jwt";
import { config } from "@/config";
import { getUserById } from "@/db/queries/users";
import type { Request } from "express";
import { WebSocketServer } from "ws";
import { app, wsByPlayerId } from "..";
import { registerHttpRoutes } from "../http/routes";
import { initChatService } from "../chatService";
import { startTickLoop } from "../loop/startTickLoop";
import { persistAllPlayers, persistPlayer } from "../services/persistPlayer";
import { initializeEnemies } from "./initializeEnemies";
import { dispatchWsMessage } from "../ws/handlers";
import type { WsHandlerContext } from "../ws/handlers/types";
import { loadItemRegistry } from "../services/items/itemRegistry";
import { loadMobRegistry } from "../services/mobs/mobsRegistry";

export let wss: WebSocketServer | null = null;
export let httpServer: any = null;

export async function startServer() {
	// HTTP routes + static serving
	registerHttpRoutes(app);

	await loadMobRegistry();
	await loadItemRegistry();
	await initializeEnemies();
	startTickLoop();

	// Periodic persistence of all online players (every 60 seconds)
	setInterval(() => {
		void persistAllPlayers();
	}, 60000);

	const server = app.listen(+config.server_port, () => {
		console.log(`Server is running on port ${config.server_port}`);
	});
	httpServer = server;

	// Attach WebSocket server for gameplay on the same HTTP server
	wss = new WebSocketServer({ server, path: "/ws" });
	initChatService(wss);

	wss.on("connection", async (ws: any, req: any) => {
		try {
			// Authenticate using JWT (cookie preferred)
			const token = getJwtFromReq(req as Request);
			if (!token) {
				ws.close(1008, "Unauthorized");
				return;
			}

			let userId: string;
			try {
				userId = validateJWT(token, config.jwt_secret);
			} catch {
				ws.close(1008, "Unauthorized");
				return;
			}

			const dbUser = await getUserById(userId);
			if (!dbUser) {
				ws.close(1008, "Unauthorized");
				return;
			}

			// Load or reuse player
			let player = serverGameState.players[userId];
			if (!player) {
				player = await loadPlayer(userId);
				if (!player) {
					ws.close(1011, "Failed to load player");
					return;
				}
				serverGameState.players[player.id] = player;
				serverGameState.selectedTargets[player.id] = null;
			}

			// Only allow one active WS per playerId (prevents multi-tab fights over the same character)
			const existing = wsByPlayerId.get(player.id);
			if (existing && existing !== ws) {
				try {
					existing.close(4000, "Logged in elsewhere");
				} catch {}
			}
			wsByPlayerId.set(player.id, ws);

			(ws as any).playerId = player.id;

			// Send initial per-client snapshot
			ws.send(
				JSON.stringify({
					type: "gameState",
					gameState: makeGameStateSnapshot(player.id),
				}),
			);

			ws.on("close", () => {
				const pid: string | undefined = (ws as any).playerId;
				if (!pid) return;

				// Only clean up if THIS ws is still the active one for the playerId
				if (wsByPlayerId.get(pid) === ws) {
					wsByPlayerId.delete(pid);

					void persistPlayer(pid);

					// Remove player from the in-memory world on disconnect
					delete serverGameState.players[pid];
					delete serverGameState.selectedTargets[pid];
				} else {
					// Replaced by a newer connection; don't delete state
					void persistPlayer(pid);
				}
			});

			ws.on("message", (raw: any) => {
				try {
					const msg = JSON.parse(raw.toString());
					const resolvedPlayerId = (ws as any).playerId;
					if (!resolvedPlayerId) return;
					const currentPlayerId: string = resolvedPlayerId;
					const ctx: WsHandlerContext = {
						ws: ws,
						playerId: currentPlayerId,
					};
					dispatchWsMessage(ctx, msg);
				} catch (err) {
					console.error("WS message error:", err);
				}
			});
		} catch (err) {
			console.error("WS connection error:", err);
		}
	});
}
