import { readFile } from "fs/promises";
import type { Enemy } from "./gamestate";

export async function loadEnemy(id: number): Promise<Enemy> {
    const jsonRaw = await readFile(new URL("../db/mobs.json", import.meta.url), "utf8");
    const jsonData = JSON.parse(jsonRaw);
    const mobData = jsonData[id];
    if (!mobData) {
        throw new Error(`Enemy type ${id} not found in mobs.json`);
    }

    const enemy: Enemy = {
        id,
        mobId: id,
        name: mobData.name,
        level: mobData.level,
        experience: mobData.experience,
        gold: mobData.gold,
        health: mobData.health,
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
        x: 300,
        y: 300,
        sprite: `/assets/mobs/${id}.png`
    };
    return enemy;
}