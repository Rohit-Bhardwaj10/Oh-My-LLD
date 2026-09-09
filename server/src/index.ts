import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import problemsRouter from "./routes/problems";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({
  origin: ["http://localhost:3000"], // Next.js frontend
  credentials: true,
}));

app.use(express.json());

app.use("/api/auth", toNodeHandler(auth));
app.use("/api/problems", problemsRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
