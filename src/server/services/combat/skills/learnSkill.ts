import type { SkillId } from "@/shared/skills/skillTypes";
import { getSkillDef } from "./skillRegistry";
import type { Player } from "@/server/state/gameState";

export function learnSkill(player: Player, skillId: SkillId) {
	if (!player) return;
	if (!getSkillDef(skillId)) {
		console.error(
			`Attempt to learn invalid skill by player ${player.name}, id: ${skillId}`,
		);
		return;
	}
	if (skillId in player.skillBook) return;
	player.skillBook[skillId] = 1;
}
