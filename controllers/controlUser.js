import { User, Fop, Company } from "../models/userModel.js";
import PlayList from "../models/playlistModel.js";
import Track from "../models/trackModel.js";
import Genre from "../models/genreModel.js";
import Shop from "../models/shopModel.js";
import ShopItem from "../models/shopItemModel.js";
import ShopSubType from "../models/shopSubTypeModel.js";
import Admin from "../models/adminModel.js";
import HttpError from "../helpers/HttpError.js";
import ctrlWrapper from "../helpers/ctrlWrapper.js";
import jwt from "jsonwebtoken";
import { UserListenCount } from "../models/userListenCountModel.js";
import mongoose from "mongoose";
import userPlaylist from "../models/userPlayList.js";
import randomCover from "../helpers/randomCover.js";
import { resizePics } from "../helpers/resizePics.js";

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

  const { page = req.query.page, limit = req.query.limit } = req.query;

  const skip = (page - 1) * limit;

  const playlist = await PlayList.findById(id)
    .populate({
      path: "trackList",
      options: { sort: { createdAt: -1 }, skip, limit },
    })
    .populate("playlistGenre");

  if (!playlist) {
    throw HttpError(404, `Playlist not found`);
  }

  const trackList = await PlayList.findById(id, "trackList").populate({
    path: "trackList",
    select: "artist trackName trackURL",
    options: { sort: { createdAt: -1 } },
  });

  const totalTracks = trackList.trackList.length;
  const totalPages = Math.ceil(totalTracks / limit);

  const tracksSRC = trackList.trackList;

  res.json({ playlist, totalTracks, totalPages, tracksSRC });
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
    .sort({ genre: 1 });

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
  const {
    page = req.query.page,
    limit = req.query.limit,
    ...query
  } = req.query;
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

  const totalTracks = (await Track.find()).length;

  const tracksSRC = await Track.find(
    { ...req.query },
    "artist trackName trackURL"
  ).sort({ createdAt: -1 });
  const totalPages = Math.ceil(totalTracks / limit);
  const pageNumber = page ? parseInt(page) : null;

  res.json({
    latestTracks,
    totalTracks,
    totalPages,
    pageNumber,
    tracksSRC,
  });
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
  const allPlaylistsInShopCategory = [];
  let playlistsInSubCat = [];

  const shop = await Shop.findById(id)
    .populate("playList")
    .populate({
      path: "shopChildItems",
      options: { populate: "playList" },
    });

  if (!shop) {
    throw HttpError(404, `Shop with ${id} not found`);
  }

  shop.playList.map((playlist) => allPlaylistsInShopCategory.push(playlist));

  //Проходимся по категориям в ресторанах
  shop.shopChildItems.map((shopChildItem) => {
    // console.log("shopChildItem", shopChildItem);

    //Проходимся по по всем плейлистам в категорях
    shopChildItem.playList.map(async (playlist) => {
      // console.log("playlist", playlist);

      //Добавляем все плейлисты в массив
      allPlaylistsInShopCategory.push(playlist);

      const shop = await ShopItem.findById(shopChildItem._id).populate({
        path: "shopChildSubType",
        options: { populate: "playList" },
      });

      shop.shopChildSubType.map((shopChildSubType) =>
        shopChildSubType.playList.map((playlist) =>
          allPlaylistsInShopCategory.push(playlist)
        )
      );
    });
  });

  res.json({ shop, allPlaylistsInShopCategory, playlistsInSubCat });
};

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

const updateUserFavoritesPlaylists = async (req, res) => {
  const { id } = req.params;
  console.log("playlistId", req.params.id);
  const { _id: user } = req.user;
  console.log(" id", user);

  const playlist = await userPlaylist.findById(id);

  if (!playlist) {
    return res
      .status(404)
      .json({ error: "Playlist with such id is not found" });
  }

  const isFavorite = playlist.favoriteByUsers.includes(user);
  console.log("isFavorite", isFavorite);
  console.log("userplaylist", playlist);

  if (isFavorite) {
    await userPlaylist.findByIdAndUpdate(playlist._id, {
      $pull: { favoriteByUsers: user },
    });
    res
      .status(200)
      .json({ message: `Removed ${playlist.playListName} from favorites` });
  } else {
    await userPlaylist.findByIdAndUpdate(playlist._id, {
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
  console.log("user getFavoritePlaylists ", user);
  const skip = (page - 1) * limit;

  try {
    const favorites = await Promise.all([
      PlayList.find(
        { favoriteByUsers: user },
        "-favoriteByUsers -createdAt -updatedAt"
      )
        .skip(skip)
        .limit(limit),
      userPlaylist
        .find(
          { favoriteByUsers: user },
          "-favoriteByUsers -createdAt -updatedAt"
        )
        .skip(skip)
        .limit(limit),
    ]);

    const mergedFavorites = [].concat(...favorites);

    const totalPlayLists = await Promise.all([
      PlayList.countDocuments({ favoriteByUsers: user }),
      userPlaylist.countDocuments({ favoriteByUsers: user }),
    ]).then((counts) => counts.reduce((total, count) => total + count, 0));

    res.json({ totalPlayLists, favorites: mergedFavorites });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// const getFavoritePlaylists = async (req, res) => {
//   const { page = 1, limit = 8 } = req.query;
//   const { _id: user } = req.user;

//   const skip = (page - 1) * limit;

//   const favorites = await PlayList.find(
//     { favoriteByUsers: user },
//     "-favoriteByUsers -createdAt -updatedAt"
//   )
//     .skip(skip)
//     .limit(limit);
//   console.log("favorites", favorites);

//   const totalPlayLists = await PlayList.countDocuments({
//     favoriteByUsers: user,
//   });

//   res.json({ totalPlayLists, favorites });
// };

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
    res.status(200).json({ message: `Added ${playlist.playListName} to add` });
  }
};

const getAddPlaylists = async (req, res) => {
  // const { page = 1, limit = 8 } = req.query;
  const { page = 1, limit = req.query.limit, ...query } = req.query;
  const { _id: user } = req.user;

  const skip = (page - 1) * limit;

  const findQuery = { addByUsers: user, ...query };

  const add = await PlayList.find(
    findQuery,
    "-addByUsers -createdAt -updatedAt"
  )
    .skip(skip)
    .limit(limit);
  console.log("add", add);
  // if (!add || add.length === 0) {
  //   return res.status(404).json({ error: "No add playlists" });
  // }

  const totalPlayLists = await PlayList.countDocuments(findQuery);

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
  const allTracks = [];
  const allTracksPlayer = [];
  const {
    page = req.query.page,
    limit = req.query.limit,
    ...query
  } = req.query;

  const skip = (page - 1) * limit;

  const genreTracks = await Genre.findById(id).populate({
    path: "playList",
    options: { populate: "playlistGenre" },
  });

  const genreId = genreTracks._id;
  const genreName = genreTracks.genre;

  genreTracks.playList.map(async (playlist) =>
    allTracks.push(playlist.trackList)
  );

  const tracksArray = allTracks.flat().map((el) => el._id);

  const uniqueTracksArray = tracksArray.filter(
    (track, index, array) => array.indexOf(track) === index
  );
  // console.log("uniqueTracksArray", uniqueTracksArray);

  const tracks = await Track.find(
    {
      _id: { $in: uniqueTracksArray },
    },
    {
      artist: 1,
      trackName: 1,
      trackDuration: 1,
      trackGenre: 1,
      trackPictureURL: 1,
      trackURL: 1,
    },
    { skip, limit }
  );

  const genreTracksPlayer = await Genre.findById(id).populate({
    path: "playList",
  });

  genreTracksPlayer.playList.map(async (playlist) =>
    allTracksPlayer.push(playlist.trackList)
  );

  const tracksArrayPlayer = allTracksPlayer.flat().map((el) => el._id);

  const uniqueTracksArrayPlayer = tracksArrayPlayer.filter(
    (track, index, array) => array.indexOf(track) === index
  );

  const tracksSRC = await Track.find(
    {
      _id: { $in: uniqueTracksArrayPlayer },
    },
    "artist trackName trackURL"
  );

  const totalTracks = tracksSRC.length;
  const totalPages = Math.ceil(totalTracks / limit);

  res.json({
    playlistGenre: [{ _id: genreId, genre: genreName }],
    // tracks: [...tracks],
    tracks,
    tracksSRC,
    totalPages,
    totalTracks,
  });
};

const countListensTrackByUser = async (req, res) => {
  const { _id: userId } = req.user;
  const { id: trackId } = req.params;

  const currentDate = new Date();

  // Находим или создаем запись о пользователе
  let userListenCount = await UserListenCount.findOne({ userId: userId });

  if (!userListenCount) {
    userListenCount = await UserListenCount.create({ userId });
  }
  // console.log("userListenCount", userListenCount);
  // Находим или создаем запись о прослушивании трека для этого пользователя
  let track = userListenCount.tracks.find(
    (track) => track.trackId.toString() === trackId
  );

  //Получаем данные по треку
  let trackData = await Track.findOne(
    { _id: trackId },
    {
      artist: 1,
      trackName: 1,
      trackDuration: 1,
    }
  );

  if (!track) {
    // Если запись о прослушивании трека не найдена, создаем новый объект track
    track = {
      trackId,
      trackName: trackData.trackName,
      artist: trackData.artist,
      listens: [{ countOfListenes: 1, date: currentDate }],
    };
    userListenCount.tracks.push(track);
  }

  // Находим или создаем запись о прослушивании трека за текущий день
  let listensForToday = track.listens.find(
    (listen) =>
      new Date(listen.date).toDateString() === currentDate.toDateString()
  );

  if (!listensForToday) {
    // Если запись о прослушивании трека за текущий день не найдена, создаем новую запись
    track.listens.push({ countOfListenes: 1, date: currentDate });
  } else {
    // Если запись о прослушивании трека за текущий день уже существует, увеличиваем счетчик прослушиваний
    listensForToday.countOfListenes++;
  }

  await userListenCount.save();

  res.json(userListenCount);
};

const getCreatePlaylists = async (req, res) => {
  const { page = 1, limit = req.query.limit, ...query } = req.query;
  const skip = (page - 1) * limit;

  const createPlaylists = await userPlaylist
    .find({ ...req.query }, "-createdAt -updatedAt", {
      skip,
      limit,
    })
    .sort({ createdAt: -1 });
  res.json(createPlaylists);
};

const createUserPlaylist = async (req, res) => {
  const { playListName, type } = req.body;
  const { _id: owner } = req?.user;
  let randomPicUrl;
  let resizePicURL;

  const playlist = await userPlaylist.findOne({ playListName });

  if (playlist) {
    throw HttpError(409, `${playListName} name in use`);
  }

  if (!req.file) {
    randomPicUrl = await randomCover("playlist");
  } else {
    resizePicURL = await resizePics(req.file, type);
  }

  let picURL = !req.file ? randomPicUrl : resizePicURL;

  const newPlayList = await userPlaylist.create({
    ...req.body,
    playListAvatarURL: picURL,
    owner,
  });

  res.status(201).json({
    playListName: newPlayList.playListName,
    owner: newPlayList.owner,
    playListAvatarURL: newPlayList.playListAvatarURL,
  });
};

const findUserPlayListById = async (req, res) => {
  const { id } = req.params;

  const playlist = await userPlaylist
    .findById(id)
    .populate({
      path: "trackList",
      options: { sort: { createdAt: -1 } },
    })
    .populate("playlistGenre");

  if (!playlist) {
    throw HttpError(404, `Playlist not found`);
  }

  const totalTracks = playlist.trackList.length;

  res.json({ playlist, totalTracks });
};

const uploadPics = async (req, res) => {
  const { type } = req.body;
  if (!req.file) {
    throw HttpError(404, "File not found for upload");
  }
  const picsURL = await resizePics(req.file, type);
  const cover = await Pics.create({ picsURL, ...req.body });
  res.json({
    cover,
  });
};

const updateUserPlaylistById = async (req, res) => {
  const { id } = req.params;
  const isExistPlaylist = await userPlaylist.findById(id);

  if (isExistPlaylist === null) {
    res.status(404).json({
      message: `ID ${id} doesn't found`,
      code: "4041",
      object: `${id}`,
    });
  }
  const updatedPlaylist = await userPlaylist.findByIdAndUpdate(
    id,
    { ...req.body },
    {
      new: true,
    }
  );

  res.json(updatedPlaylist);
};

const deleteUserPlaylist = async (req, res) => {
  const { id } = req.params;

  const playlist = await userPlaylist.findById(id);

  if (!playlist) {
    throw HttpError(404, `Playlist with ${id} not found`);
  }

  await userPlaylist.findByIdAndDelete(id);

  res.json({
    message: `Playlist ${playlist.playListName} was deleted`,
  });
};

const getCategoryShopById = async (req, res) => {
  const { id } = req.params;
  const allPlaylistsInShopCategory = [];
  const shop = await ShopItem.findById(id)
    .populate("playList")
    .populate({
      path: "shopChildSubType",
      options: { populate: "playList" },
    });

  if (!shop) {
    throw HttpError(404, `Shop category with ${id} not found`);
  }

  shop.playList.map((playlist) => allPlaylistsInShopCategory.push(playlist));

  shop.shopChildSubType.map((shopChildSubType) =>
    shopChildSubType.playList.map((playlist) =>
      allPlaylistsInShopCategory.push(playlist)
    )
  );

  res.json({ shop, allPlaylistsInShopCategory });
};

const getSubCategoryShopById = async (req, res) => {
  const { id } = req.params;

  const shop = await ShopSubType.findById(id).populate("playList");

  if (!shop) {
    throw HttpError(404, `Shop subcategory with ${id} not found`);
  }

  res.json(shop);
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
  countListensTrackByUser: ctrlWrapper(countListensTrackByUser),
  getCreatePlaylists: ctrlWrapper(getCreatePlaylists),
  createUserPlaylist: ctrlWrapper(createUserPlaylist),
  findUserPlayListById: ctrlWrapper(findUserPlayListById),
  uploadPics: ctrlWrapper(uploadPics),
  updateUserPlaylistById: ctrlWrapper(updateUserPlaylistById),
  deleteUserPlaylist: ctrlWrapper(deleteUserPlaylist),
  updateUserFavoritesPlaylists: ctrlWrapper(updateUserFavoritesPlaylists),
  getCategoryShopById: ctrlWrapper(getCategoryShopById),
  getSubCategoryShopById: ctrlWrapper(getSubCategoryShopById),
};
