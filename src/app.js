import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import rateLimit from "express-rate-limit";
import applicationsRouter from "./routes/applications.routes.js";
import { connectDB } from "./db.js";

const app = express();
app.set("trust proxy", 1);

// --- CORS (answer preflights BEFORE any DB work) ---
const allowList = new Set(
    (process.env.CORS_ORIGIN || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
);

const corsOptions = {
    origin(origin, cb) {
        if (!origin) return cb(null, true); // curl/Postman
        return allowList.has(origin)
            ? cb(null, true)
            : cb(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-admin-key"],
    optionsSuccessStatus: 204,
    maxAge: 86400,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // preflights exit fast

// --- Security / logs / body ---
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "100kb" }));

// --- Rate limit (inside Express on Vercel the path has no /api prefix) ---
app.use(rateLimit({
    windowMs: 60_000,
    max: 60,
    skip: (req) => req.method === "OPTIONS",
}));

// --- Health (no DB) ---
app.get("/health", (req, res) => res.json({ ok: true, uptime: process.uptime() }));

// --- Lazy DB: only connect for real requests (skip OPTIONS) ---
async function ensureDB(req, res, next) {
    if (req.method === "OPTIONS") return next();
    try {
        await connectDB(process.env.MONGO_URI);
        next();
    } catch (e) {
        next(e);
    }
}

// --- Routes (IMPORTANT: no /api prefix here) ---
app.use("/applications", ensureDB, applicationsRouter);

// 404
app.use((req, res) => res.status(404).json({ ok: false, message: "Not found" }));
// Error handler (must have 4 args)
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    if (res.headersSent) return next(err);

    // Nice message for CORS denials, etc.
    if (err?.message?.startsWith("Not allowed by CORS")) {
        return res.status(403).json({ ok: false, message: "CORS blocked" });
    }

    const status = err.status || 500;
    res.status(status).json({
        ok: false,
        message: process.env.NODE_ENV === "production" ? "Server error" : err.message,
    });
});
export default app;
