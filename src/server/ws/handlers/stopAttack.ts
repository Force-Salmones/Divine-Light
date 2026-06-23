import { serverGameState } from "@/server/state/gameState";
import type { WsHandlerContext } from "./types";

export function handleStopAttack(ctx: WsHandlerContext) {
	serverGameState.selectedTargets[ctx.playerId] = null;
}
