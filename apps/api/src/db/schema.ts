import { pgTable, serial, text, doublePrecision, integer, timestamp, varchar } from "drizzle-orm/pg-core";

export const bali_tps = pgTable("bali_tps", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  capacityStatus: varchar("capacityStatus", { length: 50 }).notNull(), // e.g., 'OK', 'WARNING', 'CRITICAL'
});

export const bali_waste_drop_offs = pgTable("bali_waste_drop_offs", {
  id: serial("id").primaryKey(),
  tpsId: integer("tpsId").references(() => bali_tps.id).notNull(),
  driverName: varchar("driverName", { length: 255 }).notNull(),
  volumeKg: doublePrecision("volumeKg").notNull(),
  droppedAt: timestamp("droppedAt").defaultNow().notNull(),
  deletedAt: timestamp("deletedAt"), // For soft-deletes
});
