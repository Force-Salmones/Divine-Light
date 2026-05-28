CREATE TABLE "mobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mob_id" integer NOT NULL,
	"home_x" integer DEFAULT 300 NOT NULL,
	"home_y" integer DEFAULT 300 NOT NULL,
	CONSTRAINT "mobs_mob_id_unique" UNIQUE("mob_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"name" varchar(14) NOT NULL,
	"password_hash" varchar(32) NOT NULL,
	"email" varchar(50) NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"experience" bigint DEFAULT 0 NOT NULL,
	"base_str" integer DEFAULT 5 NOT NULL,
	"base_vit" integer DEFAULT 5 NOT NULL,
	"base_dex" integer DEFAULT 5 NOT NULL,
	"base_luk" integer DEFAULT 5 NOT NULL,
	"base_int" integer DEFAULT 5 NOT NULL,
	"base_wis" integer DEFAULT 5 NOT NULL,
	"inventory" jsonb DEFAULT '{"equipment":{},"items":{}}' NOT NULL,
	"gold" bigint DEFAULT 0 NOT NULL,
	"pos_x" integer DEFAULT 600 NOT NULL,
	"pos_y" integer DEFAULT 600 NOT NULL,
	CONSTRAINT "users_name_unique" UNIQUE("name"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);--> statement-breakpoint
