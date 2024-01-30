import { User, Fop, Company } from "../models/userModel.js";
import PlayList from "../models/playlistModel.js";
import Track from "../models/trackModel.js";
import Genre from "../models/genreModel.js";
import Shop from "../models/shopModel.js";
import Admin from "../models/adminModel.js";
import HttpError from "../helpers/HttpError.js";
import ctrlWrapper from "../helpers/ctrlWrapper.js";
import jwt from "jsonwebtoken";
import { UserListenCount } from "../models/userListenCountModel.js";
import mongoose from 'mongoose';

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
  const { page = 1, limit = req.query.limit, ...query } = req.query;
  const skip = (page - 1) * limit;
  const latestPlaylists = await PlayList.find(
    //  { ...req.query },
    { published: true },
    "-favoriteByUsers -createdAt -updatedAt",
    {
      skip,
      limit,
    }
  ).sort({ createdAt: -1 });

  res.json(latestPlaylists);
};

const findPlayListById = async (req, res) => {
  const { id } = req.params;

  const playlist = await PlayList.findById(id).populate("trackList");

  if (!playlist) {
    throw HttpError(404);
  }

  const totalTracks = playlist.trackList.length;

  res.json({ playlist, totalTracks });
};

const allGenres = async (req, res) => {
  const { page = 1, limit = req.query.limit, ...query } = req.query;
  const skip = (page - 1) * limit;
  const allGenres = await Genre.find(
    { ...req.query },
    "-createdAt -updatedAt",
    {
      skip,
      limit,
    }
  )
    .populate("playList")
    .sort({ createdAt: -1 });

  res.json(allGenres);
};

const findGenreById = async (req, res) => {
  const { id } = req.params;

  const genre = await Genre.findById(id).populate("playList");

  if (!genre) {
    throw HttpError(404);
  }

  res.json(genre);
};

const latestTracks = async (req, res) => {
  const { page = 1, limit = req.query.limit, ...query } = req.query;
  const skip = (page - 1) * limit;
  const latestTracks = await Track.find(
    { ...req.query },
    "-createdAt -updatedAt",
    {
      skip,
      limit,
    }
  )
    .sort({ createdAt: -1 })

    .populate({
      path: "playList",
      options: { populate: "playlistGenre" },
    });
  
  res.json(latestTracks);
};




const allShops = async (req, res) => {
  const { page = 1, limit = req.query.limit, ...query } = req.query;
  const skip = (page - 1) * limit;
  const allShops = await Shop.find({ ...req.query }, "-createdAt -updatedAt", {
    skip,
    limit,
  }).sort({ createdAt: -1 });

  res.json(allShops);
};

const findShopById = async (req, res) => {
  const { id } = req.params;

  const shop = await Shop.findById(id).populate("playList");

  if (!shop) {
    throw HttpError(404);
  }

  res.json(shop);
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
  const { id } = req.params;
  console.log("playlistId", req.params.id);
  const { _id: user } = req.user;
  console.log(" id", user);

  const playlist = await PlayList.findById(id);

  if (!playlist) {
    return res
      .status(404)
      .json({ error: "Playlist with such id is not found" });
  }

  const isFavorite = playlist.favoriteByUsers.includes(user);
  console.log("isFavorite", isFavorite);
  console.log("playlist", playlist);

  if (isFavorite) {
    await PlayList.findByIdAndUpdate(playlist._id, {
      $pull: { favoriteByUsers: user },
    });
    res
      .status(200)
      .json({ message: `Removed ${playlist.playListName} from favorites` });
  } else {
    await PlayList.findByIdAndUpdate(playlist._id, {
      $push: { favoriteByUsers: user },
    });
    res
      .status(200)
      .json({ message: `Added ${playlist.playListName} to favorites` });
  }
};

const getFavoritePlaylists = async (req, res) => {
  const { page = 1, limit = 8 } = req.query;
  const { _id: user } = req.user;

  const skip = (page - 1) * limit;

  const favorites = await PlayList.find(
    { favoriteByUsers: user },
    "-favoriteByUsers -createdAt -updatedAt"
  )
    .skip(skip)
    .limit(limit);
  console.log("favorites", favorites);
  // if (!favorites || favorites.length === 0) {
  //   return res.status(404).json({ error: "No favorite playlists" });
  // }

  const totalPlayLists = await PlayList.countDocuments({
    favoriteByUsers: user,
  });
  // delete favorites._doc.favoriteByUsers;
  res.json({ totalPlayLists, favorites });
};

const updateAddPlaylists = async (req, res) => {
  const { id } = req.params;
  console.log("playlistId", req.params.id);
  const { _id: user } = req.user;
  console.log(" id", user);

  const playlist = await PlayList.findById(id);

  if (!playlist) {
    return res
      .status(404)
      .json({ error: "Playlist with such id is not found" });
  }

  const isAdd = playlist.addByUsers.includes(user);
  console.log("isAdd", isAdd);
  console.log("playlist", playlist);

  if (isAdd) {
    await PlayList.findByIdAndUpdate(playlist._id, {
      $pull: { addByUsers: user },
    });
    res
      .status(200)
      .json({ message: `Removed ${playlist.playListName} from add` });
  } else {
    await PlayList.findByIdAndUpdate(playlist._id, {
      $push: { addByUsers: user },
    });
    res
      .status(200)
      .json({ message: `Added ${playlist.playListName} to add` });
  }
};

const getAddPlaylists = async (req, res) => {
  const { page = 1, limit = 8 } = req.query;
  const { _id: user } = req.user;

  const skip = (page - 1) * limit;

  const add = await PlayList.find(
    { addByUsers: user },
    "-addByUsers -createdAt -updatedAt"
  )
    .skip(skip)
    .limit(limit);
  console.log("add", add);
  // if (!add || add.length === 0) {
  //   return res.status(404).json({ error: "No add playlists" });
  // }

  const totalPlayLists = await PlayList.countDocuments({
    addByUsers: user,
  });
 
  res.json({ totalPlayLists, add });
};

// const getTracksByGenreId = async (req, res) => {
//   const { id } = req.params;

  
//   const genre = await Genre.findById(id).populate("playList");

//   // Получить все треки из этих плейлистов
//   const tracksPromises = genre.playList.map(async (playlist) => {
//     const tracks = await Track.find({ playList: playlist._id });
//     return tracks;
//   });

//   // Дождаться завершения всех запросов и объединить результаты
//   const tracks = await Promise.all(tracksPromises).then((results) => {
//     return results.flat();
//   });

//   res.json(tracks);
// };

// const getTracksByGenreId = async (req, res) => {
  
//   const { id } = req.params;

//   const genre = await Genre.findById(id).populate("playList");

  // Use a Set to keep track of unique track IDs
  // const uniqueTrackIds = new Set();

  // // Retrieve tracks from each playlist and add them to the Set
  // for (const playlist of genre.playList) {
  //   const tracks = await Track.find({ playList: playlist._id });
  //   tracks.forEach((track) => {
  //     uniqueTrackIds.add(track._id.toString());
  //   });
  // }

  // // Convert the Set back to an array
  // const uniqueTracksArray = Array.from(uniqueTrackIds);

  // Fetch all unique tracks using the array of unique IDs
//   const tracks = await Track.find({ _id: { $in: uniqueTracksArray } });

//   res.json(tracks);
// };

const getTracksByGenreId = async (req, res) => {
  const { id } = req.params;
 const allTracks=[];

  const genreTracks = await Genre.findById(id).populate({
    path: "playList",
    options: { populate: "trackList" },
  }
  );

genreTracks.playList.map(async (playlist) => allTracks.push(playlist.trackList));
const tracksArray = allTracks.flat().map(el => el._id.toString());
// console.log('tracksArray', tracksArray)

 const uniqueTracksArray=tracksArray.filter((track, index, array) => array.indexOf(track)=== index);
// console.log('uniqueTracksArray', uniqueTracksArray);

const tracks = await Track.find({ _id: { $in: uniqueTracksArray } });

res.json(tracks);


};


  const countListensTrackByUser = async (req, res) => {
    const { _id: userId } = req.user;
    const { id: trackId } = req.params;

    console.log('userId', userId)
    console.log('trackId', trackId)

  
      // Получаем текущую дату
      const currentDate = new Date();
      console.log('currentDate', currentDate)
  
      // Находим или создаем запись о пользователе
      let userListenCount = await UserListenCount.findOne({ "userId": userId });
  
      if (!userListenCount) {
        userListenCount = 
        await UserListenCount.create({ userId });
      }
  console.log('userListenCount', userListenCount)
     // Находим или создаем запись о прослушивании трека для этого пользователя

    let trackListen = [];
    trackListen = userListenCount.tracks.find(track => {
      console.log('track', track)
      return track.trackId.toString() === trackId &&
             new Date(track.listens[0].date).toDateString() === currentDate.toDateString();
    });
    console.log('trackListen', trackListen);

    if (!trackListen) {
     
      console.log('trackId', trackId)
      // Если запись о прослушивании трека за текущий день не найдена, создаем новую запись
      userListenCount.tracks.push({
        trackId,
        listens: [ { countOfListenes: 1, date: currentDate }]
      });
      console.log('userListenCount.tracks', userListenCount.tracks)
    } else {
      // Если запись о прослушивании трека за текущий день уже существует, увеличиваем счетчик прослушиваний
      trackListen.listens[0].countOfListenes++;
    }

    await userListenCount.save();
   
  res.json(userListenCount);
  
  
  };


export default {
  getAllUsers: ctrlWrapper(getAllUsers),
  // addFavoritePlaylist: ctrlWrapper(addFavoritePlaylist),
  // deleteFavoritePlayList:  ctrlWrapper(deleteFavoritePlayList),
  getFavoritePlaylists: ctrlWrapper(getFavoritePlaylists),
  updateFavoritesPlaylists: ctrlWrapper(updateFavoritesPlaylists),
  createPlayList: ctrlWrapper(createPlayList),
  latestPlaylists: ctrlWrapper(latestPlaylists),
  allGenres: ctrlWrapper(allGenres),
  latestTracks: ctrlWrapper(latestTracks),
  allShops: ctrlWrapper(allShops),
  findGenreById: ctrlWrapper(findGenreById),
  findShopById: ctrlWrapper(findShopById),
  findPlayListById: ctrlWrapper(findPlayListById),
  getAddPlaylists: ctrlWrapper(getAddPlaylists),
  updateAddPlaylists: ctrlWrapper(updateAddPlaylists),
  getTracksByGenreId: ctrlWrapper(getTracksByGenreId),
  countListensTrackByUser: ctrlWrapper(countListensTrackByUser)
};
