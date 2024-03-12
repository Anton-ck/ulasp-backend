import express from "express";
import upload from "../../middlewares/upload.js";
import validateBody from "../../middlewares/validateBody.js";
import isEmptyBody from "../../middlewares/isEmptyBody.js";
import {
  authenticatUser,
  authenticateAdmin,
} from "../../middlewares/authenticate.js";
import controllers from "../../controllers/controlUser.js";
import { permisionsAdmin } from "../../middlewares/permitionsAdmin.js";
import { playListUserSchema } from "../../schemas/userSchema.js";
import {
  createFopUserSchema,
  createCompanyUserSchema,
} from "../../schemas/userSchema.js";
import isValid from "../../middlewares/isValid.js";

const router = express.Router();
// router.get("/", authenticateAdmin, permisionsAdmin, controllers.getAllUsers);

router.get("/playlist/latest", controllers.latestPlaylists);

// router.get(
//   "/playlist/count",
//   authenticatUser,
//   controllers.playlistsCount
// );
router.get(
  "/playlist/favorites",
  authenticatUser,

  controllers.getFavoritePlaylists
);

router.get(
  "/playlist/add",
  authenticatUser,

  controllers.getAddPlaylists
);

router.get(
  "/playlist/:id",
  authenticatUser,
  isValid,
  controllers.findPlayListById
);

router.get(
  "/genres/all",
  authenticatUser,

  controllers.allGenres
);

router.get(
  "/shops/all",
  // authenticatUser,
  controllers.allShops
);
router.get(
  "/shops/:id",
  // authenticatUser,
  controllers.findShopById
);

router.get(
  "/shops/shopitem/:id",
  // authenticatUser,
  controllers.getCategoryShopById
);

router.get(
  "/shops/shopitem/subcategory/:id",
  // authenticatUser,
  controllers.getSubCategoryShopById
);

router.get("/tracks/latestTracks", authenticatUser, controllers.latestTracks);

router.get("/genres/:id", authenticatUser, controllers.findGenreById);

router.get(
  "/genre/:id/tracks",
  // authenticatUser,
  controllers.getTracksByGenreId
);

router.patch(
  "/playlist/favorites/:id",
  authenticatUser,
  controllers.updateFavoritesPlaylists
);

router.patch(
  "/userPlaylist/favorites/:id",
  authenticatUser,
  controllers.updateUserFavoritesPlaylists
);

router.patch(
  "/playlist/add/:id",
  authenticatUser,
  controllers.updateAddPlaylists
);

router.post(
  "/tracks/countlisten/:id",
  authenticatUser,
  controllers.countListensTrackByUser
);

router.get(
  "/userPlaylist/all",
  authenticatUser,
  controllers.getCreatePlaylists
);

router.post(
  "/userPlaylist/create",
  authenticatUser,
  upload.single("picsURL"),
  validateBody(playListUserSchema),
  controllers.createUserPlaylist
);

router.get(
  "/userPlaylist/:id",
  authenticatUser,
  isValid,
  controllers.findUserPlayListById
);

router.delete(
  "/userPlaylist/delete/:id",
  authenticatUser,
  isValid,
  controllers.deleteUserPlaylist
);

router.post(
  "/pics/create",
  authenticatUser,
  upload.single("picsURL"),
  controllers.uploadPics
);

router.patch(
  "/userPlaylist/update/:id",
  authenticatUser,
  isValid,
  controllers.updateUserPlaylistById
);

router.patch(
  "/playlist/sortupdate/:id",
   authenticatUser,
  isValid,
  controllers.updatePlaylistsSortedTracks
);

// router.delete("favorites/:playlistId", authenticatUser, controllers.deleteFavoritePlayList);

// router.patch("favorites/:playlistId", authenticatUser, controllers.addFavoritePlaylist);

export default router;
