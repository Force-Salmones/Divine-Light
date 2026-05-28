ALTER TABLE "mobs" DROP CONSTRAINT "mobs_mob_id_unique";--> statement-breakpoint
ALTER TABLE "mobs" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "mobs" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint