import express from "express";

import validateBody from "../../middlewares/validateBody.js";
import isEmptyBody from "../../middlewares/isEmptyBody.js";
import { authenticateAdmin } from "../../middlewares/authenticate.js";
import controllers from "../../controllers/controlEditor.js";
import { permisionsEditor } from "../../middlewares/permitionsEditor.js";
import { playListSchema } from "../../schemas/editorShema.js";
import isValid from "../../middlewares/isValid.js";
import upload from "../../middlewares/upload.js";
import uploadTrack from "../../middlewares/uploadTrack.js";

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

router.post("/genre/create", controllers.createGenre);

router.post(
  "/genre/playlist/create/:id",
  authenticateAdmin,
  permisionsEditor,
  isValid,
  isEmptyBody,
  controllers.createPlayListByGenre
);

router.post(
  "/tracks/upload/:id",
  uploadTrack.single("trackURL"),
  controllers.uploadTrack
);

router.post(
  "/tracks/upload",
  uploadTrack.single("trackURL"),
  controllers.uploadTrack
);
export default router;
