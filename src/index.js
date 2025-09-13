import "dotenv/config";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { connectDB } from "./db.js";
import applicationsRouter from "./routes/applications.routes.js";

const app = express();

// trust proxy so req.ip works behind proxies
app.set("trust proxy", 1);

// CORS: allow configured origins
const allowed = (process.env.CORS_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean);
app.use(cors({
    origin: (origin, cb) => {
        if (!origin) return cb(null, true);                // allow curl/postman
        if (allowed.length === 0 || allowed.includes(origin)) return cb(null, true);
        return cb(new Error("Not allowed by CORS"));
    },
    credentials: true
}));

// Security & Logs
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Body parsing
app.use(express.json({ limit: "100kb" }));

// Rate limiting (basic)
app.use("/api/", rateLimit({ windowMs: 60_000, max: 60 })); // 60 req/min

// Health
app.get("/health", (req, res) => res.json({ ok: true, uptime: process.uptime() }));

// Routes
app.use("/api/applications", applicationsRouter);

// 404
app.use((req, res) => res.status(404).json({ ok: false, message: "Not found" }));

// Error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ ok: false, message: err.message || "Server error" });
});

// --- Boot ---
const PORT = Number(process.env.PORT || 8080);
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ Missing MONGO_URI in .env");
    process.exit(1);
}

connectDB(MONGO_URI)
    .then(() => {
        app.listen(PORT, () => console.log(`✅ API running on http://localhost:${PORT}`));
    })
    .catch((e) => {
        console.error("❌ Mongo connect error:", e);
        process.exit(1);
    });
