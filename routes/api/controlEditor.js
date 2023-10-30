import express from "express";

import validateBody from "../../middlewares/validateBody.js";
import isEmptyBody from "../../middlewares/isEmptyBody.js";
import { authenticateAdmin } from "../../middlewares/authenticate.js";
import controllers from "../../controllers/controlEditor.js";
import { permisionsEditor } from "../../middlewares/permitionsEditor.js";
import {
  createEditorSchema,
  updateAdminInfo,
  updateAdminPassword,
} from "../../schemas/adminSchema.js";
import isValid from "../../middlewares/isValid.js";
import upload from "../../middlewares/upload.js";

const router = express.Router();

router.post(
  "/playlist/create",
  authenticateAdmin,
  permisionsEditor,
  isEmptyBody,
  controllers.createPlayList
);

router.post(
  "/pics/create",
  authenticateAdmin,
  permisionsEditor,
  upload.single("picsURL"),
  controllers.uploadPics
);

router.delete(
  "/playlist/delete/:id",
  authenticateAdmin,
  permisionsEditor,
  isValid,
  controllers.deletePlaylist
);
export default router;
