import { readFile } from "fs/promises";
import type { Enemy } from "./gamestate";
import type { Mob } from "../db/schema";

export async function loadEnemy(mob: Mob): Promise<Enemy> {
    const jsonRaw = await readFile(new URL("../db/mobs.json", import.meta.url), "utf8");
    const jsonData = JSON.parse(jsonRaw);
    const mobData = jsonData[mob.mobId];
    if (!mobData) {
        throw new Error(`Enemy type ${mob.mobId} not found in mobs.json`);
    }

    const enemy: Enemy = {
        id: mob.id, // unique instance id from DB row
        mobId: mob.mobId, // enemy type id
        name: mobData.name,
        level: mobData.level,
        experience: mobData.experience,
        gold: mobData.gold,
        currHealth: mobData.health,
        maxHealth: mobData.health,
        damage: mobData.damage,
        damageType: mobData.damageType,
        attackSpeed: mobData.attackSpeed,
        attackRange: mobData.attackRange,
        defense: mobData.defense,
        resistance: mobData.resistance,
        speed: mobData.speed,
        reSpawnTime: mobData.reSpawnTime,
        aggressive: mobData.aggressive,
        retreats: mobData.retreats,
        drops: mobData.drops,
        x: mob.homeX,
        y: mob.homeY,
        sprite: `/assets/mobs/${mob.mobId}.png`
    };
    return enemy;
}