import { User, Fop, Company } from "../models/userModel.js";
import PlayList from "../models/playlistModel.js";
import Track from "../models/trackModel.js";
import Genre from "../models/genreModel.js";
import Admin from "../models/adminModel.js";
import HttpError from "../helpers/HttpError.js";
import ctrlWrapper from "../helpers/ctrlWrapper.js";
import jwt from "jsonwebtoken";

const getAllUsers = async (req, res) => {
  const result = await User.find();

  res.json(result);
};

const createPlayList = async (req, res) => {
  console.log(req);
  const { playListName } = req.body;
  const { _id: owner } = req.user;

  const playlist = await PlayList.findOne({ playListName });

  if (playlist) {
    throw HttpError(409, "PlayList name in use");
  }

  const newPlayList = await PlayList.create({ ...req.body, owner });

  res.status(201).json({
    playListName: newPlayList.playListName,
    typeOfShop: newPlayList.typeOfShop,
    shopCategory: newPlayList.shopCategory,
    owner: newPlayList.owner,
  });
};

const latestPlaylists = async (req, res) => {
  const latestPlaylists = await PlayList.find(
    { published: true },
    "playListName playListAvatarURL"
  ).sort({ createdAt: -1 });

  res.json(latestPlaylists);
};

const allGenres = async (req, res) => {
  const allGenres = await Genre.find();

  res.json(allGenres);
};

const latestTracks = async (req, res) => {
  const latestTracks = await Track.find()
    .sort({ createdAt: -1 })
    .limit(9)
    .populate("playList");

  res.json(latestTracks);
};

// const addPlaylist = async (req, res) => {
//   const { _id: userId  } = req.user;
//   const playlistId = req.params.playlistId;

//   const playList = await PlayList.findById(playlistId);
//   if (playlistId.favoriteByUsers.includes(userId)) {
//     return res.status(409).json({ message: "Favorite added early" });
//   }
//   await PlayList.findByIdAndUpdate(
//     playlistId,
//     { $push: { favoriteByUsers: userId.toString() } },
//     {
//       new: true,
//     }
//   );
//   const totalPlayLists = await PlayList.countDocuments({ favoriteByUsers: userId });

//   delete playList._doc.favoriteByUsers;
//   res.json({
//     totalPlayLists,
//     ...playList._doc,
//   });
// };

// const deleteFavoritePlayList = async (req, res) => {
//   const { _id: userId } = req.user;
//   const playlistId = req.params.playlistId;

//   const playList = await PlayList.findById(playlistId);

//   if (!playList.favoriteByUsers.includes(userId)) {
//     return res.status(409).json({ message: "Favorite deleted early" });
//   }

//   await PlayList.findByIdAndUpdate(
//     playlistId,
//     { $pull: { favoriteByUsers: userId.toString() } },

//     {
//       new: true,
//     }
//   );
//   const totalPlayLists = await PlayList.countDocuments({ favoriteByUsers: userId });
//   delete playList._doc.favoriteByUsers;
//   res.json({ totalPlayLists, ...playList._doc });
// };

const updateFavoritesPlaylists = async (req, res) => {
  const { playlistId: id} = req.params;
  const { _id: user } = req.user;
  console.log(' id',  id)

  const playlist = await PlayList.findById(id);

  if (!playlist) {
    return res.status(404).json({ error: "Playlist with such id is not found" });
  }

 

  const isFavorite = playlist.favoriteByUsers.includes(user);

  if (isFavorite) {
    await PlayList.findByIdAndUpdate(playlist._id, { $pull: { favoriteByUsers: user } });
    res.status(200).json({ message: `Removed ${playlist.playListName} from favorites` });
  } else {
    await PlayList.findByIdAndUpdate(playlist._id, { $push: { favoriteByUsers: user } });
    res.status(200).json({ message: `Added ${playlist.playListName} to favorites` });
  }
};
const getFavoritePlaylists = async (req, res) => {
  const { page = 1, limit = 8 } = req.query;
  const { _id: user } = req.user;

  const skip = (page - 1) * limit;

  const favorites = await PlayList.find({ favoriteByUsers: user })
    .skip(skip)
    .limit(limit);

  if (!favorites || favorites.length === 0) {
    return res.status(404).json({ error: "No favorite playlists" });
  }

  const totalPlayLists = await PlayList.countDocuments({ favoriteByUsers: user });
  // delete favorites._doc.favoriteByUsers;
  res.json({ totalPlayLists, favorites});
};

export default {
  getAllUsers: ctrlWrapper(getAllUsers),
  // addFavoritePlaylist: ctrlWrapper(addFavoritePlaylist),
  // deleteFavoritePlayList:  ctrlWrapper(deleteFavoritePlayList),
  getFavoritePlaylists: ctrlWrapper(getFavoritePlaylists),
  updateFavoritesPlaylists:  ctrlWrapper(updateFavoritesPlaylists),
    createPlayList: ctrlWrapper(createPlayList),
  latestPlaylists: ctrlWrapper(latestPlaylists),
  allGenres: ctrlWrapper(allGenres),
latestTracks: ctrlWrapper(latestTracks),

};
