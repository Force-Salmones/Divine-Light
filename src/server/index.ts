import express from "express";
import { shutdown } from "./services/shutdown";
import { startServer } from "./init/startServer";

export const app = express();

export const runtimeState = {
	shuttingDown: false,
	lastTick: Date.now(),
};

// Tracks the active WS connection per playerId (prevents two tabs controlling the same character)
export const wsByPlayerId = new Map<string, string>();

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
