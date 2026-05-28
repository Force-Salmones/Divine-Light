import { readFile } from "fs/promises";
import { serverGameState, type Player } from "./state/gameState";
import { pendingRespawns } from "./respawn";
import { createMob, removeMob } from "../db/queries/mobs";
import { loadEnemy } from "./services/loadEnemy";
import { addToInventory } from "./services/items/addToInventory";
import { getItemDef } from "./services/items/itemRegistry";

export type ChatCommandContext = {
	playerId: string;
	args: string[];
	reply: (message: string) => void | Promise<void>;
	broadcast: (message: string) => void | Promise<void>;
};

export type ChatCommandHandler = (
	ctx: ChatCommandContext,
) => void | Promise<void>;

/**
 * Map of admin chat commands.
 * Keys are command names (without the leading "$"),
 * values are handlers that receive the playerId and arguments.
 *
 * Example: "$echo hello world" -> command "echo" with args ["hello", "world"].
 */
export const adminChatCommands: Record<string, ChatCommandHandler> = {
	//broadcast command: sends a system message to everyone
	announce: ({ args, broadcast, reply }) => {
		if (!args.length) {
			void reply("Usage: $announce <message>");
			return;
		}
		const text = args.join(" ");
		void broadcast(`[Announcement] ${text}`);
	},

	// addmob command: adds a new enemy instance to the database (+ spawns it immediately)
	// Usage: $addmob <mobTypeId> <homeX> <homeY>
	addmob: async ({ args, reply }) => {
		if (args.length < 3) {
			await reply("Usage: $addmob <mobTypeId> <homeX> <homeY>");
			return;
		}

		const mobTypeId = Number(args[0]);
		const homeX = Number(args[1]);
		const homeY = Number(args[2]);

		if (
			!Number.isFinite(mobTypeId) ||
			!Number.isFinite(homeX) ||
			!Number.isFinite(homeY)
		) {
			void reply(
				"Usage: $addmob <mobTypeId> <homeX> <homeY> (all must be numbers)",
			);
			return;
		}

		// Validate the mob type exists in mobs.json
		const jsonRaw = await readFile(
			new URL("../db/mobs.json", import.meta.url),
			"utf8",
		);
		const jsonData = JSON.parse(jsonRaw);
		const mobData = jsonData[mobTypeId];
		if (!mobData) {
			await reply(`Enemy type ${mobTypeId} not found in mobs.json`);
			return;
		}

		const inserted = await createMob(mobTypeId, homeX, homeY);
		const row = inserted?.[0];
		if (!row) {
			await reply("Failed to create mob (no row returned)");
			return;
		}

		// Spawn immediately in the current world
		const enemy = await loadEnemy(row);
		if (!serverGameState.enemies.some((e) => e.id === enemy.id)) {
			serverGameState.enemies.push(enemy);
		}

		void reply(
			`Added mob instance #${row.id} (type ${mobTypeId}) at (${homeX}, ${homeY})`,
		);
	},

	// delmob command: removes an enemy from the database by its unique instance ID (+ despawns it)
	// Usage: $delmob <instanceId>
	delmob: async ({ args, reply }) => {
		if (args.length < 1) {
			await reply("Usage: $delmob <instanceId>");
			return;
		}

		const instanceId = Number(args[0]);
		if (!Number.isFinite(instanceId)) {
			void reply("Usage: $delmob <instanceId> (must be a number)");
			return;
		}

		await removeMob(instanceId);

		// Despawn immediately
		serverGameState.enemies = serverGameState.enemies.filter(
			(e) => e.id !== instanceId,
		);

		// Also cancel any pending respawn for this instance (best-effort)
		const idx = pendingRespawns.findIndex((r) => r.id === instanceId);
		if (idx >= 0) pendingRespawns.splice(idx, 1);

		await reply(`Deleted mob instance #${instanceId}`);
	},
	give: async ({ args, reply }) => {
		if (args.length < 3) {
			void reply("Usage: $give <name> <quantity> <itemId>");
			return;
		}
		const playerName = args[0];
		let foundPlayer: Player | null = null;
		for (const player in serverGameState.players) {
			if (!serverGameState.players[player]) continue;
			if (serverGameState.players[player].name === playerName) {
				foundPlayer = serverGameState.players[player];
			}
		}
		if (!foundPlayer) {
			void reply(`Player "${playerName}" not found."`);
			return;
		}

		const quantity = Number(args[1]);
		if (!Number.isInteger(quantity) || quantity <= 0) {
			await reply(
				`Invalid quantity: "${args[1]}" (must be an integer > 0)`,
			);
			return;
		}

		const itemId = Number(args[2]);
		if (!Number.isInteger(itemId) || itemId < 0) {
			await reply(
				`Invalid itemId: "${args[2]}" (must be an integer >= 0)`,
			);
			return;
		}

		const stackSize = getItemDef(itemId).stackSize;

		addToInventory(foundPlayer.inventory, itemId, quantity, stackSize);
	},
};
