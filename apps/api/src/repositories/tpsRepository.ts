import { db } from "../db/index";
import { bali_tps } from "../db/schema";
import { eq } from "drizzle-orm";

export class TpsRepository {
  /**
   * Fetch all TPS locations
   */
  async findAll() {
    return await db.select().from(bali_tps);
  }

  /**
   * Fetch a specific TPS location
   */
  async findById(id: number) {
    const result = await db.select().from(bali_tps).where(eq(bali_tps.id, id));
    return result[0];
  }
}

export const tpsRepository = new TpsRepository();
