import type { WsHandlerContext } from "./types";

export async function handleDropItem(ctx: WsHandlerContext, msg: any) {
	const { slotIndex } = msg;
	if (!Number.isInteger(slotIndex)) return;
	if (slotIndex > 24 || slotIndex < 0) return;
}
