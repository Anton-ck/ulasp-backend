import express from "express";

import { adminLoginSchema, refreshSchema } from "../../schemas/adminSchema.js";

import validateBody from "../../middlewares/validateBody.js";
import isEmptyBody from "../../middlewares/isEmptyBody.js";
import { authenticateAdmin } from "../../middlewares/authenticate.js";
import upload from "../../middlewares/upload.js";

import controllers from "../../controllers/authAdmin.js";

const router = express.Router();

router.post("/signup", isEmptyBody, controllers.signUpAdmin);

router.post(
  "/signin",
  isEmptyBody,
  validateBody(adminLoginSchema),
  controllers.adminSignIn
);

router.post(
  "/refresh",
  validateBody(refreshSchema),
  controllers.getRefreshTokenAdmin
);

router.get("/current", authenticateAdmin, controllers.getCurrentAdmin);

router.post("/logout", authenticateAdmin, controllers.logoutAdmin);

router.patch(
  "/avatars",
  authenticateAdmin,
  upload.single("avatarURL"),
  controllers.updateAdminAvatar
);

export default router;
