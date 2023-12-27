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

router.get("/playlist/latest", controllers.latestPlaylists);

router.get(
  "/playlist/count",
  authenticateAdmin,
  permisionsEditor,
  controllers.playlistsCount
);

router.get(
  "/playlist/:id",
  authenticateAdmin,
  permisionsEditor,
  isValid,
  controllers.findPlayListById
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
  "/genres/all",
  authenticateAdmin,
  permisionsEditor,
  controllers.allGenres
);

router.post("/genres/create", controllers.createGenre);

router.get(
  "/genres/:id",
  authenticateAdmin,
  permisionsEditor,
  controllers.findGenreById
);

router.delete(
  "/genres/delete/:id",
  authenticateAdmin,
  permisionsEditor,
  controllers.deleteGenre
);

router.post(
  "/genre/playlist/create/:id",
  authenticateAdmin,
  permisionsEditor,
  isValid,
  upload.single("picsURL"),
  validateBody(playListSchema),
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

router.get(
  "/tracks/count",
  authenticateAdmin,
  // permisionsEditor,
  controllers.countTracks
);

router.get(
  "/tracks/latestTracks",
  authenticateAdmin,
  permisionsEditor,
  controllers.latestTracks
);

router.get(
  "/shops/all",
  authenticateAdmin,
  permisionsEditor,
  controllers.allShops
);
router.post(
  "/shops/create",
  authenticateAdmin,
  permisionsEditor,
  controllers.createShop
);
router.delete(
  "/shops/delete/:id",
  authenticateAdmin,
  permisionsEditor,
  controllers.deleteShop
);
export default router;
