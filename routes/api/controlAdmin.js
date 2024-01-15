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
  "/users",
  authenticateAdmin,
  permisionsAdmin,
  controllers.getAllUsers
);
router.get(
  "/tracks/count",
  authenticateAdmin,
  permisionsAdmin,
  controllers.countTracks
);
router.get(
  "/users/count",
  authenticateAdmin,
  permisionsAdmin,
  controllers.countClients
);

router.get(
  "/newclients/count",
  authenticateAdmin,
  permisionsAdmin,
  controllers.countNewClients
);
router.get(
  "/onlineclients/count",
  authenticateAdmin,
  permisionsAdmin,
  controllers.countOnlineClients
);

router.get(
  "/newclientsbymonth/count",
  authenticateAdmin,
  permisionsAdmin,
  controllers.countNewClientsByMonth
);


router.get(
  "/users/:id",
  authenticateAdmin,
  permisionsAdmin,
  controllers.getUserById
);

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
router.patch(
  "/users/:id",
  authenticateAdmin,
  permisionsAdmin,
  // isValid,
  controllers.updateUserInfo
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

router.delete(
  "/users/:id",
  authenticateAdmin,
  permisionsAdmin,
  isValid,
  controllers.deleteUser
);

router.patch(
  "/users/status/:id",
  authenticateAdmin,
  permisionsAdmin,
  isValid,
  controllers.toggleUserStatus
);
router.patch(
  "/users/access/:id",
  authenticateAdmin,
  permisionsAdmin,
  isValid,
  controllers.toggleUserAccess
);


export default router;
