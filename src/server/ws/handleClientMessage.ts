import type { WsHandlerContext } from "./handlers/types";
import { dispatchWsMessage } from "./handlers";
import { ClientToServerMessageSchema } from "@/shared/protocol/wsMessageSchema";

const MAX_PAYLOAD = 64 * 1024;

export async function handleClientMessage(
	ctx: WsHandlerContext,
	raw: unknown,
): Promise<void> {
	try {
		if (!raw) return;

		const size =
			typeof raw === "string"
				? raw.length
				: raw instanceof Buffer
					? raw.byteLength
					: 64 * 1025;
		if (size > MAX_PAYLOAD) {
			console.warn(
				`Oversized WS message from ${ctx.playerId}: ${size} bytes`,
			);
			return;
		}

		const msg = JSON.parse(raw.toString());
		const res = ClientToServerMessageSchema.safeParse(msg);
		if (!res.success) {
			console.warn(
				`Invalid WS message from user ${ctx.playerId}: ${raw}`,
				JSON.stringify(res.error.issues, null, 2),
			);
			return;
		}
		dispatchWsMessage(ctx, res.data);
	} catch (err) {
		console.error("WS message error:", err);
	}
}
