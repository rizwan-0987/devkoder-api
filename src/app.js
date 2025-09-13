import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import rateLimit from "express-rate-limit";
import applicationsRouter from "./routes/applications.routes.js";
import { connectDB } from "./db.js";

const app = express();
app.set("trust proxy", 1);

// --- DB connect (Mongoose caches the connection) ---
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error("Missing MONGO_URI");
await connectDB(MONGO_URI);

// --- CORS (single, robust setup) ---
const allowList = new Set(
    (process.env.CORS_ORIGIN || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
);

const corsOptions = {
    origin(origin, cb) {
        if (!origin) return cb(null, true); // allow curl/Postman
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
app.options("*", cors(corsOptions)); // answer preflights

// --- Security, logs, parsing, rate-limit ---
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "100kb" }));
app.use("/api/", rateLimit({ windowMs: 60_000, max: 60 }));

// --- Routes ---
app.get("/health", (req, res) => res.json({ ok: true, uptime: process.uptime() }));
app.use("/api/applications", applicationsRouter);

// 404
app.use((req, res) => res.status(404).json({ ok: false, message: "Not found" }));

export default app;
