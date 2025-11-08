// routes/client.routes.js
import express from "express";
import { consultantController } from "../controllers/index.js";
import { auth, isAdmin, validateParams } from "../middlewares/index.js";
import { teamIdParamSchema } from "../validations/teamSelection.validation.js";

const router = express.Router();

router.use(auth);

// --- IMPORTANT: Specific routes MUST come BEFORE /:consultantId ---

// Consultant browsing routes (specific paths)
router.get("/", consultantController.getAllConsultants);
router.get("/search", consultantController.searchConsultants);
router.get("/featured", consultantController.getFeaturedConsultants);
router.get("/skills", consultantController.getConsultantsBySkills);
router.get("/experience", consultantController.getConsultantsByExperience);

// Consultant-specific routes (MOVED BEFORE /:consultantId)
router.get("/status/me", consultantController.getConsultantApprovalStatus);
router.get("/assignments/me", consultantController.getMyTeamAssignments);
router.get("/teams/:teamId", validateParams(teamIdParamSchema), consultantController.getTeamById);

// Admin management routes (MOVED BEFORE /:consultantId)
router.get("/admin", isAdmin, consultantController.adminGetAllConsultants);
router.put("/admin/approve/:consultantId", isAdmin, consultantController.adminApproveConsultant);
router.put("/admin/disapprove/:consultantId", isAdmin, consultantController.adminDisapproveConsultant);
router.put("/admin/level/:consultantId", isAdmin, consultantController.adminUpdateLevel);

// ⚠️ Parameterized route MUST be LAST
router.get("/:consultantId", consultantController.getConsultantDetails);

export default router;