import { serverGameState } from "../state/gameState";
import { loadPlayer } from "../services/loadPlayer";
import { makeGameStateSnapshot } from "../snapshots/makeSnapshot";
import { performAttack } from "../services/combat/performAttack";
import { recalcPlayerDerivedStats } from "../services/progression/recalcPlayerStats";
import { getJwtFromReq, validateJWT } from "@/auth/jwt";
import { config } from "@/config";
import { getUserById } from "@/db/queries/users";
import { calculateApproachCoords } from "@/game/logic/movement/calculateApproachCoords";
import { calculateTargetDistance } from "@/game/logic/movement/calculateTargetDistance";
import type { Request } from "express";
import { WebSocketServer } from "ws";
import { app, wsByPlayerId } from "..";
import { registerHttpRoutes } from "../http/routes";
import { adminChatCommands, type ChatCommandContext } from "../chatCommands";
import {
	initChatService,
	sendChatToPlayer,
	broadcastChatMessage,
} from "../chatService";
import { startTickLoop } from "../loop/startTickLoop";
import { persistAllPlayers, persistPlayer } from "../services/persistPlayer";
import { shutdown } from "../services/shutdown";
import { sendWsToPlayer } from "../ws/sendWsToPlayer";
import { initializeEnemies } from "./initializeEnemies";

export let wss: WebSocketServer | null = null;
export let httpServer: any = null;

export async function startServer() {
	// HTTP routes + static serving
	registerHttpRoutes(app);

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
					console.log("WS message received:", msg);
					const resolvedPlayerId = (ws as any).playerId;
					if (!resolvedPlayerId) return;
					const currentPlayerId: string = resolvedPlayerId;
					switch (msg.type) {
						case "chat": {
							const { text } = msg as { text?: string };
							if (typeof text !== "string" || !text.trim()) {
								break;
							}
							const trimmed = text.trim();
							const isAdminCommand = trimmed.startsWith("$");

							if (isAdminCommand) {
								const withoutPrefix = trimmed.slice(1).trim();
								const parts = withoutPrefix
									.split(/\s+/)
									.filter(Boolean);
								const commandName = parts[0];
								const args = parts.slice(1);
								if (!commandName) {
									sendChatToPlayer(
										currentPlayerId,
										"No command specified after $",
										true,
									);
									break;
								}
								if (commandName === "shutdown") {
									broadcastChatMessage(
										"Server is shutting down...",
										undefined,
										true,
									);
									void shutdown(
										`Requested by ${currentPlayerId}`,
									);
									break;
								}
								const handler =
									adminChatCommands[
										commandName as keyof typeof adminChatCommands
									] ??
									adminChatCommands[commandName as string];
								if (!handler) {
									sendChatToPlayer(
										currentPlayerId,
										`Unknown command: ${commandName}`,
										true,
									);
									break;
								}

								const ctx: ChatCommandContext = {
									playerId: currentPlayerId,
									args,
									reply: (message: string) => {
										sendChatToPlayer(
											currentPlayerId,
											message,
											true,
										);
									},
									broadcast: (message: string) => {
										broadcastChatMessage(
											message,
											undefined,
											true,
										);
									},
								};

								Promise.resolve(handler(ctx)).catch((err) => {
									console.error(
										"Chat command failed",
										{
											playerId: currentPlayerId,
											commandName,
										},
										err,
									);
									const msg =
										err instanceof Error
											? err.message
											: String(err);
									sendChatToPlayer(
										currentPlayerId,
										`Command failed: ${msg}`,
										true,
									);
								});
							} else {
								// Normal player chat: broadcast to everyone, using player name if available
								const p =
									serverGameState.players[currentPlayerId];
								const fromName = p?.name ?? currentPlayerId;
								broadcastChatMessage(trimmed, fromName, false);
							}

							break;
						}
						case "move": {
							const { x, y, enemyId } = msg;
							console.log("WS move", {
								currentPlayerId,
								x,
								y,
								enemyId,
							});
							const player =
								serverGameState.players[currentPlayerId];
							if (!player) break;
							if (typeof enemyId === "number") {
								// Move toward enemy slightly inside attack range
								const enemy = serverGameState.enemies.find(
									(e) => e.id === enemyId,
								);
								if (!enemy) break;
								const approachCoords = calculateApproachCoords(
									player,
									enemy,
								);
								if (approachCoords) {
									[player.targetX, player.targetY] =
										approachCoords;
								}
							} else if (
								typeof x === "number" &&
								typeof y === "number"
							) {
								player.targetX = x;
								player.targetY = y;
							}
							break;
						}
						case "attack": {
							const { enemyId } = msg;
							console.log("WS attack", {
								currentPlayerId,
								enemyId,
								enemyIdType: typeof enemyId,
							});
							if (typeof enemyId !== "number") break;
							serverGameState.selectedTargets[currentPlayerId] =
								enemyId;

							// If out of range, also set a movement target toward the enemy
							const player =
								serverGameState.players[currentPlayerId];
							const enemy = serverGameState.enemies.find(
								(e) => e.id === enemyId,
							);
							console.log("WS attack handler", {
								currentPlayerId,
								enemyId,
								hasPlayer: !!player,
								hasEnemy: !!enemy,
							});
							if (player && enemy) {
								const approachCoords = calculateApproachCoords(
									player,
									enemy,
								);
								if (approachCoords) {
									[player.targetX, player.targetY] =
										approachCoords;
								}
							}
							// Try an immediate attack; subsequent hits handled by server loop
							performAttack(currentPlayerId, enemyId);
							break;
						}
						case "stopAttack": {
							serverGameState.selectedTargets[currentPlayerId] =
								null;
							break;
						}
						case "bonkPlayer": {
							const { targetPlayerId } = msg as {
								targetPlayerId?: string;
							};
							if (
								typeof targetPlayerId !== "string" ||
								!targetPlayerId
							)
								break;
							if (targetPlayerId === currentPlayerId) break;

							const bonker =
								serverGameState.players[currentPlayerId];
							const target =
								serverGameState.players[targetPlayerId];
							if (!bonker || !target) break;

							const distance = calculateTargetDistance(
								bonker,
								target,
							);

							if (distance > bonker.attackRange) {
								break;
							}

							const evt = {
								type: "bonk",
								fromId: currentPlayerId,
								toId: targetPlayerId,
								x: target.x,
								y: target.y,
								timestamp: Date.now(),
							};

							// Both players should see the bonk
							sendWsToPlayer(currentPlayerId, evt);
							sendWsToPlayer(targetPlayerId, evt);

							break;
						}
						case "spendStat": {
							const { stat } = msg as { stat?: string };
							const player =
								serverGameState.players[currentPlayerId];
							if (!player) break;
							if (typeof stat !== "string") break;
							const upper = stat.toUpperCase();
							const allowed = [
								"STR",
								"VIT",
								"DEX",
								"LUK",
								"INT",
								"WIS",
							];
							if (!allowed.includes(upper)) {
								sendChatToPlayer(
									currentPlayerId,
									`Unknown stat: ${stat}`,
									true,
								);
								break;
							}
							if (player.unallocatedPoints <= 0) {
								sendChatToPlayer(
									currentPlayerId,
									"No unallocated stat points available.",
									true,
								);
								break;
							}
							(player as any)[upper] =
								((player as any)[upper] ?? 0) + 1;
							player.unallocatedPoints -= 1;

							// Recalculate derived stats (HP, MP, defense, resistance)
							recalcPlayerDerivedStats(player);

							break;
						}
						default:
							break;
					}
				} catch (err) {
					console.error("WS message error:", err);
				}
			});
		} catch (err) {
			console.error("WS connection error:", err);
		}
	});
}
