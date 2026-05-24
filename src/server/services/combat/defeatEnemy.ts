import { gainExperience } from "../progression/gainExperience";
import type { Player, Enemy } from "@/server/state/gameState";

export async function defeatEnemy(player: Player, enemy: Enemy): Promise<void> {
	gainExperience(player, enemy.experience);
	player.gold += enemy.gold;
	//add animations later
}
