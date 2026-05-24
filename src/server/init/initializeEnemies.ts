import { serverGameState } from "../state/gameState";
import { loadEnemy } from "../services/loadEnemy";
import { getAllMobs } from "@/db/queries/mobs";

export async function initializeEnemies() {
	const dbMobs = await getAllMobs();
	const enemies = await Promise.all(dbMobs.map((mob) => loadEnemy(mob)));
	serverGameState.enemies = enemies;
}
