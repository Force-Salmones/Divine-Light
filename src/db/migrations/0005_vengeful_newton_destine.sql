ALTER TABLE "mobs" ALTER COLUMN "home_x" SET DEFAULT 970;--> statement-breakpoint
ALTER TABLE "mobs" ALTER COLUMN "home_y" SET DEFAULT 374;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "inventory" SET DEFAULT '{"slots":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]}'::jsonb;--> statement-breakpoint