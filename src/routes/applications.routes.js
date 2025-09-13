import { Router } from "express";
import { createApplication, listApplications } from "../controllers/applications.controller.js";
import { validateBody, applicationSchema } from "../middlewares/validate.js";
import { requireAdminKey } from "../middlewares/adminKey.js";
import { requireAdmin } from "../middlewares/adminKey.js";

const router = Router();

router.get("/", requireAdmin, listApplications);


// public: create application
router.post("/", validateBody(applicationSchema), createApplication);

// admin: list applications
router.get("/", requireAdminKey, listApplications);

export default router;
