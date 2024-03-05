import path from "path";
import * as fs from "fs";
import disk from "diskusage";
import os from "os";

import PlayList from "../models/playlistModel.js";
import Pics from "../models/picsModel.js";
import Genre from "../models/genreModel.js";
import Track from "../models/trackModel.js";
import Shop from "../models/shopModel.js";
import ShopItem from "../models/shopItemModel.js";
import ShopSubType from "../models/shopSubTypeModel.js";
import HttpError from "../helpers/HttpError.js";
import ctrlWrapper from "../helpers/ctrlWrapper.js";

import { resizePics, resizeTrackCover } from "../helpers/resizePics.js";
import randomCover from "../helpers/randomCover.js";
import getId3Tags from "../helpers/id3Tags.js";
import decodeFromIso8859 from "../helpers/decode8859-1.js";
import isExistStringToLowerCase from "../helpers/compareStringToLowerCase.js";
import randomFn from "../helpers/randomSort.js";
import albumArt from "album-art";

const publicDir = path.resolve("public/");

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

const getFreeDiskSpace = async (req, res) => {
  let path = os.platform() === "win32" ? "c:" : "/";
  const { free, available, total } = await disk.check(path);

  res.json({
    free,
    available,
    total,
  });
};

const createPlayList = async (req, res) => {
  const { playListName, type } = req.body;
  const { _id: owner } = req?.admin;
  let randomPicUrl;
  let resizePicURL;

  const isExistPlaylist = await PlayList.findOne({ playListName });

  if (isExistPlaylist) {
    throw HttpError(409, `${playListName} name in use`);
  }

  if (!req.file) {
    randomPicUrl = await randomCover("playlist");
  } else {
    resizePicURL = await resizePics(req.file, type);
  }

  let picURL = !req.file ? randomPicUrl : resizePicURL;

  const newPlayList = await PlayList.create({
    ...req.body,
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

  const isExistPlaylist = await PlayList.findOne({ playListName });

  if (isExistPlaylist) {
    throw HttpError(409, `${playListName} name in use`);
  }

  if (!req.file) {
    randomPicUrl = await randomCover("playlist");
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
    { new: true }
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
      code: "4091",
      object: `${playListName}`,
    });
    return;
  }

  if (!req.file) {
    randomPicUrl = await randomCover("playlist");
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
      case "subCategoryShop":
        await ShopSubType.findByIdAndUpdate(
          idShopLibrary,
          {
            $push: { playList: newPlayList.id },
          },
          { new: true }
        );
        break;
      case "shopItem":
        await ShopItem.findByIdAndUpdate(
          idShopLibrary,
          {
            $push: { playList: newPlayList.id },
          },
          { new: true }
        );
        break;
      case "shop":
        await Shop.findByIdAndUpdate(
          idShopLibrary,
          {
            $push: { playList: newPlayList.id },
          },
          { new: true }
        );
        break;
      default:
        res.status(404).json({
          message: `This category ${valueMediaLibrary} is not supported`,
          code: "4041",
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

const findPlayListById = async (req, res) => {
  const { id } = req.params;

  const { page = req.query.page, limit = req.query.limit } = req.query;

  const skip = (page - 1) * limit;

  const sortPlaylist = await PlayList.findById(id, "sortedTracks");

  function isEmptyObject(obj) {
    for (let i in obj) {
      if (obj.hasOwnProperty(i)) {
        return false;
      }
    }
    return true;
  }

  const isEmptySortedTracks = isEmptyObject(sortPlaylist.sortedTracks);

  const sortedBy = !isEmptySortedTracks
    ? sortPlaylist.sortedTracks
    : { createdAt: -1 };

  // console.log("sortedBy GET ===>", sortedBy);

  const playlist = await PlayList.findById(id, "-createdAt -updatedAt")
    .populate({
      path: "trackList",
      options: {
        sort: sortedBy,
        skip,
        limit,
      },
    })
    .populate("playlistGenre");

  if (!playlist) {
    throw HttpError(404, `Playlist not found`);
  }

  const trackList = await PlayList.findById(id, "trackList").populate({
    path: "trackList",
    select: "artist trackName trackURL ",
    options: { sort: sortedBy },
  });

  const totalTracks = trackList.trackList.length;
  const totalPages = Math.ceil(totalTracks / limit);

  const tracksSRC = trackList.trackList;

  res.json({ playlist, totalTracks, totalPages, tracksSRC });
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
    }
  );

  res.json({ message: "ok" });
};

const updatePlaylistById = async (req, res) => {
  const { id } = req.params;
  const isExistPlaylist = await PlayList.findById(id);

  if (isExistPlaylist === null) {
    res.status(404).json({
      message: `ID ${id} doesn't found`,
      code: "4041",
      object: `${id}`,
    });
  }
  // if (isExistPlaylist) {
  //   res.status(409).json({
  //     message: `${isExistPlaylist.playListName} already in use`,
  //     code: "4091",
  //     object: `${isExistPlaylist.playListName}`,
  //   });
  // }

  const updatedPlaylist = await PlayList.findByIdAndUpdate(
    id,
    { ...req.body },
    {
      new: true,
    }
  );

  res.json(updatedPlaylist);
};

const deletePlaylist = async (req, res) => {
  const { id } = req.params;

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
  console.log("idPlayListsInShopSubType", idPlayListsInShopSubType);
  console.log("idPlayListInGenre", idPlayListInGenre);
  console.log("idPlayListsInShopItem", idPlayListsInShopItem);

  //не правильно названны переменные
  if (idPlayListInGenre) {
    idPlayListInGenre.map(
      async (genre) =>
        await Genre.updateOne({ _id: genre._id }, { $pull: { playList: id } })
    );
  }

  if (idPlayListsInShop) {
    idPlayListsInShop.map(
      async (shop) =>
        await Shop.updateOne({ _id: shop._id }, { $pull: { playList: id } })
    );
  }

  if (idPlayListsInShopItem) {
    idPlayListsInShopItem.map(
      async (shopitem) =>
        await ShopItem.updateOne(
          { _id: shopitem._id },
          { $pull: { playList: id } }
        )
    );
  }

  if (idPlayListsInShopSubType) {
    idPlayListsInShopSubType.map(
      async (shopsubtype) =>
        await ShopSubType.updateOne(
          { _id: shopsubtype._id },
          { $pull: { playList: id } }
        )
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

  await PlayList.findByIdAndDelete(id);

  res.json({
    message: `Playlist ${playlist.playListName} was deleted`,
  });
};

const latestPlaylists = async (req, res) => {
  const { page = 1, limit = req.query.limit, ...query } = req.query;
  const skip = (page - 1) * limit;

  const latestPlaylists = await PlayList.find(
    { ...req.query },
    "-createdAt -updatedAt",
    {
      skip,
      limit,
    }
  ).sort({ createdAt: -1 });
  res.json(latestPlaylists);
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

const createGenre = async (req, res) => {
  const { genre } = req.body;
  const isExistGenre = await Genre.findOne({
    genre: {
      $regex: genre.toString(),
      $options: "i",
    },
  });

  const isExist = isExistStringToLowerCase(genre, isExistGenre?.genre);

  if (genre === "") {
    throw HttpError(404, `genre is empty`);
  }
  if (isExist) {
    res.status(409).json({
      message: `${genre} already in use`,
      code: "4091",
      object: `${genre}`,
    });
    return;
  }

  const randomPicUrl = await randomCover("genre");

  const newGenre = await Genre.create({
    ...req.body,
    genreAvatarURL: randomPicUrl,
  });

  res.status(201).json({
    newGenre,
  });
};

const findGenreById = async (req, res) => {
  const { id } = req.params;

  const genre = await Genre.findById(id).populate("playList");

  if (!genre) {
    throw HttpError(404);
  }

  res.json(genre);
};

const updateGenreById = async (req, res) => {
  const { id } = req.params;
  const { genre, type } = req.body;

  const isExistGenre = await Genre.findOne({
    genre,
    // genre: {
    //   $regex: genre.toString(),
    //   $options: "i",
    // },
  });

  if (genre === "") {
    throw HttpError(404, `genre is empty`);
  }
  if (isExistGenre) {
    res.status(409).json({
      message: `${genre} already in use`,
      code: "4091",
      object: `${genre}`,
    });
    return;
  }

  let resizePicURL;

  if (req.file) {
    resizePicURL = await resizePics(req.file, type);
  }

  const newGenre = await Genre.findByIdAndUpdate(
    id,
    { ...req.body, genreAvatarURL: resizePicURL },
    {
      new: true,
    }
  );
  res.json(newGenre);
};

const deleteGenre = async (req, res) => {
  const { id } = req.params;

  const genre = await Genre.findById(id);

  if (!genre) {
    throw HttpError(404, `Genre with ${id} not found`);
  }

  await Genre.findByIdAndDelete(id);

  res.json({
    message: `Genre ${genre.genre} was deleted`,
  });
};

//написать доки

const uploadTrack = async (req, res) => {
  const { existFileError, existFileName } = req.uploadTrack;
  const wrongExt = req?.extError;

  const FileNameLatin = existFileName.fileName;
  const FileNameCyrillic = existFileName.translatedFileName;

  if (wrongExt) {
    throw HttpError(400, "Wrong extension type! Extensions should be *.mp3");
  }

  const playlistId = req?.params?.id;

  ///////// Запись трека в базу данных, если он в плейлисте и файл на сервере существует
  if (playlistId && existFileError) {
    const trackExist = await Track.findOne({
      trackURL: `tracks/${FileNameLatin}`,
    });

    if (!trackExist) {
      throw HttpError(404, "Track doesn't found");
    }

    // если ли трек в плейлисте
    const playList = await PlayList.findById(playlistId);

    const isExistTrackInPlaylist = playList.trackList.includes(trackExist?.id);

    if (isExistTrackInPlaylist) {
      throw HttpError(409);
    } else {
      await PlayList.findByIdAndUpdate(playlistId, {
        $push: { trackList: trackExist.id },
      });
      await Track.findByIdAndUpdate(trackExist.id, {
        $push: { playList: playlistId },
      });
    }
    res.status(201).json({
      message: `Track successfully wrote to ${playList.playListName}`,
    });
    return;
  }
  /////////////

  if (existFileError) {
    throw HttpError(409, `Track "${FileNameCyrillic}" already exist`);
  }

  if (!req.file) {
    throw HttpError(404, "File not found for upload");
  }

  const { originalname, filename } = req.file;

  const fileName = path.parse(FileNameLatin).name.split("__");

  const defaultCoverURL = "trackCovers/55x36_trackCover_default.jpg";

  const metadata = await getId3Tags(req.file);

  const { artist, title, genre, album } = metadata?.common;
  const { duration } = metadata.format;

  const resArtist = decodeFromIso8859(artist);
  const resTitle = decodeFromIso8859(title);

  const tracksDir = req.file.path.split("/").slice(-2)[0];
  const trackURL = path.join(tracksDir, filename);
  let resizeTrackCoverURL;

  if (resArtist) {
    const trackPicture = await albumArt(resArtist, {
      album: album,
      size: "large",
    });
    resizeTrackCoverURL = await resizeTrackCover(trackPicture, "trackCover");
  }

  const newTrack = await Track.create({
    ...req.body,
  });

  const track = await Track.findByIdAndUpdate(
    newTrack._id,
    {
      trackURL,
      artist: artist
        ? resArtist
        : `${fileName[0] ? fileName[0] : ""}${" "}${
            fileName[1] ? fileName[1] : ""
          }`,
      trackName: title
        ? resTitle
        : `${fileName[2] ? fileName[2] : ""}${" "}${
            fileName[3] ? fileName[3] : ""
          }`,

      $push: { trackGenre: genre ? genre[0] : null },
      trackDuration: duration ? duration : null,
      trackPictureURL: resizeTrackCoverURL
        ? resizeTrackCoverURL
        : defaultCoverURL || null,
    },
    { new: true }
  );
  if (playlistId) {
    await PlayList.findByIdAndUpdate(playlistId, {
      $push: { trackList: newTrack.id },
    });
    await Track.findByIdAndUpdate(newTrack.id, {
      $push: { playList: playlistId },
    });
  }

  res.json({
    track,
  });
};

const deleteTrack = async (req, res) => {
  const { id } = req.params;
  const track = await Track.findById(id);
  if (!track) {
    throw HttpError(404, `Track with ${id} not found`);
  }

  const trackPath = publicDir + "/" + track?.trackURL;
  const coverPath = publicDir + "/" + track?.trackPictureURL;

  const howManyCoverUsed = await Track.countDocuments({
    trackPictureURL: track?.trackPictureURL,
  });

  console.log("howManyCoverUsed", howManyCoverUsed);
  await Track.findByIdAndDelete(id);

  if (fs.existsSync(trackPath)) {
    fs.unlinkSync(trackPath);
  }

  if (
    fs.existsSync(coverPath) &&
    !coverPath.includes("trackCover_default") &&
    howManyCoverUsed === 1
  ) {
    fs.unlinkSync(coverPath);
  }

  const idTrackInPlaylist = await PlayList.find({
    trackList: { $in: [id] },
  });

  if (idTrackInPlaylist) {
    idTrackInPlaylist.map(
      async (track) =>
        await PlayList.updateOne(
          { _id: track._id },
          { $pull: { trackList: id } }
        )
    );
  }

  res.json({
    message: `Track ${track.trackName} was deleted`,
  });
};

const deleteTrackInPlaylist = async (req, res) => {
  const { trackId, playlistId } = req.params;

  const track = await Track.findById(trackId);
  const playList = await PlayList.findById(playlistId);

  if (!track) {
    throw HttpError(404, `Track with ${trackId} not found`);
  }
  if (!playList) {
    throw HttpError(404, `Track with ${playlistId} not found`);
  }
  const isExistTracksInPlaylist = playList.trackList.includes(trackId);

  if (isExistTracksInPlaylist) {
    //удаляем айди трека из плейлиста
    await PlayList.findByIdAndUpdate(playlistId, {
      $pull: { trackList: trackId },
    });
    //удаляем айди плейлиста из трека
    await Track.findByIdAndUpdate(trackId, {
      $pull: { playList: playlistId },
    });
  } else {
    throw HttpError(
      404,
      `Track ${track.artist} ${track.trackName} not found in ${playList.playListName} playlist`
    );
  }
  res.json({
    message: `Track ${track.artist} ${track.trackName} was deleted ${playList.playListName} playlist`,
  });
};

//написать доки

const latestTracks = async (req, res) => {
  const {
    page = req.query.page,
    limit = req.query.limit,
    sort = req.query.sort,
    ...query
  } = req.query;

  console.log("sort", sort);

  const skip = (page - 1) * limit;
  const latestTracks = await Track.find(
    { ...req.query },
    "-createdAt -updatedAt",
    {
      skip,
      limit,
    }
  )

    .populate({
      path: "playList",
      select: "playListName",
      options: {
        populate: {
          path: "playlistGenre",
          select: "genre",
        },
      },
    })
    .sort({ trackName: sort });

  const totalTracks = await Track.find().countDocuments();

  const totalPlaylists = await PlayList.find().countDocuments();

  const tracksSRC = await Track.find(
    { ...req.query },
    "artist trackName trackURL"
  ).sort({ trackName: sort });
  const totalPages = Math.ceil(totalTracks / limit);
  const pageNumber = page ? parseInt(page) : null;

  res.json({
    latestTracks,
    totalTracks,
    totalPlaylists,
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

const createShop = async (req, res) => {
  const { shopCategoryName } = req.body;

  const isExistShop = await Shop.findOne({ shopCategoryName });

  if (shopCategoryName === " ") {
    throw HttpError(404, `shop is empty`);
  }
  if (isExistShop) {
    res.status(409).json({
      message: `${shopCategoryName} already in use`,
      code: "4091",
      object: `${shopCategoryName}`,
    });
    return;
  }

  const randomPicUrl = await randomCover("shop");

  const newShop = await Shop.create({
    ...req.body,
    shopAvatarURL: randomPicUrl,
  });

  res.status(201).json({
    newShop,
  });
};

const getShopById = async (req, res) => {
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

    // shopChildItem.shopChildSubType.map(async (id) => {
    //   // console.log(playlistsInSubCat.push(id));
    //   // playlistsInSubCat.push(id);

    //   const subCat = await ShopSubType.findById(id).populate("playList");
    //   // pl.push(subCat);
    //   // console.log(subCat);
    //   if (subCat.playList.length !== 0) {
    //     subCat.playList.map((playlist) => {
    //       playlistsInSubCat.push(playlist._id);
    //     });
    //   }
    // });
  });

  // console.log("allPlaylistsInShopCategory", allPlaylistsInShopCategory);

  // console.log("playlistsInSubCat", playlistsInSubCat);
  // console.log(allPlaylistsInShopCategory);

  res.json({ shop, allPlaylistsInShopCategory, playlistsInSubCat });
};

const updateShopById = async (req, res) => {
  const { id } = req.params;
  const { shopCategoryName, type } = req.body;
  const isExistShop = await Shop.findOne({ shopCategoryName });
  if (shopCategoryName === " ") {
    throw HttpError(404, `shop is empty`);
  }
  if (isExistShop) {
    res.status(409).json({
      message: `${shopCategoryName} already in use`,
      code: "4091",
      object: `${shopCategoryName}`,
    });
    return;
  }

  let resizePicURL;

  if (req.file) {
    resizePicURL = await resizePics(req.file, type);
  }

  const newShop = await Shop.findByIdAndUpdate(
    id,
    { ...req.body, shopAvatarURL: resizePicURL },
    {
      new: true,
    }
  );
  res.json(newShop);
};

const deleteShop = async (req, res) => {
  const { id } = req.params;

  const shop = await Shop.findById(id);

  if (!shop) {
    throw HttpError(404, `Genre with ${id} not found`);
  }

  if (shop.shopChildItems !== 0) {
    shop.shopChildItems.map(async (idShopChildItem) => {
      const childItems = await ShopItem.findById(idShopChildItem);
      childItems.shopChildSubType.map(
        async (idShopChildSubType) =>
          await ShopSubType.findByIdAndRemove(idShopChildSubType)
      );
      await ShopItem.findByIdAndRemove(idShopChildItem);
      await Shop.findByIdAndUpdate(id, {
        $pull: { shopChildItems: idShopChildItem },
      });
    });
  } else {
    await Shop.findByIdAndDelete(id);
  }

  await Shop.findByIdAndDelete(id);

  res.json({
    message: `Shop ${shop.shopCategoryName} was deleted`,
  });
};

const createCategoryShop = async (req, res) => {
  const { shopId } = req.params;
  const { shopItemName } = req.body;

  const isExistCategoryShop = await ShopItem.findOne({ shopItemName });
  if (isExistCategoryShop) {
    res.status(409).json({
      message: `${shopItemName} already in use`,
      code: "4091",
      object: `${shopItemName}`,
    });
    return;
  }

  const randomPicUrl = await randomCover("shop");

  const newShopItem = await ShopItem.create({
    ...req.body,
    shopItemAvatarURL: randomPicUrl,
  });

  await Shop.findByIdAndUpdate(shopId, {
    $push: { shopChildItems: newShopItem._id },
  });

  const shopItem = await ShopItem.findByIdAndUpdate(
    newShopItem._id,
    {
      $push: { shopParentType: shopId },
    },
    { new: true }
  );

  res.status(201).json({
    shopItem,
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
const updateCategoryShopById = async (req, res) => {
  const { id } = req.params;
  const { shopItemName, type } = req.body;
  const isExistShop = await ShopItem.findOne({ shopItemName });
  if (shopItemName === " ") {
    throw HttpError(404, `shop is empty`);
  }
  if (isExistShop) {
    res.status(409).json({
      message: `${shopItemName} already in use`,
      code: "4091",
      object: `${shopItemName}`,
    });
    return;
  }

  let resizePicURL;

  if (req.file) {
    resizePicURL = await resizePics(req.file, type);
  }

  const newShop = await ShopItem.findByIdAndUpdate(
    id,
    { ...req.body, shopItemAvatarURL: resizePicURL },
    {
      new: true,
    }
  );
  res.json(newShop);
};

const deleteCategoryShop = async (req, res) => {
  const { id } = req.params;

  const shopItem = await ShopItem.findById(id);

  if (!shopItem) {
    throw HttpError(404, `Shop category with ${id} not found`);
  }

  console.log(shopItem);

  //удаляем детей саб тайп

  shopItem.shopChildSubType.map(
    async (idShopChildSubType) =>
      await ShopSubType.findByIdAndRemove(idShopChildSubType)
  );

  await Shop.findByIdAndUpdate(shopItem.shopParentType[0]._id, {
    $pull: { shopChildItems: id },
  });

  await ShopItem.findByIdAndDelete(id);

  res.json({
    message: `Shop category ${shopItem.shopItemName} was deleted`,
  });
};

const createSubCategoryShop = async (req, res) => {
  const { shopItemId } = req.params;
  const { shopSubTypeName } = req.body;

  const isExistSubCategoryShop = await ShopSubType.findOne({
    shopSubTypeName: {
      $regex: shopSubTypeName.toString(),
      $options: "i",
    },
  });

  const isExist = isExistStringToLowerCase(
    shopSubTypeName,
    isExistSubCategoryShop?.shopSubTypeName
  );

  if (isExist) {
    res.status(409).json({
      message: `${shopSubTypeName} already in use`,
      code: "4091",
      object: `${shopSubTypeName}`,
    });
    return;
  }

  const randomPicUrl = await randomCover("shop");

  const newShopSubCategory = await ShopSubType.create({
    ...req.body,
    shopSubTypeAvatarURL: randomPicUrl,
  });

  await ShopItem.findByIdAndUpdate(shopItemId, {
    $push: { shopChildSubType: newShopSubCategory._id },
  });

  const shopSubCategory = await ShopSubType.findByIdAndUpdate(
    newShopSubCategory._id,
    {
      $push: { shopParentItem: shopItemId },
    },
    { new: true }
  );

  res.status(201).json({
    shopSubCategory,
  });
};

const getSubCategoryShopById = async (req, res) => {
  const { id } = req.params;

  const shop = await ShopSubType.findById(id).populate("playList");

  if (!shop) {
    throw HttpError(404, `Shop subcategory with ${id} not found`);
  }

  res.json(shop);
};

const updateSubCategoryShopById = async (req, res) => {
  const { id } = req.params;
  const { shopSubTypeName, type } = req.body;
  const isExistShopSubCategory = await ShopSubType.findOne({ shopSubTypeName });
  if (shopSubTypeName === " ") {
    throw HttpError(404, `shop is empty`);
  }
  if (isExistShopSubCategory) {
    res.status(409).json({
      message: `${shopSubTypeName} already in use`,
      code: "4091",
      object: `${shopSubTypeName}`,
    });
  }

  let resizePicURL;

  if (req.file) {
    resizePicURL = await resizePics(req.file, type);
  }

  const newShop = await ShopSubType.findByIdAndUpdate(
    id,
    { ...req.body, shopSubTypeAvatarURL: resizePicURL },
    {
      new: true,
    }
  );
  res.json(newShop);
};

const deleteSubCategoryShop = async (req, res) => {
  const { id } = req.params;

  const shopSubCategory = await ShopSubType.findById(id);

  if (!shopSubCategory) {
    throw HttpError(404, `Shop subcategory with ${id} not found`);
  }

  await ShopItem.findByIdAndUpdate(shopSubCategory.shopParentItem[0]._id, {
    $pull: { shopChildSubType: id },
  });

  await ShopSubType.findByIdAndDelete(id);

  res.json({
    message: `Shop category ${shopSubCategory.shopSubTypeName} was deleted`,
  });
};

const deletePlaylistInShopSubCategory = async (req, res) => {
  const { idSubCategory, idPlaylist } = req.params;

  const playlist = await PlayList.findById(idPlaylist);

  const subCategoryShop = await ShopSubType.findById(idSubCategory);

  if (!playlist) {
    throw HttpError(404, `Playlist with ${idPlaylist} not found`);
  }

  if (!subCategoryShop) {
    throw HttpError(404, `Subcategory with ${idSubCategory} not found`);
  }

  const isExistPlaylist = subCategoryShop.playList.includes(idPlaylist);

  if (isExistPlaylist) {
    await ShopSubType.findByIdAndUpdate(idSubCategory, {
      $pull: { playList: idPlaylist },
    });
  } else {
    throw HttpError(
      404,
      `Playlist "${playlist.playListName} "in subcategory "${subCategoryShop.shopSubTypeName}" not found`
    );
  }
  res.json({
    message: `Playlist ${playlist.playListName} was deleted`,
  });
};

const deletePlaylistInShopItem = async (req, res) => {
  const { idShopItem, idPlaylist } = req.params;

  const playlist = await PlayList.findById(idPlaylist);

  const shopItem = await ShopItem.findById(idShopItem);

  if (!playlist) {
    throw HttpError(404, `Playlist with ${idPlaylist} not found`);
  }

  if (!shopItem) {
    throw HttpError(404, `Shop item with ${idShopItem} not found`);
  }

  const isExistPlaylist = shopItem.playList.includes(idPlaylist);

  if (isExistPlaylist) {
    await ShopItem.findByIdAndUpdate(idShopItem, {
      $pull: { playList: idPlaylist },
    });
  } else {
    throw HttpError(
      404,
      `Playlist "${playlist.playListName}" in item "${shopItem.shopItemName}" not found`
    );
  }
  res.json({
    message: `Playlist ${playlist.playListName} was deleted`,
  });
};

export default {
  getFreeDiskSpace: ctrlWrapper(getFreeDiskSpace),
  createPlayList: ctrlWrapper(createPlayList),
  createPlayListByGenre: ctrlWrapper(createPlayListByGenre),
  findPlayListById: ctrlWrapper(findPlayListById),
  updatePlaylistsSortedTracks: ctrlWrapper(updatePlaylistsSortedTracks),
  updatePlaylistById: ctrlWrapper(updatePlaylistById),
  uploadPics: ctrlWrapper(uploadPics),
  deletePlaylist: ctrlWrapper(deletePlaylist),
  latestPlaylists: ctrlWrapper(latestPlaylists),
  allGenres: ctrlWrapper(allGenres),
  createGenre: ctrlWrapper(createGenre),
  findGenreById: ctrlWrapper(findGenreById),
  updateGenreById: ctrlWrapper(updateGenreById),
  deleteGenre: ctrlWrapper(deleteGenre),
  uploadTrack: ctrlWrapper(uploadTrack),
  deleteTrackInPlaylist: ctrlWrapper(deleteTrackInPlaylist),
  deleteTrack: ctrlWrapper(deleteTrack),
  latestTracks: ctrlWrapper(latestTracks),
  allShops: ctrlWrapper(allShops),
  createShop: ctrlWrapper(createShop),
  getShopById: ctrlWrapper(getShopById),
  updateShopById: ctrlWrapper(updateShopById),
  deleteShop: ctrlWrapper(deleteShop),
  createCategoryShop: ctrlWrapper(createCategoryShop),
  getCategoryShopById: ctrlWrapper(getCategoryShopById),
  updateCategoryShopById: ctrlWrapper(updateCategoryShopById),
  deleteCategoryShop: ctrlWrapper(deleteCategoryShop),
  createSubCategoryShop: ctrlWrapper(createSubCategoryShop),
  getSubCategoryShopById: ctrlWrapper(getSubCategoryShopById),
  updateSubCategoryShopById: ctrlWrapper(updateSubCategoryShopById),
  deleteSubCategoryShop: ctrlWrapper(deleteSubCategoryShop),
  createPlayListInShopLibrary: ctrlWrapper(createPlayListInShopLibrary),
  deletePlaylistInShopSubCategory: ctrlWrapper(deletePlaylistInShopSubCategory),
  deletePlaylistInShopItem: ctrlWrapper(deletePlaylistInShopItem),
};
