import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import dotenv from "dotenv";
import path from "path";

// Load the root .env.local file
dotenv.config({ path: path.resolve(__dirname, "../../../../.env.local") });

// FALLBACK SHIELD: Prevent app from crashing or exposing production DB by accident if env is missing
const connectionString = process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost/dummy';

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
