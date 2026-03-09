import { db } from "./index";
import { bali_tps, bali_waste_drop_offs } from "./schema";
import { eq, sql } from "drizzle-orm";

async function adjustMaxCapacities() {
  console.log("Fetching TPS locations and total volumes...");

  // 1. Get all TPS locations
  const tpsLocations = await db.select().from(bali_tps);

  // 2. Get total volumes per TPS
  const dropOffs = await db
    .select({
      tpsId: bali_waste_drop_offs.tpsId,
      totalVolume: sql<number>`sum(${bali_waste_drop_offs.volumeKg})`.mapWith(
        Number,
      ),
    })
    .from(bali_waste_drop_offs)
    .where(sql`${bali_waste_drop_offs.deletedAt} IS NULL`)
    .groupBy(bali_waste_drop_offs.tpsId);

  const volumeMap = new Map(dropOffs.map((d) => [d.tpsId, d.totalVolume]));

  console.log("Adjusting max capacities based on status rules:");
  console.log(" - CRITICAL: Volume is 80% - 95% of Max");
  console.log(" - WARNING: Volume is 65% - 79% of Max");
  console.log(" - OK: Volume is < 65% of Max\n");

  for (const tps of tpsLocations) {
    const currentVolume = volumeMap.get(tps.id) || 0;
    let newMaxCapacity = 5000; // Default fallback

    if (currentVolume > 0) {
      if (tps.capacityStatus === "CRITICAL") {
        // If it's critical, the current volume should be ~90% of max
        // Max = Volume / 0.9
        newMaxCapacity = Math.round(currentVolume / 0.9);
      } else if (tps.capacityStatus === "WARNING") {
        // If it's warning, the current volume should be ~75% of max
        // Max = Volume / 0.75
        newMaxCapacity = Math.round(currentVolume / 0.75);
      } else {
        // If it's OK, the current volume should be ~40% of max
        // Max = Volume / 0.4
        newMaxCapacity = Math.round(currentVolume / 0.4);
        // Ensure even an empty OK TPS has a reasonable baseline capacity
        if (newMaxCapacity < 2000) newMaxCapacity = 5000;
      }
    }

    console.log(
      `[${tps.name}] Status: ${tps.capacityStatus} | Vol: ${currentVolume}kg -> Set Max to: ${newMaxCapacity}kg`,
    );

    await db
      .update(bali_tps)
      .set({ maxCapacityKg: newMaxCapacity })
      .where(eq(bali_tps.id, tps.id));
  }

  console.log(
    "\n✅ Successfully updated all max capacities to align realistically with their assigned statuses.",
  );
  process.exit(0);
}

adjustMaxCapacities().catch(console.error);
