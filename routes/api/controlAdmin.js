import express from "express";

import validateBody from "../../middlewares/validateBody.js";
import isEmptyBody from "../../middlewares/isEmptyBody.js";
import { authenticateAdmin } from "../../middlewares/authenticate.js";
import controllers from "../../controllers/controlAdmin.js";
import { permisionsAdmin } from "../../middlewares/permitionsAdmin.js";
import { createEditorSchema } from "../../schemas/admin.js";

const router = express.Router();

router.post(
  "/create-editor",
  authenticateAdmin,
  permisionsAdmin,
  isEmptyBody,
  validateBody(createEditorSchema),
  controllers.createEditorRole
);

export default router;
