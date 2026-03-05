import { db } from "../db/index";
import { bali_waste_drop_offs } from "../db/schema";
import { isNull, eq } from "drizzle-orm";

export class DropOffRepository {
  /**
   * Fetch all non-deleted drop-offs.
   * STRICT ENFORCEMENT: All records where deletedAt is NOT NULL are excluded.
   */
  async findAll() {
    return await db
      .select()
      .from(bali_waste_drop_offs)
      .where(isNull(bali_waste_drop_offs.deletedAt));
  }

  /**
   * Log a new drop off
   */
  async create(data: { tpsId: number; driverName: string; volumeKg: number }) {
    return await db.insert(bali_waste_drop_offs).values(data).returning();
  }

  /**
   * Archive a drop off (Soft Delete)
   */
  async softDelete(id: number) {
    return await db
      .update(bali_waste_drop_offs)
      .set({ deletedAt: new Date() })
      .where(eq(bali_waste_drop_offs.id, id))
      .returning();
  }
}

export const dropOffRepository = new DropOffRepository();
