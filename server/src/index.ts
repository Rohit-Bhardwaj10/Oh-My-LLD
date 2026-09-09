import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import problemsRouter from "./routes/problems";
import attemptsRouter from "./routes/attempts";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, "http://localhost:3000"] : ["http://localhost:3000"],
  credentials: true,
}));

// NOTE: Do NOT use express.json() before the auth handler.
// better-auth's toNodeHandler does its own body parsing.
// Applying express.json() first would consume the request stream,
// leaving better-auth with an empty body (causing 400 Bad Request).
app.use("/api/auth", toNodeHandler(auth));

app.use(express.json());

app.use("/api/problems", problemsRouter);
app.use("/api/attempts", attemptsRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

import { prisma } from "./auth";

// Keep Neon awake — ping every 4 minutes
setInterval(async () => {
  await prisma.$queryRaw`SELECT 1`.catch(() => {});
}, 4 * 60 * 1000);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
