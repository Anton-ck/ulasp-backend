import express from "express";

import validateBody from "../../middlewares/validateBody.js";
import isEmptyBody from "../../middlewares/isEmptyBody.js";
import {
  authenticatUser,
  authenticateAdmin,
} from "../../middlewares/authenticate.js";
import controllers from "../../controllers/controlUser.js";
import { permisionsAdmin } from "../../middlewares/permitionsAdmin.js";

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
  authenticatUser,
  controllers.findShopById
);




router.get("/tracks/latestTracks", authenticatUser, controllers.latestTracks);

router.get(
  "/genres/:id",
  authenticatUser,
  controllers.findGenreById
);

router.get('/genre/:id/tracks',
  // authenticatUser,
  controllers.getTracksByGenreId);


router.patch("/playlist/favorites/:id", 
authenticatUser, 
  controllers.updateFavoritesPlaylists);
 
  router.patch("/playlist/add/:id", 
authenticatUser, 
 controllers.updateAddPlaylists);

 router.patch("/tracks/count/:id", 
 authenticatUser, 
  controllers.countListensTrackByUser);


// router.delete("favorites/:playlistId", authenticatUser, controllers.deleteFavoritePlayList);

// router.patch("favorites/:playlistId", authenticatUser, controllers.addFavoritePlaylist);

export default router;
