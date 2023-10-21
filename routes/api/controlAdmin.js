import express from "express";

import validateBody from "../../middlewares/validateBody.js";
import isEmptyBody from "../../middlewares/isEmptyBody.js";
import { authenticateAdmin } from "../../middlewares/authenticate.js";
import controllers from "../../controllers/controlAdmin.js";
import { permisionsAdmin } from "../../middlewares/permitionsAdmin.js";
import { createEditorSchema } from "../../schemas/admin.js";
import isValid from "../../middlewares/isValid.js";

const router = express.Router();

router.post(
  "/create-editor",
  authenticateAdmin,
  permisionsAdmin,
  isEmptyBody,
  validateBody(createEditorSchema),
  controllers.createEditorRole
);

router.get("/", authenticateAdmin, permisionsAdmin, controllers.getAllAdmin);

router.get(
  "/:adminID",
  authenticateAdmin,
  permisionsAdmin,
  isValid,
  controllers.getAdminById
);
router.patch(
  "/:adminID",
  authenticateAdmin,
  permisionsAdmin,
  isValid,
  isEmptyBody,
  // validateBody(createEditorSchema),
  controllers.updateAdminInfo
);

router.delete(
  "/:adminID",
  authenticateAdmin,
  permisionsAdmin,
  isValid,
  controllers.deleteAdmin
);

export default router;
