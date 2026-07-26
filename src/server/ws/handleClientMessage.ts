import type { WsHandlerContext } from "./handlers/types";
import { dispatchWsMessage } from "./handlers";
import { ClientToServerMessageSchema } from "@/shared/protocol/wsMessageSchema";

export async function handleClientMessage(
	ctx: WsHandlerContext,
	raw: unknown,
): Promise<void> {
	try {
		if (!raw) return;
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
