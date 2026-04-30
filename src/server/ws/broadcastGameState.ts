import { makeGameStateSnapshot } from "@/api/makeSnapshot";
import { wss } from "../init/startServer";


export function broadcastGameState() {
    if (!wss) return;

    // Per-client snapshot (selfId/player/selectedEnemyId/etc differ per client)
    wss.clients.forEach((client: any) => {
        try {
            if (client.readyState !== 1) return;
            const pid: string | undefined = client.playerId;
            if (!pid) return;
            const snapshot = makeGameStateSnapshot(pid);
            client.send(JSON.stringify({ type: "gameState", gameState: snapshot }));
        } catch (err) {
            console.error("Failed to broadcast snapshot", err);
        }
    });
}
