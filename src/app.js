import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import rateLimit from "express-rate-limit";
import applicationsRouter from "./routes/applications.routes.js";
import { connectDB } from "./db.js";

const app = express();
app.set("trust proxy", 1);

// connect (cached by mongoose under the hood; Vercel will keep warm between calls)
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error("Missing MONGO_URI");
await connectDB(MONGO_URI);

// CORS
const allowed = (process.env.CORS_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean);
app.use(cors({
    origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (allowed.length === 0 || allowed.includes(origin)) return cb(null, true);
        return cb(new Error("Not allowed by CORS"));
    },
    credentials: true
}));

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "100kb" }));
app.use("/api/", rateLimit({ windowMs: 60_000, max: 60 }));

app.get("/health", (req, res) => res.json({ ok: true, uptime: process.uptime() }));
app.use("/api/applications", applicationsRouter);
app.use((req, res) => res.status(404).json({ ok: false, message: "Not found" }));

export default app;
