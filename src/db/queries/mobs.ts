import { db } from "../index.js";
import { mobs } from "../schema.js";
import { eq } from "drizzle-orm";

export async function getMobById(id: number) {
    return await db.select().from(mobs).where(eq(mobs.id, id)).limit(1);
}

export async function getAllMobs() {
    return await db.select().from(mobs);
}

export async function createMob(mobId: number, homeX: number, homeY: number) {
    return await db.insert(mobs).values({ mobId, homeX, homeY }).returning();
}

export async function removeMob(id: number) {
    return await db.delete(mobs).where(eq(mobs.id, id)).returning();
}

export async function updateMob(id: number, mobId: number, homeX: number, homeY: number) {
    return await db.update(mobs).set({ mobId, homeX, homeY }).where(eq(mobs.id, id)).returning();
}