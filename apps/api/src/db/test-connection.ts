import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import * as path from "path";

// Load the root .env.local file
dotenv.config({ path: path.resolve(__dirname, "../../../../.env.local") });

async function verifyConnection() {
  const url = process.env.DATABASE_URL;
  if (!url || url.includes("dummy")) {
    console.error("❌ ERROR: DATABASE_URL is not configured properly in .env.local.");
    console.error("Please add a real Neon connection string to the workspace root's .env.local file.");
    process.exit(1);
  }

  try {
    console.log("Testing connection to Neon Database...");
    const sql = neon(url);
    const result = await sql`SELECT 1 as result`;
    
    if (result?.[0]?.result === 1) {
      console.log("✅ SUCCESS: Successfully connected to Neon PostgreSQL Database!");
    } else {
      console.error("❌ UNEXPECTED: Connection successful but query failed.");
    }
  } catch (error) {
    console.error("❌ FAILURE: Could not connect to the database.");
    console.error(error);
    process.exit(1);
  }
}

verifyConnection();
