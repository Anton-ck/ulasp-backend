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

router.get(
  "/freeDiskSpace",
  authenticateAdmin,
  permisionsEditor,
  controllers.getFreeDiskSpace
);

router.post(
  "/pics/create",
  authenticateAdmin,
  permisionsEditor,
  upload.single("picsURL"),
  controllers.uploadPics
);

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
  "/playlist/:id",
  authenticateAdmin,
  permisionsEditor,
  isValid,
  controllers.findPlayListById
);

router.patch(
  "/playlist/update/:id",
  authenticateAdmin,
  permisionsEditor,
  isValid,
  controllers.updatePlaylistById
);


router.patch(
  "/playlist/sortupdate/:id",
  authenticateAdmin,
  permisionsEditor,
  isValid,
  controllers.updatePlaylistsSortedTracks
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

router.patch(
  "/genres/update/:id",
  authenticateAdmin,
  permisionsEditor,
  upload.single("picsURL"),

  controllers.updateGenreById
);

router.delete(
  "/genres/delete/:id",
  authenticateAdmin,
  permisionsEditor,
  controllers.deleteGenre
);

// router.get(
//   "/genre/:id/tracks",

//   controllers.getTracksInGenre
// );

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

router.delete(
  "/playlist/:playlistId/tracks/delete/:trackId",

  controllers.deleteTrackInPlaylist
);

router.delete(
  "/tracks/delete/:id",
  authenticateAdmin,
  permisionsEditor,
  controllers.deleteTrack
);

router.post(
  "/tracks/upload",

  uploadTrack.single("trackURL"),

  controllers.uploadTrack
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

router.get(
  "/shops/:id",
  authenticateAdmin,
  permisionsEditor,
  controllers.getShopById
);

router.patch(
  "/shops/update/:id",
  authenticateAdmin,
  permisionsEditor,
  upload.single("picsURL"),

  controllers.updateShopById
);

router.delete(
  "/shops/delete/:id",
  authenticateAdmin,
  permisionsEditor,
  controllers.deleteShop
);

router.post(
  "/shop/shopitem/create/:shopId",
  authenticateAdmin,
  permisionsEditor,
  controllers.createCategoryShop
);

router.get(
  "/shops/shopitem/:id",
  authenticateAdmin,
  permisionsEditor,
  controllers.getCategoryShopById
);

router.patch(
  "/shops/shopitem/update/:id",
  authenticateAdmin,
  permisionsEditor,
  upload.single("picsURL"),

  controllers.updateCategoryShopById
);

router.delete(
  "/shop/shopitem/delete/:id",
  authenticateAdmin,
  permisionsEditor,
  controllers.deleteCategoryShop
);

router.post(
  "/shop/shopitem/subcategory/create/:shopItemId",
  authenticateAdmin,
  permisionsEditor,
  controllers.createSubCategoryShop
);

router.get(
  "/shops/shopitem/subcategory/:id",
  authenticateAdmin,
  permisionsEditor,
  controllers.getSubCategoryShopById
);

router.patch(
  "/shops/shopitem/subcategory/update/:id",
  authenticateAdmin,
  permisionsEditor,
  upload.single("picsURL"),

  controllers.updateSubCategoryShopById
);

router.delete(
  "/shop/shopitem/subcategory/delete/:id",
  authenticateAdmin,
  permisionsEditor,
  controllers.deleteSubCategoryShop
);

router.post(
  "/shoplibrary/playlist/create/:idShopLibrary",
  authenticateAdmin,
  permisionsEditor,
  upload.single("picsURL"),
  validateBody(playListSchema),
  controllers.createPlayListInShopLibrary
);

router.delete(
  "/shopsubcategory/:idSubCategory/delete/:idPlaylist",
  authenticateAdmin,
  permisionsEditor,
  controllers.deletePlaylistInShopSubCategory
);

router.delete(
  "/shopitem/:idShopItem/delete/:idPlaylist",
  authenticateAdmin,
  permisionsEditor,
  controllers.deletePlaylistInShopItem
);

// router.post("/test", controllers.test);

export default router;
