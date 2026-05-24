import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import { testSupabaseConnection } from "./src/db/supabase";
import webhookRouter from "./src/routes/webhook";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());

// Webhook must use raw body for HMAC — register before express.json()
app.use("/webhooks", express.raw({ type: "application/json" }), webhookRouter);

app.use(express.json());

app.get("/health", async (_req, res) => {
  let database: "connected" | "disconnected" = "connected";

  try {
    await testSupabaseConnection();
  } catch (error) {
    database = "disconnected";
    console.error("[health] Supabase check failed:", error);
  }

  res.json({
    status: database === "connected" ? "ok" : "degraded",
    message: "Backend is running",
    database,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
