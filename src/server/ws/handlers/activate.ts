import { getPlayerFromId } from "@/server/util/getPlayerFromId";
import type { WsHandlerContext } from "./types";
import { applyUseEffect } from "@/server/services/items/useEffects";
import { getItemDef } from "@/server/services/items/itemRegistry";
import { validateSlotRef } from "@/shared/protocol/helpers/validateSlotRef";
import { calcDistance } from "@/shared/util/calcDistance";
import { recomputePlayerStats } from "@/server/services/modifiers/recomputePlayerStats";

const DEFAULT_SKILL_RANGE_PX = 100;

export function handleActivate(ctx: WsHandlerContext, msg: any) {
	const player = getPlayerFromId(ctx.playerId);
	if (!player) return;

	const source = msg?.source;
	if (!source || typeof source !== "object") return;

	if (source.kind === "itemId") {
		const itemId = source.itemId;

		if (!Number.isInteger(itemId)) return;

		const slots = player.inventory.slots;
		const slotIndex = slots.findIndex(
			(s) => s?.kind === "stack" && s.itemId === itemId && s.quantity > 0,
		);
		if (slotIndex === -1) return;

		const slot = slots[slotIndex]!;
		if (slot.kind !== "stack") return;

		const def = getItemDef(slot.itemId);
		if (def.type !== "use") return;

		applyUseEffect(def.typeProps.effectId, player);

		slot.quantity -= 1;
		if (slot.quantity <= 0) {
			slots[slotIndex] = null;
		}
		return;
	} else if (source.kind === "inventorySlot") {
		const ref = validateSlotRef(source.slot, player.bankOpen);
		if (!ref) return;

		if (ref.from !== "inventory") return;

		const slot = player.inventory.slots[ref.slotIndex];
		if (!slot || slot.kind !== "stack" || slot.quantity < 1) return;

		const def = getItemDef(slot.itemId);
		if (def.type !== "use") return;

		applyUseEffect(def.typeProps.effectId, player);

		slot.quantity -= 1;
		if (slot.quantity <= 0) {
			player.inventory.slots[ref.slotIndex] = null;
		}
		return;
	} else if (source.kind === "skillId") {
		const skillId = source.skillId;
		if (typeof skillId !== "string") return;
		//make skill registry later
		if (skillId !== "rage") return;

		const nowMs = Date.now();
		//temp hardcode
		const cooldownKey = "skill:rage";
		const readyAt = player.cooldowns[cooldownKey] ?? 0;
		if (nowMs < readyAt) return;

		const targetMsg = msg?.target;
		let target = player;
		if (
			targetMsg?.kind === "player" &&
			typeof targetMsg.playerId === "string"
		) {
			const other = getPlayerFromId(targetMsg.playerId);
			if (!other) return;
			target = other;
		} else if (targetMsg?.kind === "enemy") {
			//impliment later
			return;
		} // self cast

		if (target.id !== player.id) {
			const dist = calcDistance(
				target.x + target.size / 2,
				target.y + target.size / 2,
				player.x + player.size / 2,
				player.y + player.size / 2,
			);
			if (dist > DEFAULT_SKILL_RANGE_PX) return;
		}

		target.activeEffects = (target.activeEffects ?? []).filter(
			//another temp hardcode
			(e) => !(e.source === "skillEffect" && e.id === "rage"),
		);

		target.activeEffects.push({
			id: "rage",
			source: "skillEffect",
			startedAtMs: nowMs,
			expiresAtMs: nowMs + 60_000,
			primaryMods: { STR: 20 },
			derivedMods: {},
		});

		player.cooldowns[cooldownKey] = nowMs + 5_000;

		recomputePlayerStats(target, nowMs);
		return;
	}
}
