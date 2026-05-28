import { db } from "./src/db/index.ts";
import { users } from "./src/db/schema.ts";

async function testConnection() {
	try {
		const result = await db.select().from(users);
		console.log("Database connection successful!");
		console.log("Users count:", result.length);
	} catch (error) {
		console.error("Database connection failed:", error);
	}
}

testConnection();
