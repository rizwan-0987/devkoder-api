import { Application } from "../models/Application.js";

export async function createApplication(req, res, next) {
    try {
        const doc = await Application.create({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            message: req.body.message,
        });
        return res.status(201).json({ ok: true, data: { id: doc._id } });
    } catch (err) {
        // Handle Mongo duplicate key (unique email/phone)
        if (err && (err.code === 11000 || /E11000/i.test(err.message))) {
            return res
                .status(409)
                .json({ ok: false, message: "Duplicate: email or phone already exists." });
        }
        return next(err); // let the error handler format other errors
    }
}

export async function listApplications(req, res, next) {
    try {
        const page = Math.max(parseInt(req.query.page || "1", 10), 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit || "50", 10), 1), 200);
        const items = await Application.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        return res.json({ ok: true, data: items });
    } catch (err) {
        next(err);
    }
}
export async function exportApplicationsCsv(req, res, next) {
    try {
        const items = await Application.find().sort({ createdAt: -1 }).lean();

        const headers = ["_id", "name", "email", "phone", "message", "createdAt"];
        const rows = items.map((i) => [
            i._id ?? "",
            i.name ?? "",
            i.email ?? "",
            i.phone ?? "",
            String(i.message ?? "").replace(/\r?\n/g, " ").trim(),
            i.createdAt ? new Date(i.createdAt).toISOString() : "",
        ]);

        const csv =
            [headers, ...rows]
                .map((r) =>
                    r
                        .map(String)
                        .map((s) => `"${s.replaceAll('"', '""')}"`)
                        .join(",")
                )
                .join("\n");

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", "attachment; filename=applications.csv");
        res.send(csv);
    } catch (err) {
        next(err);
    }
}