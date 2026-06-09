import "dotenv/config";
import cors from "cors";
import express from "express";
import { chatRouter } from "./routes/chat.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { prisma } from "./lib/prisma.js";

const app = express();
const port = Number(process.env.PORT) || 4000;
const host = process.env.HOST ?? "127.0.0.1";

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173"
  })
);
app.use(express.json({ limit: "64kb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/chat", chatRouter);
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(port, host, () => {
  console.log(`Backend listening on http://${host}:${port}`);
});

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
