import { Application } from "../models/Application.js";

export async function createApplication(req, res) {
    const { name, email, phone, message } = req.validated;

    const doc = await Application.create({
        name,
        email,
        phone,
        message,
        sourceIp: req.ip,
        userAgent: req.headers["user-agent"]
    });

    return res.status(201).json({ ok: true, data: { id: doc._id } });
}

export async function listApplications(req, res) {
    // Basic listing for admin, newest first
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        Application.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Application.countDocuments()
    ]);

    return res.json({
        ok: true,
        page,
        limit,
        total,
        items
    });
}
