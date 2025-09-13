export function requireAdminKey(req, res, next) {
    const headerKey = req.header("x-admin-key");
    if (!process.env.ADMIN_KEY || headerKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({ ok: false, message: "Unauthorized" });
    }
    next();
}
import jwt from "jsonwebtoken";

export function requireAdmin(req, res, next) {
    // Option 1: x-admin-key (CLI/Postman)
    const key = req.header("x-admin-key");
    if (key && key === process.env.ADMIN_KEY) return next();

    // Option 2: Bearer JWT (browser SPA)
    const auth = req.headers.authorization || "";
    const [scheme, token] = auth.split(" ");
    if (scheme === "Bearer" && token) {
        try {
            const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
            if (payload?.role === "admin") return next();
        } catch (_) { }
    }

    // Option 3: Basic (fallback)
    if (scheme === "Basic" && token) {
        const [user, pass] = Buffer.from(token, "base64").toString().split(":");
        const ADMIN_USER = process.env.ADMIN_USER || "admin";
        const ADMIN_PASS = process.env.ADMIN_PASS || process.env.ADMIN_KEY;
        if (user === ADMIN_USER && pass === ADMIN_PASS) return next();
    }

    res.set("WWW-Authenticate", 'Basic realm="DevKoder Admin"');
    return res.status(401).json({ ok: false, message: "Unauthorized" });
}
