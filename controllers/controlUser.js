import { User, Fop, Company } from '../models/userModel.js';
import PlayList from '../models/playlistModel.js';
import Track from '../models/trackModel.js';
import Genre from '../models/genreModel.js';
import Shop from '../models/shopModel.js';
import ShopItem from '../models/shopItemModel.js';
import ShopSubType from '../models/shopSubTypeModel.js';
import Admin from '../models/adminModel.js';
import HttpError from '../helpers/HttpError.js';
import ctrlWrapper from '../helpers/ctrlWrapper.js';
import jwt from 'jsonwebtoken';
import { UserListenCount } from '../models/userListenCountModel.js';
import mongoose from 'mongoose';
import UserPlaylist from '../models/userPlayList.js';
import randomCover from '../helpers/randomCover.js';
import { resizePics } from '../helpers/resizePics.js';
import { randomFn } from '../helpers/randomSort.js';

const getAllUsers = async (req, res) => {
  const result = await User.find();

  res.json(result);
};

const createPlayList = async (req, res) => {
  console.log(req);
  const { playListName } = req.body;
  const { _id: owner } = req.user;

  const playlist = await PlayList.findOne({ playListName });

  // if (playlist) {
  //   throw HttpError(409, 'PlayList name in use');
  // }

  const newPlayList = await PlayList.create({ ...req.body, owner });

  res.status(201).json({
    playListName: newPlayList.playListName,
    typeOfShop: newPlayList.typeOfShop,
    shopCategory: newPlayList.shopCategory,
    owner: newPlayList.owner,
  });
};

const updatePlaylistsSortedTracks = async (req, res) => {
  const { id } = req.params;
  const sort = req.body.data;

  const sortedBy = randomFn(sort.toString());

  // console.log("sortedBy UPDATE ===>", sortedBy);

  await PlayList.findByIdAndUpdate(
    id,
    { sortedTracks: sortedBy },
    {
      new: true,
    },
  );

  res.json({ message: 'ok' });
};

const allGenres = async (req, res) => {
  const { page = 1, limit = req.query.limit, ...query } = req.query;
  const skip = (page - 1) * limit;
  const allGenres = await Genre.find(
    { ...req.query },
    '-createdAt -updatedAt',
    {
      skip,
      limit,
    },
  )
    .populate('playList')
    .sort({ genre: 1 });

  res.json(allGenres);
};

const findGenreById = async (req, res) => {
  const { id } = req.params;

  const genre = await Genre.findById(id).populate({
    path: 'playList',
    match: { published: true },
  });

  if (!genre) {
    throw HttpError(404);
  }

  res.json(genre);
};

const latestTracks = async (req, res) => {
  const {
    page = req.query.page,
    limit = req.query.limit,
    search = req.query.query || '',

    ...query
  } = req.query;
  const skip = (page - 1) * limit;

  const queryOptions = {
    $or: [
      { artist: { $regex: search.toString(), $options: 'i' } },
      { trackName: { $regex: search.toString(), $options: 'i' } },
    ],
    ...req.query,
  };

  const latestTracks = await Track.find(queryOptions, '-createdAt -updatedAt', {
    skip,
    limit,
  })
    .sort({ createdAt: -1 })

    .populate({
      path: 'playList',
      options: { populate: 'playlistGenre' },
    });

  const totalTracks = await Track.find(queryOptions).countDocuments();

  const tracksSRC = await Track.find(
    queryOptions,
    'artist trackName trackURL',
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
  const allShops = await Shop.find({ ...req.query }, '-createdAt -updatedAt', {
    skip,
    limit,
  }).sort({ createdAt: -1 });

  res.json(allShops);
};

const findShopById = async (req, res) => {
  const { id } = req.params;
  const allPlaylistsInShopCategory = [];

  const shop = await Shop.findById(id, '-createdAt -updatedAt').populate([
    {
      path: 'playList',
      select: 'playListName playListAvatarURL',
      match: { published: true },
    },
    {
      path: 'shopChildItems',
      select: 'shopItemName shopItemAvatarURL playList shopChildSubType',
      options: {
        populate: [
          {
            path: 'playList',
            select: 'playListName playListAvatarURL',
            match: { published: true },
          },
          {
            path: 'shopChildSubType',
            select: 'shopSubTypeName playList',
            options: {
              populate: {
                path: 'playList',
                select: 'playListName playListAvatarURL',
                match: { published: true },
              },
            },
          },
        ],
      },
    },
  ]);

  if (!shop) {
    throw HttpError(404, `Shop with ${id} not found`);
  }

  shop.playList.map((playlist) => allPlaylistsInShopCategory.push(playlist));

  shop.shopChildItems.map((shopChildItem) => {
    shopChildItem.playList.map(async (playlist) => {
      allPlaylistsInShopCategory.push(playlist);
    });
    shopChildItem.shopChildSubType.map(async (subtypeitem) => {
      console.log(subtypeitem);
      subtypeitem.playList.map(async (playlist) => {
        allPlaylistsInShopCategory.push(playlist);
      });
    });
  });

  res.json({ shop, allPlaylistsInShopCategory });
};

const updateFavoritesPlaylists = async (req, res) => {
  const { id } = req.params;
  console.log('playlistId', req.params.id);
  const { _id: user } = req.user;
  console.log(' id', user);

  const playlist = await PlayList.findById(id);

  if (!playlist) {
    return res
      .status(404)
      .json({ error: 'Playlist with such id is not found' });
  }

  const isFavorite = playlist.favoriteByUsers.includes(user);
  console.log('isFavorite', isFavorite);

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
  console.log('playlistId', req.params.id);
  const { _id: user } = req.user;
  console.log(' id', user);

  const playlist = await UserPlaylist.findById(id);

  if (!playlist) {
    return res
      .status(404)
      .json({ error: 'Playlist with such id is not found' });
  }

  const isFavorite = playlist.favoriteByUsers.includes(user);
  console.log('isFavorite', isFavorite);
  console.log('userplaylist', playlist);

  if (isFavorite) {
    await UserPlaylist.findByIdAndUpdate(playlist._id, {
      $pull: { favoriteByUsers: user },
    });
    res
      .status(200)
      .json({ message: `Removed ${playlist.playListName} from favorites` });
  } else {
    await UserPlaylist.findByIdAndUpdate(playlist._id, {
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

  const favorites = await Promise.all([
    PlayList.find(
      { favoriteByUsers: user, published: true },
      '-favoriteByUsers -createdAt -updatedAt',
    )
      .skip(skip)
      .limit(limit),
    UserPlaylist.find(
      { favoriteByUsers: user },
      '-favoriteByUsers -createdAt -updatedAt',
    )
      .skip(skip)
      .limit(limit),
  ]);

  const mergedFavorites = [].concat(...favorites);

  const totalPlayLists = await Promise.all([
    PlayList.countDocuments({ favoriteByUsers: user, published: true }),
    UserPlaylist.countDocuments({ favoriteByUsers: user }),
  ]).then((counts) => counts.reduce((total, count) => total + count, 0));

  res.json({ totalPlayLists, favorites: mergedFavorites });
};

const updateAddPlaylists = async (req, res) => {
  const { id } = req.params;
  console.log('playlistId', req.params.id);
  const { _id: user } = req.user;
  console.log(' id', user);

  const playlist = await PlayList.findById(id);

  if (!playlist) {
    return res
      .status(404)
      .json({ error: 'Playlist with such id is not found' });
  }

  const isAdd = playlist.addByUsers.includes(user);
  console.log('isAdd', isAdd);
  console.log('playlist', playlist);

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

  const findQuery = { addByUsers: user, published: true, ...query };

  const add = await PlayList.find(
    findQuery,
    '-addByUsers -createdAt -updatedAt',
  )
    .skip(skip)
    .limit(limit);
  // if (!add || add.length === 0) {
  //   return res.status(404).json({ error: "No add playlists" });
  // }

  const totalPlayLists = await PlayList.countDocuments(findQuery);

  res.json({ totalPlayLists, add });
};

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
    path: 'playList',
    options: { populate: 'playlistGenre' },
  });

  const genreId = genreTracks._id;
  const genreName = genreTracks.genre;

  genreTracks.playList.map(async (playlist) =>
    allTracks.push(playlist.trackList),
  );

  const tracksArray = allTracks.flat().map((el) => el._id);

  const uniqueTracksArray = tracksArray.filter(
    (track, index, array) => array.indexOf(track) === index,
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
    { skip, limit },
  );

  const genreTracksPlayer = await Genre.findById(id).populate({
    path: 'playList',
  });

  genreTracksPlayer.playList.map(async (playlist) =>
    allTracksPlayer.push(playlist.trackList),
  );

  const tracksArrayPlayer = allTracksPlayer.flat().map((el) => el._id);

  const uniqueTracksArrayPlayer = tracksArrayPlayer.filter(
    (track, index, array) => array.indexOf(track) === index,
  );

  const tracksSRC = await Track.find(
    {
      _id: { $in: uniqueTracksArrayPlayer },
    },
    'artist trackName trackURL',
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
    (track) => track.trackId.toString() === trackId,
  );

  //Получаем данные по треку
  let trackData = await Track.findOne(
    { _id: trackId },
    {
      artist: 1,
      trackName: 1,
      trackDuration: 1,
    },
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
      new Date(listen.date).toDateString() === currentDate.toDateString(),
  );

  if (!listensForToday) {
    // Если запись о прослушивании трека за текущий день не найдена, создаем новую запись
    track.listens.push({ countOfListenes: 1, date: currentDate });
  } else {
    // Если запись о прослушивании трека за текущий день уже существует, увеличиваем счетчик прослушиваний
    listensForToday.countOfListenes++;
  }

  userListenCount.totalListens += 1;

  await userListenCount.save();

  res.json(userListenCount);
};

const getCreatePlaylists = async (req, res) => {
  const { page = 1, limit = req.query.limit, ...query } = req.query;
  const skip = (page - 1) * limit;
  const { _id: userId } = req.user;

  const createPlaylists = await UserPlaylist.find(
    { ...req.query, owner: userId },
    '-createdAt -updatedAt',
    {
      skip,
      limit,
    },
  ).sort({ createdAt: -1 });
  res.json(createPlaylists);
};

const findUserPlayListById = async (req, res) => {
  const { id } = req.params;
  const {
    page = req.query.page,
    limit = req.query.limit,
    sort = req.query.sort,
  } = req.query;
  const skip = (page - 1) * limit;

  const playlist = await UserPlaylist.findById(id).populate({
    path: 'trackList',
    options: { sort: { trackName: sort }, skip, limit },
    populate: {
      path: 'playList',

      populate: {
        path: 'playlistGenre',
        select: 'genre',
      },
    },
  });

  if (!playlist) {
    throw HttpError(404, `Playlist not found`);
  }

  const trackList = await UserPlaylist.findById(id, 'trackList').populate({
    path: 'trackList',

    options: { sort: { trackName: sort } },
  });

  const totalTracks = trackList.trackList.length;
  const totalPages = Math.ceil(totalTracks / limit);

  const tracksSRC = trackList.trackList;
  console.log('trackList findUserPlayListById:>> ', trackList);
  res.json({ playlist, totalTracks, totalPages, tracksSRC });
};

const getCategoryShopById = async (req, res) => {
  const { id } = req.params;
  const allPlaylistsInShopCategory = [];
  const shop = await ShopItem.findById(id)
    .populate({ path: 'playList', match: { published: true } })
    .populate({
      path: 'shopChildSubType',
      options: {
        populate: {
          path: 'playList',
          match: { published: true },
        },
      },
    });

  if (!shop) {
    throw HttpError(404, `Shop category with ${id} not found`);
  }

  shop.playList.map((playlist) => allPlaylistsInShopCategory.push(playlist));

  shop.shopChildSubType.map((shopChildSubType) =>
    shopChildSubType.playList.map((playlist) =>
      allPlaylistsInShopCategory.push(playlist),
    ),
  );

  res.json({ shop, allPlaylistsInShopCategory });
};

const getSubCategoryShopById = async (req, res) => {
  const { id } = req.params;

  const shop = await ShopSubType.findById(id).populate({
    path: 'playList',
    match: { published: true },
  });

  if (!shop) {
    throw HttpError(404, `Shop subcategory with ${id} not found`);
  }

  res.json(shop);
};

//отчет по прослушанным песням пользователя
const countlistensForUser = async (req, res) => {
  const userId = req.body.userId;

  const dateOfStart = new Date(req.body.dateOfStart);
  const dateOfEnd = new Date(req.body.dateOfEnd);
  const userListenCount = await UserListenCount.findOne({ userId });

  if (userListenCount) {
    const filteredTracks = userListenCount.tracks.map((track) => {
      const filteredListens = track.listens.filter((listen) => {
        const listenDate = new Date(listen.date);
        console.log(' listenDate :>> ', listenDate);
        if (dateOfEnd.getTime() === dateOfStart.getTime()) {
          return listen.date.toDateString() === dateOfStart.toDateString();
        }

        return (
          listenDate.getTime() >= dateOfStart.getTime() &&
          listenDate.getTime() <= dateOfEnd.getTime() + 86400000
        );
      });

      return {
        trackId: track.trackId,
        trackName: track.trackName,
        artist: track.artist,
        listens: filteredListens,
      };
    });

    const filterTracksByDate = filteredTracks.filter(
      (track) => track.listens.length > 0,
    );

    res.json(filterTracksByDate);
  } else {
    res.json([]);
  }
};
//добавление трека к добавленым юзером
const addTracksByUsers = async (req, res) => {
  const { id } = req.params; // айди трека
  const { _id: user } = req.user;

  const track = await Track.findById(id);
  if (!track) {
    throw HttpError(404, `Track with id ${id} not found`);
  }
  if (track.addTrackByUsers.includes(user)) {
    throw HttpError(400, `User ${user} already added to track ${id}`);
  }

  await Track.findByIdAndUpdate(track._id, {
    $push: { addTrackByUsers: user },
  });
  res.status(200).json({ message: `Added ${track.trackName} to add` });
};
//удаление трека из добавленых юзером
const deleteTracksByUsers = async (req, res) => {
  const { id } = req.params; // айди трека
  const { _id: user } = req.user;

  const track = await Track.findById(id);
  if (!track) {
    throw HttpError(404, `Track with id ${id} not found`);
  }
  if (!track.addTrackByUsers.includes(user)) {
    throw HttpError(400, `User ${user} already removed from track ${id}`);
  }

  await Track.findByIdAndUpdate(track._id, {
    $pull: { addTrackByUsers: user },
  });
  res.status(200).json({ message: `Removed ${track.trackName} from add` });
};

//получение списка  треков  добавленых юзером
const getAddedTracksByUsers = async (req, res) => {
  const { page = 1, limit = req.query.limit, ...query } = req.query;
  const { _id: user } = req.user;
  const skip = (page - 1) * limit;
  const queryOptions = { addTrackByUsers: user, ...query };

  const tracksInAdd = await Track.find(
    queryOptions,
    'artist trackName trackDuration trackPictureURL trackURL playList addTrackByUsers',
    {
      skip,
      limit,
    },
  )
    .sort({ createdAt: -1 })

    .populate({
      path: 'playList',
      select: 'playlistGenre',
      options: {
        populate: {
          path: 'playlistGenre',
          select: 'genre',
        },
      },
    });
  const totalTracks = await Track.find(queryOptions).countDocuments();
  const tracksSRC = await Track.find(
    queryOptions,
    'artist trackName trackURL ',
  ).sort({ createdAt: -1 });
  const totalPages = Math.ceil(totalTracks / limit);
  const pageNumber = page ? parseInt(page) : null;
  res.json({
    tracksInAdd,

    tracksSRC,
    totalTracks,
    totalPages,
    pageNumber,
  });
};

export default {
  addTracksByUsers: ctrlWrapper(addTracksByUsers),
  deleteTracksByUsers: ctrlWrapper(deleteTracksByUsers),
  getAllUsers: ctrlWrapper(getAllUsers),
  getAddedTracksByUsers: ctrlWrapper(getAddedTracksByUsers),
  // addFavoritePlaylist: ctrlWrapper(addFavoritePlaylist),
  // deleteFavoritePlayList:  ctrlWrapper(deleteFavoritePlayList),
  getFavoritePlaylists: ctrlWrapper(getFavoritePlaylists),
  updateFavoritesPlaylists: ctrlWrapper(updateFavoritesPlaylists),
  createPlayList: ctrlWrapper(createPlayList),

  allGenres: ctrlWrapper(allGenres),
  latestTracks: ctrlWrapper(latestTracks),
  allShops: ctrlWrapper(allShops),
  findGenreById: ctrlWrapper(findGenreById),
  findShopById: ctrlWrapper(findShopById),

  getAddPlaylists: ctrlWrapper(getAddPlaylists),
  updateAddPlaylists: ctrlWrapper(updateAddPlaylists),
  getTracksByGenreId: ctrlWrapper(getTracksByGenreId),
  countListensTrackByUser: ctrlWrapper(countListensTrackByUser),
  getCreatePlaylists: ctrlWrapper(getCreatePlaylists),

  findUserPlayListById: ctrlWrapper(findUserPlayListById),

  updateUserFavoritesPlaylists: ctrlWrapper(updateUserFavoritesPlaylists),
  getCategoryShopById: ctrlWrapper(getCategoryShopById),
  getSubCategoryShopById: ctrlWrapper(getSubCategoryShopById),
  updatePlaylistsSortedTracks: ctrlWrapper(updatePlaylistsSortedTracks),
  countlistensForUser: ctrlWrapper(countlistensForUser),
};
