import type { SkillId } from "@/shared/skills/skillTypes";
import type { WsHandlerContext } from "./types";
import { getPlayerFromId } from "@/server/util/getPlayerFromId";
import { getItemDef } from "@/server/services/items/itemRegistry";

export function handleBindHotbar(
	ctx: WsHandlerContext,
	msg: {
		toIndex: number;
		source:
			| { kind: "inventory"; slotIndex: number }
			| { kind: "skillBook"; skillId: SkillId };
	},
) {
	const player = getPlayerFromId(ctx.playerId);
	if (!player) {
		console.error(`Invalid pid in handleBindHotbar: ${ctx.playerId}`);
		return;
	}
	if (msg.toIndex < 0 || msg.toIndex > 8) {
		console.error(
			`Invalid msg.toIndex in handleBindHotbar: ${msg.toIndex}`,
		);
		return;
	}

	if (msg.source.kind === "inventory") {
		const slot = player.inventory.slots[msg.source.slotIndex];
		if (!slot) {
			console.error(
				`Attempt to bind null to hotbar by user ${player.name}, slot index ${msg.source.slotIndex}`,
			);
			return;
		}
		if (slot.kind !== "stack") return;
		const def = getItemDef(slot.itemId);
		if (!def || def.type !== "use") return;
		player.hotbar.slots[msg.toIndex] = {
			kind: "useItem",
			itemId: slot.itemId,
		};
		return;
	} else if (msg.source.kind === "skillBook") {
		const skillLevel = player.skillBook[msg.source.skillId];
		if (skillLevel === undefined) {
			console.error(
				`Invalid skillId for player ${player.name} in handleBindHotbar: ${msg.source.skillId}`,
			);
			return;
		}
		player.hotbar.slots[msg.toIndex] = {
			kind: "skill",
			skillId: msg.source.skillId,
		};
		return;
	}
}
