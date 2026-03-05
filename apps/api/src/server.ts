import Fastify from "fastify";
import cors from "@fastify/cors";
import { dropOffRepository } from "./repositories/dropOffRepository";
import { tpsRepository } from "./repositories/tpsRepository";

const app = Fastify({
  logger: true,
});

// Configure CORS
app.register(cors, {
  origin: "*", // allow Next.js app on port 3000 to fetch without errors
});

// GET /api/health
app.get("/api/health", async (request, reply) => {
  return { status: "ok", timestamp: Date.now() };
});

// GET /api/tps
app.get("/api/tps", async (request, reply) => {
  try {
    const records = await tpsRepository.findAll();
    return records;
  } catch (error) {
    app.log.error(error);
    return reply.status(500).send({ error: "Failed to fetch TPS locations" });
  }
});

// GET /api/drop-offs
app.get("/api/drop-offs", async (request, reply) => {
  try {
    const records = await dropOffRepository.findAll();
    return records;
  } catch (error) {
    app.log.error(error);
    return reply.status(500).send({ error: "Failed to fetch drop-offs" });
  }
});

// Boot the server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "4000");
    await app.listen({ port, host: "0.0.0.0" });
    console.log(`[Fastify] API Server is running on http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
