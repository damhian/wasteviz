CREATE TABLE "bali_tps" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"capacityStatus" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bali_waste_drop_offs" (
	"id" serial PRIMARY KEY NOT NULL,
	"tpsId" integer NOT NULL,
	"driverName" varchar(255) NOT NULL,
	"volumeKg" double precision NOT NULL,
	"droppedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "bali_waste_drop_offs" ADD CONSTRAINT "bali_waste_drop_offs_tpsId_bali_tps_id_fk" FOREIGN KEY ("tpsId") REFERENCES "public"."bali_tps"("id") ON DELETE no action ON UPDATE no action;