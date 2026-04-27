import express from "express";
import type { Request, Response } from "express";
import { config } from "../config";
import { handlerMovePlayer } from "../api/handlerMovePlayer";
import { handlerAttackEnemy } from "../api/handlerAttackEnemy";
import { updateServerMovement, updateAutomaticAttack } from "./updateServerMovement";
import { gameState } from "../api/gamestate";

import { loadPlayer } from "../api/loadPlayer";
import { loadEnemy } from "../api/loadEnemy";
import { middlewareLogResponses } from "./middleware";
import { handlerCreateUser } from "../api/handlerCreateUser";
import { performAttack } from "../api/performAttack";
import { WebSocketServer } from "ws";
import { getAllMobs } from "@/db/queries/mobs";
import { adminChatCommands, type ChatCommandContext } from "./chatCommands";
import { initChatService, broadcastChatMessage, sendChatToPlayer } from "./chatService";

const app = express();

const TICK_INTERVAL_MS = 100;
let lastTick = Date.now();
let wss: WebSocketServer | null = null;

function broadcastGameState() {
    if (!wss) return;
    const payload = JSON.stringify({ type: "gameState", gameState });
    wss.clients.forEach((client: any) => {
        if (client.readyState === 1) {
            client.send(payload);
        }
    });
}

function startTickLoop() {
    setInterval(() => {
        const now = Date.now();
        const deltaSeconds = (now - lastTick) / 1000;
        lastTick = now;
        updateServerMovement(deltaSeconds);
        updateAutomaticAttack();
        broadcastGameState();
    }, TICK_INTERVAL_MS);
}

async function initializeGameState() {
    const player = await loadPlayer("536b2e83-2a1a-4b80-b264-d18be01be7c5");
    if (!player) {
        throw new Error("Failed to load the default player from the database");
    }

    const dbMobs = await getAllMobs();
    const enemies = await Promise.all(dbMobs.map((mob) => loadEnemy(mob)));
    gameState.enemies = enemies;

    // Initialize multiplayer-aware state
    gameState.players[player.id] = player;
    gameState.selfId = player.id; // dev only; single session controls this player

    // Back-compat aliases for current client
    gameState.player = player;
    // Initialize selected target for this player explicitly
    (gameState.selectedTargets as any)[player.id] = null;
    gameState.selectedEnemyId = null;
}

async function startServer() {
    await initializeGameState();
    startTickLoop();
    const server = app.listen(+config.server_port, () => {
        console.log(`Server is running on port ${config.server_port}`);
    });

    // Attach WebSocket server for gameplay on the same HTTP server
    wss = new WebSocketServer({ server, path: "/ws" });
    initChatService(wss);

    wss.on("connection", (ws: any, req) => {
        try {
            const url = new URL(req.url ?? "/ws", `http://${req.headers.host}`);
            const qpPlayerId = url.searchParams.get("playerId") ?? undefined;
            const playerId = qpPlayerId ?? gameState.selfId ?? Object.keys(gameState.players)[0];
            (ws as any).playerId = playerId;
            // Send initial snapshot
            ws.send(JSON.stringify({ type: "gameState", gameState }));

            ws.on("message", (raw: any) => {
                try {
                    const msg = JSON.parse(raw.toString());
                    console.log("WS message received:", msg);
                    const resolvedPlayerId = (ws as any).playerId ?? gameState.selfId ?? Object.keys(gameState.players)[0];
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
                                const parts = withoutPrefix.split(/\s+/).filter(Boolean);
                                const commandName = parts[0];
                                const args = parts.slice(1);
                                if (!commandName) {
                                    sendChatToPlayer(currentPlayerId, "No command specified after $", true);
                                    break;
                                }
                                const handler = adminChatCommands[commandName as keyof typeof adminChatCommands] ?? adminChatCommands[commandName as string];
                                if (!handler) {
                                    sendChatToPlayer(currentPlayerId, `Unknown command: ${commandName}`, true);
                                    break;
                                }

                                const ctx: ChatCommandContext = {
                                    playerId: currentPlayerId,
                                    args,
                                    reply: (message: string) => {
                                        sendChatToPlayer(currentPlayerId, message, true);
                                    },
                                    broadcast: (message: string) => {
                                        broadcastChatMessage(message, undefined, true);
                                    },
                                };

                                void handler(ctx);
                            } else {
                                // Normal player chat: broadcast to everyone, using player name if available
                                const p = gameState.players[currentPlayerId] ?? gameState.player;
                                const fromName = p?.name ?? currentPlayerId;
                                broadcastChatMessage(trimmed, fromName, false);
                            }

                            break;
                        }
                        case "move": {
                            const { x, y, enemyId } = msg;
                            console.log("WS move", { currentPlayerId, x, y, enemyId });
                            const player = gameState.players[currentPlayerId] ?? gameState.player;
                            if (!player) break;
                            if (typeof enemyId === "number") {
                                // Move toward enemy slightly inside attack range
                                const enemy = gameState.enemies.find(e => e.id === enemyId);
                                if (!enemy) break;
                                console.log("WS move towards enemy", { currentPlayerId, enemyId, playerPos: { x: player.x, y: player.y }, enemyPos: { x: enemy.x, y: enemy.y } });
                                const playerCenterX = player.x + 16;
                                const playerCenterY = player.y + 16;
                                const enemyCenterX = enemy.x + 12;
                                const enemyCenterY = enemy.y + 12;
                                const dx = enemyCenterX - playerCenterX;
                                const dy = enemyCenterY - playerCenterY;
                                const distance = Math.hypot(dx, dy);
                                const approachMargin = 3;
                                const desiredDistance = Math.max(0, player.attackRange - approachMargin);
                                // If we're already within (or closer than) the desired distance,
                                // don't set a new movement target (prevents overshooting toward 0,0)
                                if (distance === 0 || distance <= desiredDistance) {
                                    console.log("WS move: already within desired distance", { distance, desiredDistance });
                                    delete player.targetX;
                                    delete player.targetY;
                                    break;
                                }
                                const ratio = (distance - desiredDistance) / distance;
                                const targetCenterX = playerCenterX + dx * ratio;
                                const targetCenterY = playerCenterY + dy * ratio;
                                player.targetX = targetCenterX - 16;
                                player.targetY = targetCenterY - 16;
                                console.log("WS move: set target", { targetX: player.targetX, targetY: player.targetY });
                            } else if (typeof x === "number" && typeof y === "number") {
                                player.targetX = x;
                                player.targetY = y;
                            }
                            // Keep alias updated
                            if (gameState.selfId && gameState.selfId === currentPlayerId) {
                                gameState.player = player;
                            }
                            break;
                        }
                        case "attack": {
                            const { enemyId } = msg;
                            console.log("WS attack", { currentPlayerId, enemyId, enemyIdType: typeof enemyId });
                            if (typeof enemyId !== "number") break;
                            (gameState.selectedTargets as any)[currentPlayerId] = enemyId;
                            if (gameState.selfId === currentPlayerId) {
                                gameState.selectedEnemyId = enemyId;
                            }
                            // If out of range, also set a movement target toward the enemy
                            const player = gameState.players[currentPlayerId] ?? gameState.player;
                            const enemy = gameState.enemies.find(e => e.id === enemyId);
                            console.log("WS attack handler", { currentPlayerId, enemyId, hasPlayer: !!player, hasEnemy: !!enemy });
                            if (player && enemy) {
                                const playerCenterX = player.x + 16;
                                const playerCenterY = player.y + 16;
                                const enemyCenterX = enemy.x + 12;
                                const enemyCenterY = enemy.y + 12;
                                const dx = enemyCenterX - playerCenterX;
                                const dy = enemyCenterY - playerCenterY;
                                const distance = Math.hypot(dx, dy);
                                const approachMargin = 3;
                                const desiredDistance = Math.max(0, player.attackRange - approachMargin);
                                if (distance > desiredDistance && distance > 0) {
                                    const ratio = (distance - desiredDistance) / distance;
                                    const targetCenterX = playerCenterX + dx * ratio;
                                    const targetCenterY = playerCenterY + dy * ratio;
                                    player.targetX = targetCenterX - 16;
                                    player.targetY = targetCenterY - 16;
                                    if (gameState.selfId && gameState.selfId === currentPlayerId) {
                                        gameState.player = player;
                                    }
                                }
                            }
                            // Try an immediate attack; subsequent hits handled by server loop
                            performAttack(currentPlayerId, enemyId);
                            break;
                        }
                        case "stopAttack": {
                            (gameState.selectedTargets as any)[currentPlayerId] = null;
                            if (gameState.selfId === currentPlayerId) {
                                gameState.selectedEnemyId = null;
                            }
                            break;
                        }
                        case "spendStat": {
                            const { stat } = msg as { stat?: string };
                            const player = gameState.players[currentPlayerId] ?? gameState.player;
                            if (!player) break;
                            if (typeof stat !== "string") break;
                            const upper = stat.toUpperCase();
                            const allowed = ["STR", "VIT", "DEX", "LUK", "INT", "WIS"];
                            if (!allowed.includes(upper)) {
                                sendChatToPlayer(currentPlayerId, `Unknown stat: ${stat}`, true);
                                break;
                            }
                            if (player.unallocatedPoints <= 0) {
                                sendChatToPlayer(currentPlayerId, "No unallocated stat points available.", true);
                                break;
                            }
                            (player as any)[upper] = ((player as any)[upper] ?? 0) + 1;
                            player.unallocatedPoints -= 1;

                            if (gameState.selfId === currentPlayerId) {
                                gameState.player = player;
                            }
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

app.use(middlewareLogResponses);
app.use(express.json());

app.get("/api/health", (req: Request, res: Response) => {
    res.set('Content-Type', 'text/plain');
    res.send("ok");
});

app.get("/api/game-state", (req: Request, res: Response) => {
    res.json({
        gameState
    });
});

app.post("/api/create-user", handlerCreateUser);

app.post("/api/move-player", handlerMovePlayer);

app.post("/api/attack-enemy", handlerAttackEnemy);

app.use("/app", express.static("./public/app"));
app.use("/home", express.static("./public/home"));
app.use("/signup", express.static("./public/home/signup"));
app.use("/assets", express.static("./assets"));

// For convenience, redirect root to /app (serves index.html)
app.get("/", (req: Request, res: Response) => {
    res.redirect(302, "/app/");
});

void startServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
});