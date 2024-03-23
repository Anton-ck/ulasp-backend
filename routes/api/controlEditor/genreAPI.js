import express from "express";
import controllersGenre from "../../../controllers/controlsEditor/genreEditorCTRL.js";
import { authenticateAdmin } from "../../../middlewares/authenticate.js";
import { permisionsEditor } from "../../../middlewares/permitionsEditor.js";
import upload from "../../../middlewares/upload.js";

const router = express.Router();

router.get(
  "/genres/all",
  authenticateAdmin,
  permisionsEditor,
  controllersGenre.allGenres
);

router.post(
  "/genres/create",
  authenticateAdmin,
  permisionsEditor,
  controllersGenre.createGenre
);

router.get("/genres/findForUpdate", controllersGenre.findGenreForUpdate);

router.get(
  "/genres/:id",
  authenticateAdmin,
  permisionsEditor,
  controllersGenre.findGenreById
);

router.patch(
  "/genres/update/:id",
  authenticateAdmin,
  permisionsEditor,
  upload.single("picsURL"),

  controllersGenre.updateGenreById
);

router.delete(
  "/genres/delete/:id",
  authenticateAdmin,
  permisionsEditor,
  controllersGenre.deleteGenre
);

export default router;
