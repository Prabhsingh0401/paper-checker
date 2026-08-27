import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import uploadRoute from "./routes/upload.route";
import statusRoute from "./routes/status.route";
import mappingRoute from "./routes/mapping.route";
import gradingRoute from "./routes/grading.route";
import errorHandler from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT || 4000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: ALLOWED_ORIGIN, credentials: true }));
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/upload", uploadRoute);
app.use("/api/status", statusRoute);
app.use("/api/mapping", mappingRoute);
app.use("/api/grading", gradingRoute);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);

  // Keep Render free tier alive by pinging self every 10 minutes
  const SELF_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  setInterval(() => {
    fetch(`${SELF_URL}/api/health`).catch(() => {});
  }, 10 * 60 * 1000);
});
