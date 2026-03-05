import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../../.env.local") });

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString.includes('dummy')) {
    console.error("Missing valid DATABASE_URL in .env.local");
    process.exit(1);
  }

  const sql = neon(connectionString);
  const db = drizzle(sql, { schema });

  console.log("Seeding data...");

  // Clear existing data
  await db.delete(schema.bali_waste_drop_offs);
  await db.delete(schema.bali_tps);
  console.log("Cleared old data.");

  const tpsData = [
    { name: "TPS Suwung Kauh (Denpasar)", lat: -8.705, lng: 115.22, capacityStatus: "CRITICAL" },
    { name: "TPS Kuta Beach", lat: -8.718, lng: 115.168, capacityStatus: "WARNING" },
    { name: "TPS Canggu Batu Bolong", lat: -8.65, lng: 115.13, capacityStatus: "CRITICAL" },
    { name: "TPS Seminyak", lat: -8.69, lng: 115.16, capacityStatus: "OK" },
    { name: "TPS Ubud Central", lat: -8.505, lng: 115.26, capacityStatus: "WARNING" },
    { name: "TPS Sanur Harbour", lat: -8.675, lng: 115.26, capacityStatus: "OK" },
    { name: "TPS Jimbaran Bay", lat: -8.765, lng: 115.17, capacityStatus: "WARNING" },
    { name: "TPS Uluwatu", lat: -8.825, lng: 115.09, capacityStatus: "OK" },
    { name: "TPS Nusa Dua", lat: -8.80, lng: 115.22, capacityStatus: "CRITICAL" },
    { name: "TPS Gianyar Pasar", lat: -8.54, lng: 115.32, capacityStatus: "OK" },
    { name: "TPS Tabanan City", lat: -8.54, lng: 115.12, capacityStatus: "WARNING" },
    { name: "TPS Padangbai", lat: -8.53, lng: 115.50, capacityStatus: "OK" },
  ];

  // Insert TPS
  const insertedTps = await db.insert(schema.bali_tps).values(tpsData).returning({ id: schema.bali_tps.id, name: schema.bali_tps.name });

  console.log(`Inserted ${insertedTps.length} TPS locations.`);

  // Insert DropOffs
  const dropOffs = [];
  const drivers = ["Budi", "Wayan", "Made", "Ketut", "Komang", "Putu"];
  
  for (const tps of insertedTps) {
    // Generate 2 or 3 dropoffs per TPS
    const numDropOffs = Math.floor(Math.random() * 2) + 2; 
    for (let i = 0; i < numDropOffs; i++) {
        const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];
        const randomVolume = parseFloat((Math.random() * 500 + 50).toFixed(2));
        
        // Random date within the last 3 days
        const randomPastTime = new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000);
        
        dropOffs.push({
            tpsId: tps.id,
            driverName: randomDriver,
            volumeKg: randomVolume,
            droppedAt: randomPastTime
        });
    }
  }

  if (dropOffs.length > 0) {
    await db.insert(schema.bali_waste_drop_offs).values(dropOffs);
    console.log(`Inserted ${dropOffs.length} mock drop-offs.`);
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
