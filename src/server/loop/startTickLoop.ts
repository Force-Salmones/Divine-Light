import { TICK_INTERVAL_MS } from "@/constants";
import { runtimeState } from "..";
import { broadcastGameState } from "../ws/broadcastGameState";
import { updateAutomaticAttack } from "./updateAutomaticAttack";
import { updateServerMovement } from "./updateServerMovement";


export function startTickLoop() {
    setInterval(() => {
        const now = Date.now();
        const deltaSeconds = (now - runtimeState.lastTick) / 1000;
        runtimeState.lastTick = now;
        updateServerMovement(deltaSeconds);
        updateAutomaticAttack();
        broadcastGameState();
    }, TICK_INTERVAL_MS);
}
