import express from "express";

import validateBody from "../../middlewares/validateBody.js";
import isEmptyBody from "../../middlewares/isEmptyBody.js";
import {
  authenticatUser,
  authenticateAdmin,
} from "../../middlewares/authenticate.js";
import controllers from "../../controllers/controlUser.js";
import { permisionsAdmin } from "../../middlewares/permitionsAdmin.js";

import {
  createFopUserSchema,
  createCompanyUserSchema,
} from "../../schemas/userSchema.js";
import isValid from "../../middlewares/isValid.js";

const router = express.Router();
// router.get("/", authenticateAdmin, permisionsAdmin, controllers.getAllUsers);

router.get("/playlist/latest", controllers.latestPlaylists);

router.get(
  "/genres/all",
  authenticatUser,

  controllers.allGenres
);

router.get("/tracks/latestTracks", authenticatUser, controllers.latestTracks);

router.get(
  "/shops/all",
  authenticatUser,
   controllers.allShops
);

export default router;
