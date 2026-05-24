import { handleAttack } from "./attack";
import { handleMove } from "./move";
import { handleBonk } from "./bonk";
import { handleStopAttack } from "./stopAttack";
import { handleSpendStat } from "./spendStat";
import type { WsHandlerContext } from "./types";
import { handleChat } from "./chat";

const handlers: Record<string, (ctx: WsHandlerContext, msg: any) => void> = {
	move: handleMove,
	attack: handleAttack,
	stopAttack: handleStopAttack,
	bonkPlayer: handleBonk,
	spendStat: handleSpendStat,
	chat: handleChat,
};

export function dispatchWsMessage(ctx: WsHandlerContext, msg: any) {
	const type = msg?.type;
	if (typeof type !== "string") {
		return;
	}

	const handler = handlers[type];
	if (!handler) {
		return;
	}

	handler(ctx, msg);
}
