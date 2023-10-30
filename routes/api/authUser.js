import express from "express";

import { loginUserSchema, createUserSchema } from "../../schemas/userSchema.js";

import validateBody from "../../middlewares/validateBody.js";
import isEmptyBody from "../../middlewares/isEmptyBody.js";

import upload from "../../middlewares/upload.js";
import { authenticatUser } from "../../middlewares/authenticate.js";
import controllers from "../../controllers/authUser.js";
import controllersUser from "../../controllers/controlUser.js";

const router = express.Router();

router.post(
  "/signin",
  isEmptyBody,
  validateBody(loginUserSchema),
  controllers.userSignIn
);

router.post("/create", controllers.createUser);

router.get("/current", authenticatUser, controllers.getCurrentUser);

router.post("/logout", authenticatUser, controllers.logoutUser);

router.post(
  "/playlist/create",
  authenticatUser,
  controllersUser.createPlayList
);

export default router;
