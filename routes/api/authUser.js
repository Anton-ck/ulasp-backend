import express from "express";

import { loginUserSchema, createUserSchema } from "../../schemas/userSchema.js";

import validateBody from "../../middlewares/validateBody.js";
import isEmptyBody from "../../middlewares/isEmptyBody.js";

import upload from "../../middlewares/upload.js";

import controllers from "../../controllers/authUser.js";

const router = express.Router();

router.post(
  "/signin",
  isEmptyBody,
  validateBody(loginUserSchema),
  controllers.userSignIn
);

router.post("/create", validateBody(createUserSchema), controllers.createUser);

router.get("/current", controllers.getCurrentUser);

router.post("/logout", controllers.logoutUser);

export default router;
