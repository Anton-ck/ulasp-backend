import express from "express";
import controllersTrack from "../../../controllers/controlsEditor/trackEditorCTRL.js";
import { authenticateAdmin } from "../../../middlewares/authenticate.js";
import { permisionsEditor } from "../../../middlewares/permitionsEditor.js";
import validateBody from "../../../middlewares/validateBody.js";
import isValid from "../../../middlewares/isValid.js";
import upload from "../../../middlewares/upload.js";
import { playListSchema } from "../../../schemas/editorShema.js";
const router = express.Router();

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
