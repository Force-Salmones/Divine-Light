import express from "express";
import type { Request, Response } from "express";
import { config } from "../config";
import { handlerMovePlayer } from "../api/handlerMovePlayer";
import { handlerAttackEnemy } from "../api/handlerAttackEnemy";
import { gameState } from "../api/gamestate";
import { makeGameStateSnapshot } from "../api/makeSnapshot";

import { loadPlayer } from "../api/loadPlayer";
import { loadEnemy } from "../api/loadEnemy";
import { middlewareLogResponses } from "./middleware";
import { handlerCreateUser } from "../api/handlerCreateUser";
import { performAttack } from "../api/performAttack";
import { WebSocketServer } from "ws";
import { getAllMobs } from "@/db/queries/mobs";
import { adminChatCommands, type ChatCommandContext } from "./chatCommands";
import { initChatService, broadcastChatMessage, sendChatToPlayer } from "./chatService";
import { getUserById } from "../db/queries/users";
import { recalcPlayerDerivedStats } from "../api/recalcPlayerStats";
import { handlerLogin } from "../api/handlerLogin";
import { handlerLogout } from "../api/handlerLogout";
import { requireJwtForApi, requireJwtForApp, validateJWT } from "@/auth/jwt";
import { calculateApproachCoords } from "../game/logic/movement/calculateApproachCoords";
import { calculateTargetDistance } from "@/game/logic/movement/calculateTargetDistance";
import { getJwtFromReq } from "@/auth/jwt";
import { sendWsToPlayer } from "./ws/sendWsToPlayer";
import { broadcastGameState } from "../server/ws/broadcastGameState";
import { updateServerMovement } from "../server/loop/updateServerMovement";
import { updateAutomaticAttack } from "../server/loop/updateAutomaticAttack";
import { persistAllPlayers, persistPlayer } from "./services/persistPlayer";
import { shutdown } from "./services/shutdown";

const app = express();

export const runtimeState = {
    shuttingDown: false,
};

export const TICK_INTERVAL_MS = 100;

export let lastTick = Date.now();

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

export let wss: WebSocketServer | null = null;
export let httpServer: any = null;
export let shuttingDown = false;

// Tracks the active WS connection per playerId (prevents two tabs controlling the same character)
export const wsByPlayerId = new Map<string, any>();

export async function initializeEnemies() {
    const dbMobs = await getAllMobs();
    const enemies = await Promise.all(dbMobs.map((mob) => loadEnemy(mob)));
    gameState.enemies = enemies;
}

async function startServer() {
    await initializeEnemies();
    startTickLoop();

    // Periodic persistence of all online players (every 60 seconds)
    setInterval(() => {
        void persistAllPlayers();
    }, 60_000);

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
            let player = gameState.players[userId];
            if (!player) {
                player = await loadPlayer(userId);
                if (!player) {
                    ws.close(1011, "Failed to load player");
                    return;
                }
                gameState.players[player.id] = player;
                gameState.selectedTargets[player.id] = null;
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
            ws.send(JSON.stringify({ type: "gameState", gameState: makeGameStateSnapshot(player.id) }));

            ws.on("close", () => {
                const pid: string | undefined = (ws as any).playerId;
                if (!pid) return;

                // Only clean up if THIS ws is still the active one for the playerId
                if (wsByPlayerId.get(pid) === ws) {
                    wsByPlayerId.delete(pid);

                    void persistPlayer(pid);

                    // Remove player from the in-memory world on disconnect
                    delete gameState.players[pid];
                    delete gameState.selectedTargets[pid];
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
                                const parts = withoutPrefix.split(/\s+/).filter(Boolean);
                                const commandName = parts[0];
                                const args = parts.slice(1);
                                if (!commandName) {
                                    sendChatToPlayer(currentPlayerId, "No command specified after $", true);
                                    break;
                                }
                                if (commandName === "shutdown") {
                                    broadcastChatMessage("Server is shutting down...", undefined, true);
                                    void shutdown(`Requested by ${currentPlayerId}`);
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

                                Promise.resolve(handler(ctx)).catch((err) => {
                                    console.error("Chat command failed", { playerId: currentPlayerId, commandName }, err);
                                    const msg = err instanceof Error ? err.message : String(err);
                                    sendChatToPlayer(currentPlayerId, `Command failed: ${msg}`, true);
                                });
                            } else {
                                // Normal player chat: broadcast to everyone, using player name if available
                                const p = gameState.players[currentPlayerId];
                                const fromName = p?.name ?? currentPlayerId;
                                broadcastChatMessage(trimmed, fromName, false);
                            }

                            break;
                        }
                        case "move": {
                            const { x, y, enemyId } = msg;
                            console.log("WS move", { currentPlayerId, x, y, enemyId });
                            const player = gameState.players[currentPlayerId];
                            if (!player) break;
                            if (typeof enemyId === "number") {
                                // Move toward enemy slightly inside attack range
                                const enemy = gameState.enemies.find(e => e.id === enemyId);
                                if (!enemy) break;
                                const approachCoords = calculateApproachCoords(player, enemy);
                                if (approachCoords) {
                                    [player.targetX, player.targetY] = approachCoords;
                                }
                            } else if (typeof x === "number" && typeof y === "number") {
                                player.targetX = x;
                                player.targetY = y;
                            }
                            break;
                        }
                        case "attack": {
                            const { enemyId } = msg;
                            console.log("WS attack", { currentPlayerId, enemyId, enemyIdType: typeof enemyId });
                            if (typeof enemyId !== "number") break;
                            gameState.selectedTargets[currentPlayerId] = enemyId;

                            // If out of range, also set a movement target toward the enemy
                            const player = gameState.players[currentPlayerId];
                            const enemy = gameState.enemies.find(e => e.id === enemyId);
                            console.log("WS attack handler", { currentPlayerId, enemyId, hasPlayer: !!player, hasEnemy: !!enemy });
                            if (player && enemy) {
                                const approachCoords = calculateApproachCoords(player, enemy);
                                if (approachCoords) {
                                    [player.targetX, player.targetY] = approachCoords;
                                }
                            }
                            // Try an immediate attack; subsequent hits handled by server loop
                            performAttack(currentPlayerId, enemyId);
                            break;
                        }
                        case "stopAttack": {
                            gameState.selectedTargets[currentPlayerId] = null;
                            break;
                        }
                        case "bonkPlayer": {
                            const { targetPlayerId } = msg as { targetPlayerId?: string };
                            if (typeof targetPlayerId !== "string" || !targetPlayerId) break;
                            if (targetPlayerId === currentPlayerId) break;

                            const bonker = gameState.players[currentPlayerId];
                            const target = gameState.players[targetPlayerId];
                            if (!bonker || !target) break;

                            const distance = calculateTargetDistance(bonker, target);

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
                            const player = gameState.players[currentPlayerId];
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

app.use(middlewareLogResponses);
app.use(express.json());

app.get("/api/health", (req: Request, res: Response) => {
    res.set('Content-Type', 'text/plain');
    res.send("ok");
});

app.get("/api/game-state", requireJwtForApi, async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;

    // Ensure player is loaded (supports refreshing the page without a WS connection yet)
    let player = gameState.players[userId];
    if (!player) {
        player = await loadPlayer(userId);
        if (player) {
            gameState.players[userId] = player;
            gameState.selectedTargets[userId] = null;
        }
    }

    if (!player) {
        return res.status(404).json({ success: false, message: "Player not found" });
    }

    return res.json({ gameState: makeGameStateSnapshot(userId) });
});

app.post("/api/create-user", handlerCreateUser);

app.post("/api/login", handlerLogin);
app.post("/api/logout", handlerLogout);

// Require auth to load the game client
// Disable caching in dev to avoid one client running stale JS while another runs fresh JS.
app.use(
    "/app",
    requireJwtForApp,
    express.static("./public/app", {
        setHeaders: (res) => {
            res.setHeader("Cache-Control", "no-store");
        },
    })
);
app.use("/home", express.static("./public/home"));
app.use("/signup", express.static("./public/home/signup"));
app.use("/login", express.static("./public/home/auth"));
app.use("/assets", express.static("./assets"));

// For convenience, redirect root to /app if logged in, otherwise /home
app.get("/", (req: Request, res: Response) => {
    try {
        const token = getJwtFromReq(req);
        if (!token) {
            return res.redirect(302, "/home/");
        }
        validateJWT(token, config.jwt_secret);
        return res.redirect(302, "/app/");
    } catch {
        return res.redirect(302, "/home/");
    }
});

void startServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
});

process.on("SIGINT", () => {
    void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
});