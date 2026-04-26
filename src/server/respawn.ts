import { gameState, type Enemy } from "../api/gamestate";
import { getMobById } from "../db/queries/mobs";
import { loadEnemy } from "../api/loadEnemy";
import type { Mob } from "../db/schema";

// Track pending respawns by unique mob instance id (DB primary key)
type PendingRespawn = { id: number; at: number };
const pendingRespawns: PendingRespawn[] = [];

export function scheduleMobRespawn(enemy: Enemy) {
    // Avoid scheduling duplicates for the same id
    if (pendingRespawns.some((r) => r.id === enemy.id)) return;
    const delayMs = Math.max(0, (enemy.reSpawnTime ?? 0) * 1000);
    const at = Date.now() + delayMs;
    pendingRespawns.push({ id: enemy.id, at });
}

export async function updateRespawns() {
    const now = Date.now();
    const ready = pendingRespawns.filter((r) => r.at <= now);
    if (ready.length === 0) return;

    // Remove ready items from queue
    for (const r of ready) {
        const idx = pendingRespawns.findIndex((x) => x.id === r.id);
        if (idx >= 0) pendingRespawns.splice(idx, 1);
    }

    // For each ready respawn, load from DB and recreate the enemy
    for (const r of ready) {
        try {
            const rows = await getMobById(r.id);
            const mobRow: Mob | undefined = rows?.[0];
            if (!mobRow) continue;
            const enemy = await loadEnemy(mobRow);
            // Ensure we don't duplicate if already present (defensive)
            if (!gameState.enemies.some((e) => e.id === enemy.id)) {
                gameState.enemies.push(enemy);
            }
        } catch (err) {
            console.error("Failed to respawn mob", r.id, err);
        }
    }
}
