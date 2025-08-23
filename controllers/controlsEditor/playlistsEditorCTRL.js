import HttpError from '../../helpers/HttpError.js';
import ctrlWrapper from '../../helpers/ctrlWrapper.js';

import PlayList from '../../models/playlistModel.js';
import Genre from '../../models/genreModel.js';
import Track from '../../models/trackModel.js';
import Shop from '../../models/shopModel.js';
import ShopItem from '../../models/shopItemModel.js';
import ShopSubType from '../../models/shopSubTypeModel.js';

import randomCover from '../../helpers/randomCover.js';
import { resizePics } from '../../helpers/resizePics.js';
import isExistStringToLowerCase from '../../helpers/compareStringToLowerCase.js';
import { getRandomNumber } from '../../helpers/randomSort.js';

import {
  randomSortingService,
  updatePublicationService,
} from '../../services/editor/playlistsService.js';

import updTracksPicture from '../../services/editor/updateTrackPictureService.js';
const latestPlaylists = async (req, res) => {
  const {
    page = 1,
    limit = req.query.limit,
    withoutPlaylist = req.query.withoutPlaylist,
    ...query
  } = req.query;
  const skip = (page - 1) * limit;

  const latestPlaylists = await PlayList.find(
    { ...req.query, _id: { $nin: withoutPlaylist } },
    '-createdAt -updatedAt',
    {
      skip,
      limit,
    },
  ).sort({ updatedAt: -1 });
  res.json(latestPlaylists);
};

const createPlayList = async (req, res) => {
  const { playListName, type = 'playlist' } = req.body;
  const { _id: owner } = req?.admin;
  let randomPicUrl;
  let resizePicURL;

  console.log('playListName', playListName);

  const isExistPlaylist = await PlayList.findOne({
    playListName: {
      $regex: playListName.toString(),
      $options: 'i',
    },
  });

  const isExist = isExistStringToLowerCase(
    playListName,
    isExistPlaylist?.playListName,
  );

  if (isExist) {
    res.status(409).json({
      message: `${playListName} already in use`,
      code: '4091',
      object: `${playListName}`,
    });
    return;
  }

  if (!req.file) {
    randomPicUrl = await randomCover(type);
  } else {
    resizePicURL = await resizePics(req.file, type);
  }

  let picURL = !req.file ? randomPicUrl : resizePicURL;

  const newPlayList = await PlayList.create({
    ...req.body,
    playListName: playListName.trim(),
    playListAvatarURL: picURL,
    owner,
  });

  res.status(201).json({
    playListName: newPlayList.playListName,
    typeOfShop: newPlayList.typeOfShop,
    shopCategory: newPlayList.shopCategory,
    owner: newPlayList.owner,
    playListAvatarURL: newPlayList.playListAvatarURL,
  });
};

const createPlayListByGenre = async (req, res) => {
  const { playListName, type } = req.body;
  const { _id: owner } = req?.admin;
  const { id } = req?.params;

  let randomPicUrl;
  let resizePicURL;

  const isExistPlaylist = await PlayList.findOne({
    playListName: {
      $regex: playListName.toString(),
      $options: 'i',
    },
  });

  const isExist = isExistStringToLowerCase(
    playListName,
    isExistPlaylist?.playListName,
  );

  if (isExist) {
    res.status(409).json({
      message: `${playListName} already in use`,
      code: '4091',
      object: `${playListName}`,
    });
    return;
  }

  if (!req.file) {
    randomPicUrl = await randomCover('playlist');
  } else {
    resizePicURL = await resizePics(req.file, type);
  }

  let picURL = !req.file ? randomPicUrl : resizePicURL;

  const newPlayList = await PlayList.create({
    playListName,
    playListAvatarURL: picURL,
    owner,
  });

  await Genre.findByIdAndUpdate(
    id,
    {
      $push: { playList: newPlayList.id },
    },
    { new: true },
  );

  await PlayList.findByIdAndUpdate(newPlayList.id, {
    $push: { playlistGenre: id },
  });

  res.status(201).json({
    playlistId: newPlayList.id,
    playListName: newPlayList.playListName,
    typeOfShop: newPlayList.typeOfShop,
    shopCategory: newPlayList.shopCategory,
    owner: newPlayList.owner,
    playListAvatarURL: newPlayList.playListAvatarURL,
    published: newPlayList.published,
  });
};

const createPlayListInShopLibrary = async (req, res) => {
  const { playListName, type, valueMediaLibrary } = req.body;
  const { idShopLibrary } = req?.params;
  const { _id: owner } = req?.admin;

  let randomPicUrl;
  let resizePicURL;

  const isExistPlaylist = await PlayList.findOne({ playListName });

  if (isExistPlaylist) {
    res.status(409).json({
      message: `${playListName} name in use`,
      code: '4091',
      object: `${playListName}`,
    });
    return;
  }

  if (!req.file) {
    randomPicUrl = await randomCover('playlist');
  } else {
    resizePicURL = await resizePics(req.file, type);
  }

  let picURL = !req.file ? randomPicUrl : resizePicURL;

  const newPlayList = await PlayList.create({
    playListName,
    playListAvatarURL: picURL,
    owner,
  });

  if (newPlayList) {
    switch (valueMediaLibrary) {
      case 'subCategoryShop':
        await ShopSubType.findByIdAndUpdate(
          idShopLibrary,
          {
            $push: { playList: newPlayList.id },
          },
          { new: true },
        );
        break;
      case 'shopItem':
        await ShopItem.findByIdAndUpdate(
          idShopLibrary,
          {
            $push: { playList: newPlayList.id },
          },
          { new: true },
        );
        break;
      case 'shop':
        await Shop.findByIdAndUpdate(
          idShopLibrary,
          {
            $push: { playList: newPlayList.id },
          },
          { new: true },
        );
        break;
      default:
        res.status(404).json({
          message: `This category ${valueMediaLibrary} is not supported`,
          code: '4041',
          object: `${valueMediaLibrary}`,
        });
        return;
    }
  }

  res.status(201).json({
    playListId: newPlayList._id,
    playListName: newPlayList.playListName,
    playListAvatarURL: newPlayList.playListAvatarURL,
  });
};

const getPlaylistsWithOutCurrentTrack = async (req, res) => {
  const { id } = req.params;

  const playlistsWithoutCurrentTrack = await PlayList.find(
    {
      trackList: { $nin: id },
    },
    'playListName playListAvatarURL',
  );

  res.json(playlistsWithoutCurrentTrack);
};

const findPlayListById = async (req, res) => {
  const { id } = req.params;

  const {
    page = req.query.page,
    limit = req.query.limit,
    search = req.query.query,
  } = req.query;

  const skip = (page - 1) * limit;

  const sortPlaylist = await PlayList.findById(id, 'sortedTracks');

  if (!sortPlaylist) {
    throw HttpError(404, `Playlist not found`);
  }

  // const sortedBy = sortPlaylist.sortedTracks
  //   ? { _id: 1, sortIndex: 1 }
  //   : { createdAt: -1 };

  const sortedBy = sortPlaylist.sortedTracks
    ? { sortIndex: 1, _id: 1 }
    : { createdAt: -1 };

  const searchOptions = {
    $or: [
      { artist: { $regex: search || '', $options: 'i' } },
      { trackName: { $regex: search || '', $options: 'i' } },
    ],
  };

  const playlist = await PlayList.findById(
    id,
    '-createdAt -updatedAt -favoriteByUsers',
  )
    .populate({
      path: 'trackList',
      select:
        'artist trackName trackURL trackPictureURL trackDuration isTopChart',
      match: searchOptions,
      options: {
        sort: sortedBy,
        skip,
        limit,
      },
    })
    .populate({ path: 'playlistGenre', select: 'genre' });

  const trackList = await PlayList.findById(id, 'trackList').populate({
    path: 'trackList',
    match: searchOptions,
    select: 'artist trackName trackURL ',
    options: { sort: sortedBy },
  });

  const totalTracks = trackList.trackList.length;

  const totalPages = Math.ceil(totalTracks / limit);

  const tracksSRC = trackList.trackList;

  res.json({
    playlist,
    tracksSRC,
    totalTracks,
    totalPages,
  });
};

const updatePlaylistsSortedTracks = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw HttpError(404, `Id ${id} not found`);
  }

  await randomSortingService(id);

  res.json({ success: true });
};

const updatePlaylistPublication = async (req, res) => {
  const { id } = req.params;

  const updatedPlaylist = updatePublicationService(id, req.body);

  res.json(updatedPlaylist);
};

const updatePlaylistById = async (req, res) => {
  const { id } = req.params;
  const { playListName, type = 'playlist' } = req.body;

  let isExist;
  if (playListName) {
    const isExistPlayList = await PlayList.findOne({
      playListName: {
        $regex: playListName.toString(),
        $options: 'i',
      },
    });
    isExist = isExistStringToLowerCase(
      playListName,
      isExistPlayList?.playListName,
    );
  }

  if (playListName === '' && !req.file) {
    throw HttpError(404, `Playlist is empty`);
  }
  if (isExist) {
    res.status(409).json({
      message: `${playListName} already in use`,
      code: '4091',
      object: `${playListName}`,
    });
    return;
  }

  let resizePicURL;

  if (req.file) {
    resizePicURL = await resizePics(req.file, type);
  }

  const updatedPlaylist = await PlayList.findByIdAndUpdate(
    id,
    {
      ...req.body,
      playListName: playListName.trim(),
      playListAvatarURL: resizePicURL,
    },
    {
      new: true,
    },
  );
  res.json(updatedPlaylist);
};

const deletePlaylist = async (req, res) => {
  const { id } = req.params;
  const { deleteTracks } = req.body;
  const playlist = await PlayList.findById(id);

  const idPlayListInGenre = await Genre.find({
    playList: { $in: [id] },
  });

  const idPlayListsInShop = await Shop.find({
    playList: { $in: [id] },
  });

  const idPlayListsInShopItem = await ShopItem.find({
    playList: { $in: [id] },
  });

  const idPlayListsInShopSubType = await ShopSubType.find({
    playList: { $in: [id] },
  });
  console.log('idPlayListsInShopSubType', idPlayListsInShopSubType);
  console.log('idPlayListInGenre', idPlayListInGenre);
  console.log('idPlayListsInShopItem', idPlayListsInShopItem);

  //не правильно названны переменные
  if (idPlayListInGenre) {
    idPlayListInGenre.map(
      async (genre) =>
        await Genre.updateOne({ _id: genre._id }, { $pull: { playList: id } }),
    );
  }

  if (idPlayListsInShop) {
    idPlayListsInShop.map(
      async (shop) =>
        await Shop.updateOne({ _id: shop._id }, { $pull: { playList: id } }),
    );
  }

  if (idPlayListsInShopItem) {
    idPlayListsInShopItem.map(
      async (shopitem) =>
        await ShopItem.updateOne(
          { _id: shopitem._id },
          { $pull: { playList: id } },
        ),
    );
  }

  if (idPlayListsInShopSubType) {
    idPlayListsInShopSubType.map(
      async (shopsubtype) =>
        await ShopSubType.updateOne(
          { _id: shopsubtype._id },
          { $pull: { playList: id } },
        ),
    );
  }

  if (!playlist) {
    throw HttpError(404, `Playlist with ${id} not found`);
  }

  // if (playlist.owner.toString() !== admin.toString()) {
  //   throw HttpError(
  //     403,
  //     "You can't delete this playlist, because you don't owner"
  //   );
  // }
  console.log('playlist.trackList.length', playlist.trackList.length);
  console.log('deleteTracks', deleteTracks);
  if (deleteTracks && playlist.trackList.length !== 0) {
    console.log('Зашли или нет?');
    await Track.deleteMany({ _id: { $in: playlist.trackList } });
  }
  await PlayList.findByIdAndDelete(id);

  res.json({
    message: `Playlist ${playlist.playListName} was deleted`,
  });
};

const replaceTracksToPlaylists = async (req, res) => {
  const { idPlaylistFrom, tracks, playlists } = req.body;

  let newTracks = [];

  await Promise.all(
    playlists.map(async (id) => {
      const playlist = await PlayList.findById(id, 'trackList');
      newTracks = [];
      tracks.map((trackId) => {
        if (!playlist.trackList.includes(trackId)) {
          newTracks.push(trackId);
        }
      });

      await PlayList.findByIdAndUpdate(id, {
        $push: { trackList: newTracks },
      });

      await Track.updateMany(
        { _id: newTracks },
        {
          $push: {
            playList: id,
          },
        },
      );
    }),
  );

  await PlayList.findByIdAndUpdate(idPlaylistFrom, {
    $pullAll: { trackList: tracks },
  });

  await Track.updateMany(
    { _id: tracks },
    {
      $pull: {
        playList: idPlaylistFrom,
      },
    },
  );

  res.json({ message: 'Ok' });
};

const updateTracksPictureInPlaylist = async (req, res) => {
  const { id } = req.body;

  updTracksPicture(id);

  res.json({ m: 'ok' });
};

export default {
  createPlayList: ctrlWrapper(createPlayList),
  createPlayListByGenre: ctrlWrapper(createPlayListByGenre),
  getPlaylistsWithOutCurrentTrack: ctrlWrapper(getPlaylistsWithOutCurrentTrack),
  findPlayListById: ctrlWrapper(findPlayListById),
  updatePlaylistsSortedTracks: ctrlWrapper(updatePlaylistsSortedTracks),
  updatePlaylistPublication: ctrlWrapper(updatePlaylistPublication),
  updatePlaylistById: ctrlWrapper(updatePlaylistById),
  deletePlaylist: ctrlWrapper(deletePlaylist),
  latestPlaylists: ctrlWrapper(latestPlaylists),
  createPlayListInShopLibrary: ctrlWrapper(createPlayListInShopLibrary),
  replaceTracksToPlaylists: ctrlWrapper(replaceTracksToPlaylists),
  updateTracksPictureInPlaylist: ctrlWrapper(updateTracksPictureInPlaylist),
};
