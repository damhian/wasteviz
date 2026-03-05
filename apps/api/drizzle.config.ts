import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost/dummy',
  },
  // CRITICAL DATA PRESERVATION: Only touch tables prefixed with "bali_"
  tablesFilter: ["bali_*"],
});
