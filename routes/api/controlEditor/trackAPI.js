import express from "express";
import controllersTrack from "../../../controllers/controlsEditor/trackEditorCTRL.js";
import { authenticateAdmin } from "../../../middlewares/authenticate.js";
import { permisionsEditor } from "../../../middlewares/permitionsEditor.js";
import validateBody from "../../../middlewares/validateBody.js";
import isValid from "../../../middlewares/isValid.js";
import upload from "../../../middlewares/upload.js";
import uploadTrack from "../../../middlewares/uploadTrack.js";
import { playListSchema } from "../../../schemas/editorShema.js";
const router = express.Router();

router.get(
  "/tracks/latestTracks",
  authenticateAdmin,
  permisionsEditor,
  controllersTrack.latestTracks
);

router.post(
  "/tracks/upload",
  authenticateAdmin,
  permisionsEditor,
  uploadTrack.single("trackURL"),
  controllersTrack.uploadTrack
);

router.post(
  "/tracks/upload/:id",
  authenticateAdmin,
  permisionsEditor,
  uploadTrack.single("trackURL"),
  controllersTrack.uploadTrack
);

router.delete(
  "/tracks/delete/:id",
  authenticateAdmin,
  permisionsEditor,
  controllersTrack.deleteTrack
);

router.patch(
  "/tracks/addToPlaylists/:id",
  controllersTrack.addTrackToPlaylists
);

export default router;
