export function requireAdminKey(req, res, next) {
    const headerKey = req.header("x-admin-key");
    if (!process.env.ADMIN_KEY || headerKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({ ok: false, message: "Unauthorized" });
    }
    next();
}
