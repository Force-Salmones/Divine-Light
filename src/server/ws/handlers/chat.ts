import type { WsHandlerContext } from "./types";
import { sendChatToPlayer } from "@/server/chatService";
import { broadcastChatMessage } from "@/server/chatService";
import { shutdown } from "@/server/services/shutdown";
import { adminChatCommands } from "@/server/chatCommands";
import type { ChatCommandContext } from "@/server/chatCommands";
import { getPlayerFromId } from "@/server/util/getPlayerFromId";

export function handleChat(ctx: WsHandlerContext, msg: any) {
	const { text } = msg as { text?: string };
	const pid = ctx.playerId;

	if (typeof text !== "string" || !text.trim()) {
		return;
	}
	const trimmed = text.trim();
	const isAdminCommand = trimmed.startsWith("$");

	if (isAdminCommand) {
		//add isAdmin check
		const withoutPrefix = trimmed.slice(1).trim();
		const parts = withoutPrefix.split(/\s+/).filter(Boolean);
		const commandName = parts[0];
		const args = parts.slice(1);
		if (!commandName) {
			sendChatToPlayer(pid, "No command specified after $", true);
			return;
		}
		if (commandName === "shutdown") {
			broadcastChatMessage("Server is shutting down...", undefined, true);
			void shutdown(`Requested by ${pid}`);
			return;
		}
		const handler =
			adminChatCommands[commandName as keyof typeof adminChatCommands] ??
			adminChatCommands[commandName as string];
		if (!handler) {
			sendChatToPlayer(pid, `Unknown command: ${commandName}`, true);
			return;
		}

		const chatCtx: ChatCommandContext = {
			playerId: pid,
			args,
			reply: (message: string) => {
				sendChatToPlayer(pid, message, true);
			},
			broadcast: (message: string) => {
				broadcastChatMessage(message, undefined, true);
			},
		};

		Promise.resolve(handler(chatCtx)).catch((err) => {
			console.error(
				"Chat command failed",
				{
					playerId: pid,
					commandName,
				},
				err,
			);
			const msg = err instanceof Error ? err.message : String(err);
			sendChatToPlayer(pid, `Command failed: ${msg}`, true);
		});
	} else {
		// Normal player chat: broadcast to everyone, using player name if available
		const p = getPlayerFromId(pid);
		const fromName = p?.name ?? pid;
		broadcastChatMessage(trimmed, fromName, false);
	}
}
