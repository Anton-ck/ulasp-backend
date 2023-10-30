import express from "express";

import validateBody from "../../middlewares/validateBody.js";
import isEmptyBody from "../../middlewares/isEmptyBody.js";
import { authenticateAdmin } from "../../middlewares/authenticate.js";
import controllers from "../../controllers/controlAdmin.js";
import { permisionsAdmin } from "../../middlewares/permitionsAdmin.js";
import {
  createEditorSchema,
  updateAdminInfo,
  updateAdminPassword,
} from "../../schemas/adminSchema.js";

import {
  createFopUserSchema,
  createCompanyUserSchema,
} from "../../schemas/userSchema.js";
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
  "/:id",
  authenticateAdmin,
  permisionsAdmin,
  isValid,
  controllers.getAdminById
);
router.patch(
  "/:id",
  authenticateAdmin,
  permisionsAdmin,
  isValid,
  isEmptyBody,
  validateBody(updateAdminInfo),
  controllers.updateAdminInfo
);

router.delete(
  "/:id",
  authenticateAdmin,
  permisionsAdmin,
  isValid,
  controllers.deleteAdmin
);

router.patch(
  "/password/:id",
  authenticateAdmin,
  permisionsAdmin,
  isValid,
  isEmptyBody,
  validateBody(updateAdminPassword),
  controllers.updateAdminPassword
);

router.post(
  "/create-fop",
  authenticateAdmin,
  isEmptyBody,
  validateBody(createFopUserSchema),
  controllers.createUser
);
router.post(
  "/create-company",
  authenticateAdmin,
  isEmptyBody,
  validateBody(createCompanyUserSchema),
  controllers.createUser
);

export default router;
