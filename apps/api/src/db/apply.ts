import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../../.env.local") });

async function verifyTables() {
  const sql = neon(process.env.DATABASE_URL!);
  try {
    const res = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'bali_%';
    `;
    console.log("Existing bali_ tables:", res.map(r => r.table_name));
    
    // Check if we need to create bali_waste_drop_offs
    const dropOffsExist = res.some(r => r.table_name === 'bali_waste_drop_offs');
    if (!dropOffsExist) {
        console.log("bali_waste_drop_offs is MISSING! Creating it...");
        await sql`CREATE TABLE "bali_waste_drop_offs" (
            "id" serial PRIMARY KEY NOT NULL,
            "tpsId" integer NOT NULL,
            "driverName" varchar(255) NOT NULL,
            "volumeKg" double precision NOT NULL,
            "droppedAt" timestamp DEFAULT now() NOT NULL,
            "deletedAt" timestamp
        );`;
        await sql`ALTER TABLE "bali_waste_drop_offs" ADD CONSTRAINT "bali_waste_drop_offs_tpsId_bali_tps_id_fk" FOREIGN KEY ("tpsId") REFERENCES "public"."bali_tps"("id") ON DELETE no action ON UPDATE no action;`;
        console.log("bali_waste_drop_offs created successfully.");
    } else {
        console.log("Everything is perfectly setup!");
    }
  } catch (error) {
    console.error(error);
  }
}

verifyTables();
