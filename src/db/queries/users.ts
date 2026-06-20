import type { Bank, Equipment, Inventory } from "@/shared/items/inventory.js";
import { db } from "../index.js";
import { users, type User } from "../schema.js";
import { eq } from "drizzle-orm";

export async function createUser(
	name: string,
	email: string,
	passwordHash: string,
) {
	const [user] = await db
		.insert(users)
		.values({ name, email, passwordHash })
		.returning();
	return user;
}

export async function getUserById(id: string): Promise<User | undefined> {
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.id, id))
		.limit(1);
	return user;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.email, email))
		.limit(1);
	return user;
}

export async function updateUserPassword(
	userId: string,
	newPasswordHash: string,
) {
	const [result] = await db
		.update(users)
		.set({ passwordHash: newPasswordHash })
		.where(eq(users.id, userId))
		.returning();
	return result;
}

export async function updateUser(
	id: string,
	level: number,
	experience: number,
	unallocatedPoints: number,
	baseSTR: number,
	baseVIT: number,
	baseDEX: number,
	baseLUK: number,
	baseINT: number,
	baseWIS: number,
	currHealth: number,
	currMana: number,
	inventory: Inventory,
	bank: Bank,
	equipment: Equipment,
	gold: number,
	posX: number,
	posY: number,
) {
	const [result] = await db
		.update(users)
		.set({
			level: level,
			experience: experience,
			unallocatedPoints: unallocatedPoints,
			baseSTR: baseSTR,
			baseVIT: baseVIT,
			baseDEX: baseDEX,
			baseLUK: baseLUK,
			baseINT: baseINT,
			baseWIS: baseWIS,
			currHealth: currHealth,
			currMana: currMana,
			inventory: inventory,
			equipment: equipment,
			bank: bank,
			gold: gold,
			posX: posX,
			posY: posY,
		})
		.where(eq(users.id, id))
		.returning();

	return result;
}
