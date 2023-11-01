import express from "express";

import validateBody from "../../middlewares/validateBody.js";
import isEmptyBody from "../../middlewares/isEmptyBody.js";
import { authenticateAdmin } from "../../middlewares/authenticate.js";
import controllers from "../../controllers/controlEditor.js";
import { permisionsEditor } from "../../middlewares/permitionsEditor.js";
import { playListSchema } from "../../schemas/editorShema.js";
import isValid from "../../middlewares/isValid.js";
import upload from "../../middlewares/upload.js";

const router = express.Router();

router.post(
  "/playlist/create",
  authenticateAdmin,
  permisionsEditor,
  upload.single("picsURL"),
  validateBody(playListSchema),
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

router.get(
  "/playlist/count",
  authenticateAdmin,
  permisionsEditor,
  controllers.playlistsCount
);

router.get("/playlist/latest", controllers.latestPlaylists);
export default router;
