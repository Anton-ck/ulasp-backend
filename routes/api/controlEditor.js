import express from "express";

import validateBody from "../../middlewares/validateBody.js";
import isEmptyBody from "../../middlewares/isEmptyBody.js";
import { authenticateAdmin } from "../../middlewares/authenticate.js";
import controllers from "../../controllers/controlEditor.js";
import controllersGenre from "../../controllers/controlsEditor/genreEditorCTRL.js";
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



// router.get(
//   "/genre/:id/tracks",

//   controllers.getTracksInGenre
// );



router.post(
  "/tracks/upload/:id",

  uploadTrack.single("trackURL"),
  controllers.uploadTrack
);

router.delete(
  "/playlist/:playlistId/tracks/delete/:trackId",

  controllers.deleteTrackInPlaylist
);



router.post(
  "/tracks/upload",

  uploadTrack.single("trackURL"),

  controllers.uploadTrack
);

router.get(
  "/tracks/getTracksInChart",
  // authenticateAdmin,
  // permisionsEditor,
  controllers.getTracksInChart
);

router.get(
  "/tracks/latestTracks",
  authenticateAdmin,
  permisionsEditor,
  controllers.latestTracks
);

router.patch(
  "/tracks/updateTrackCover",
  authenticateAdmin,
  permisionsEditor,
  controllers.updateTrackPicture
);

router.patch(
  "/tracks/addTrackToChart/:id",
  authenticateAdmin,
  permisionsEditor,
  controllers.addTrackToChart
);

router.patch(
  "/tracks/removeTrackFromChart/:id",
  authenticateAdmin,
  permisionsEditor,
  controllers.removeTrackFromChart
);


router.post(
  "/shops/create",
  authenticateAdmin,
  permisionsEditor,
  controllers.createShop
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

export default router;
