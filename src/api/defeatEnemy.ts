import type { Enemy, Player } from "./gamestate";
import { gainExperience } from "./gainExperience";

export async function defeatEnemy(player: Player, enemy: Enemy): Promise<void> {
    gainExperience(player, enemy.experience);
    player.gold += enemy.gold;
    //add animations later
}