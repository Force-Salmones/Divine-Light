import type { SkillId } from "@/shared/skills/skillTypes";
import type { WsHandlerContext } from "./types";
import { getSkillDef } from "@/server/services/combat/skills/skillRegistry";

export function levelUpSkill(ctx: WsHandlerContext, msg: { id: SkillId }) {
	const def = getSkillDef(msg.id);
	if (!def) {
		console.error(`Invalid skill id: ${msg.id}`);
	}
}
