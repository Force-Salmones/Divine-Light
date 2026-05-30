import { TICK_INTERVAL_MS } from "@/constants";
import { runtimeState } from "..";
import { broadcastGameState } from "../ws/broadcastGameState";
import { updateAutomaticAttack } from "./updateAutomaticAttack";
import { updateServerMovement } from "./updateServerMovement";
import { pruneExpiredItems } from "./pruneExpiredItems";

export function startTickLoop() {
	let tickCounter = 0;

	setInterval(() => {
		tickCounter++;

		const now = Date.now();
		const deltaSeconds = (now - runtimeState.lastTick) / 1000;
		runtimeState.lastTick = now;
		updateServerMovement(deltaSeconds);
		updateAutomaticAttack();

		if (tickCounter % 10 === 0) {
			pruneExpiredItems(now);
		}

		broadcastGameState();
	}, TICK_INTERVAL_MS);
}
