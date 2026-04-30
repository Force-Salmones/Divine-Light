import { gameState } from "@/api/gamestate";
import { loadEnemy } from "@/api/loadEnemy";
import { getAllMobs } from "@/db/queries/mobs";


export async function initializeEnemies() {
    const dbMobs = await getAllMobs();
    const enemies = await Promise.all(dbMobs.map((mob) => loadEnemy(mob)));
    gameState.enemies = enemies;
}
