import { handleAttack } from "./attack";
import { handleMove } from "./move";
import { handleBonk } from "./bonk";
import { handleStopAttack } from "./stopAttack";
import { handleSpendStat } from "./spendStat";
import type { WsHandlerContext } from "./types";
import { handleChat } from "./chat";
import { handlePickupItem } from "./pickupItem";
import { handleDropItem } from "./dropItem";
import { handleOpenBank } from "./openBank";
import { handleCloseBank } from "./closeBank";
import { handleSwapItem } from "./swapItem";
import { handleActivate } from "./activate";
import { handleBindHotbar } from "./bindHotbar";
import { handleClearHotbar } from "./clearHotbar";
import type { ClientToServerMessage } from "@/shared/protocol/ws";

const handlers: Record<string, (ctx: WsHandlerContext, msg: any) => void> = {
	move: handleMove,
	attack: handleAttack,
	stopAttack: handleStopAttack,
	bonkPlayer: handleBonk,
	spendStat: handleSpendStat,
	chat: handleChat,
	pickupItem: handlePickupItem,
	dropItem: handleDropItem,
	swapItem: handleSwapItem,
	openBank: handleOpenBank,
	closeBank: handleCloseBank,
	activate: handleActivate,
	bindHotbar: handleBindHotbar,
	clearHotbar: handleClearHotbar,
};

export function dispatchWsMessage(
	ctx: WsHandlerContext,
	msg: ClientToServerMessage,
) {
	const type = msg.type;

	const handler = handlers[type];
	if (!handler) {
		return;
	}

	handler(ctx, msg);
}
