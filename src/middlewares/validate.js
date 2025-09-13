import { z } from "zod";

export const applicationSchema = z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    phone: z.string().max(30).optional().or(z.literal("")),
    message: z.string().max(1000).optional().or(z.literal(""))
});

export function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(422).json({
                ok: false,
                errors: result.error.issues.map(i => ({ path: i.path.join("."), message: i.message }))
            });
        }
        req.validated = result.data;
        next();
    };
}
