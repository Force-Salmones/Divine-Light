import { pgTable, timestamp, uuid, varchar, integer, jsonb, boolean, bigint } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
    name: varchar("name", { length: 14 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    email: varchar("email", { length: 50 }).notNull().unique(),
    level: integer("level").notNull().default(1),
    experience: bigint("experience", { mode: "number" }).notNull().default(0),
    unallocatedPoints: integer("unallocated_points").notNull().default(0),
    baseSTR: integer("base_str").notNull().default(5),
    baseVIT: integer("base_vit").notNull().default(5),
    baseDEX: integer("base_dex").notNull().default(5),
    baseLUK: integer("base_luk").notNull().default(5),
    baseINT: integer("base_int").notNull().default(5),
    baseWIS: integer("base_wis").notNull().default(5),
    inventory: jsonb("inventory").notNull().default(JSON.stringify({
        equipment: {},
        items: {}
    })),
    gold: bigint("gold", { mode: "number" }).notNull().default(0),
    posX: integer("pos_x").notNull().default(600),
    posY: integer("pos_y").notNull().default(600)
});

export const mobs = pgTable("mobs", {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    mobId: integer("mob_id").notNull().unique(),
    homeX: integer("home_x").notNull().default(300),
    homeY: integer("home_y").notNull().default(300),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Mob = typeof mobs.$inferSelect;
export type NewMob = typeof mobs.$inferInsert;