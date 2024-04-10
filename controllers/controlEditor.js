import path from "path";
import * as fs from "fs";
// import disk from "diskusage";
import os from "os";
import Track from "../models/trackModel.js";
import PlayList from "../models/playlistModel.js";
import Pics from "../models/picsModel.js";
import Shop from "../models/shopModel.js";
import ShopItem from "../models/shopItemModel.js";
import ShopSubType from "../models/shopSubTypeModel.js";
import HttpError from "../helpers/HttpError.js";
import ctrlWrapper from "../helpers/ctrlWrapper.js";

import { resizePics } from "../helpers/resizePics.js";
import randomCover from "../helpers/randomCover.js";

import isExistStringToLowerCase from "../helpers/compareStringToLowerCase.js";

import autoPictureForTrack from "../helpers/autoPicureForTrack.js";

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
  // const { free, available, total } = await disk.check(path);

  res.json({
    free,
    available,
    total,
  });
};

//написать доки

// const uploadTrack = async (req, res) => {
//   const { existFileError, existFileName } = req.uploadTrack;
//   const wrongExt = req?.extError;
//   const { originalname, filename } = req.file;

//   console.log("existFileError", existFileError);
//   console.log("existFileName", existFileName);
//   const FileNameLatin = existFileName.fileName;
//   const FileNameCyrillic = existFileName.translatedFileName;

//   if (wrongExt) {
//     throw HttpError(400, "Wrong extension type! Extensions should be *.mp3");
//   }

//   const playlistId = req?.params?.id;

//   ///////// Запись трека в базу данных, если он в плейлисте или файл на сервере существует
//   if (playlistId && existFileError) {
//     const trackExist = await Track.findOne({
//       trackURL: `tracks/${FileNameLatin}`,
//     });

//     if (!trackExist) {
//       throw HttpError(404, "Track doesn't found");
//     }

//     // если ли трек в плейлисте
//     const playList = await PlayList.findById(playlistId);

//     const isExistTrackInPlaylist = playList.trackList.includes(trackExist?.id);

//     if (isExistTrackInPlaylist) {
//       throw HttpError(409);
//     } else {
//       await PlayList.findByIdAndUpdate(playlistId, {
//         $push: { trackList: trackExist.id },
//       });
//       await Track.findByIdAndUpdate(trackExist.id, {
//         $push: { playList: playlistId },
//       });
//     }
//     res.status(201).json({
//       message: `Track successfully wrote to ${playList.playListName}`,
//     });
//     return;
//   }
//   /////////////

//   if (existFileError) {
//     throw HttpError(409, `Track "${FileNameCyrillic}" already exist`);
//   }

//   if (!req.file) {
//     throw HttpError(404, "File not found for upload");
//   }

//   // const { originalname, filename } = req.file;

//   const fileName = path.parse(FileNameLatin).name.split("__");

//   const defaultCoverURL = "trackCovers/55x36_trackCover_default.jpg";

//   const metadata = await getId3Tags(req.file);

//   const { artist, title, genre, album } = metadata?.common;
//   const { duration } = metadata.format;

//   const resArtist = decodeFromIso8859(artist);
//   const resTitle = decodeFromIso8859(title);

//   const tracksDir = req.file.path.split("/").slice(-2)[0];
//   const trackURL = path.join(tracksDir, filename);
//   let resizeTrackCoverURL;

//   if (resArtist) {
//     const trackPicture = await albumArt(resArtist, {
//       album: album,
//       size: "large",
//     });
//     resizeTrackCoverURL = await resizeTrackCover(trackPicture, "trackCover");
//   }

//   const newTrack = await Track.create({
//     ...req.body,
//   });

//   const track = await Track.findByIdAndUpdate(
//     newTrack._id,
//     {
//       trackURL,
//       artist: artist
//         ? resArtist
//         : `${fileName[0] ? fileName[0] : ""}${" "}${
//             fileName[1] ? fileName[1] : ""
//           }`,
//       trackName: title
//         ? resTitle
//         : `${fileName[2] ? fileName[2] : ""}${" "}${
//             fileName[3] ? fileName[3] : ""
//           }`,

//       $push: { trackGenre: genre ? genre[0] : null },
//       trackDuration: duration ? duration : null,
//       trackPictureURL: resizeTrackCoverURL
//         ? resizeTrackCoverURL
//         : defaultCoverURL || null,
//     },
//     { new: true }
//   );

//   if (playlistId) {
//     await PlayList.findByIdAndUpdate(playlistId, {
//       $push: { trackList: newTrack.id },
//     });
//     await Track.findByIdAndUpdate(newTrack.id, {
//       $push: { playList: playlistId },
//     });
//   }

//   res.json({
//     track,
//   });
// };



const updateTrackPicture = async (req, res) => {
  const { id } = req.body;
  const track = await Track.findById(id);
  if (!track) {
    throw HttpError(404, `Track with ${id} not found`);
  }

  const artist = track.artist;
  const trackName = track.trackName;
  const trackURL = path.join(publicDir, track.trackURL);

  const newCover = await autoPictureForTrack(artist, trackName, trackURL);

  if (!newCover) {
    throw HttpError(400, `Update Error`);
  }

  await Track.findByIdAndUpdate(id, {
    trackPictureURL: newCover,
  });

  res.json({ m: "ok" });
};

const getTracksInChart = async (req, res) => {
  const {
    page = req.query.page,
    limit = req.query.limit,
    ...query
  } = req.query;

  const skip = (page - 1) * limit;

  const tracksInChart = await Track.find(
    { isTopChart: true },
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
    .sort({ trackName: 1 });

  const totalTracks = await Track.find({ isTopChart: true }).countDocuments();

  const tracksSRC = await Track.find(
    { isTopChart: true },
    "artist trackName trackURL"
  ).sort({ trackName: 1 });
  const totalPages = Math.ceil(totalTracks / limit);
  const pageNumber = page ? parseInt(page) : null;

  res.json({
    tracksInChart,
    totalTracks,
    totalPages,
    pageNumber,
    tracksSRC,
  });
};

const addTrackToChart = async (req, res) => {
  const { id } = req.params;
  const track = await Track.findById(id);

  if (!track) {
    throw HttpError(404, `Track with ${id} not found`);
  }

  await Track.findByIdAndUpdate(id, {
    isTopChart: true,
  });

  res.json({ m: "ok" });
};

const removeTrackFromChart = async (req, res) => {
  const { id } = req.params;
  const track = await Track.findById(id);

  if (!track) {
    throw HttpError(404, `Track with ${id} doesn't found`);
  }

  await Track.findByIdAndUpdate(id, {
    isTopChart: false,
  });

  res.json({ m: "ok" });
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

  res.status(200).json({
    message: `Track ${track.artist} ${track.trackName} was deleted in ${playList.playListName} playlist`,

    code: "2000",
    object: {
      artist: `${track.artist}`,
      trackName: `${track.trackName}`,
    },
  });
};

//написать доки



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
    throw HttpError(404, `Shop with ${id} not found`);
  }

  if (shop.shopChildItems.length !== 0) {
    console.log("Попали в if");
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
    await Shop.findByIdAndRemove(id);
  } else {
    console.log("Попали в else");
    await Shop.findByIdAndRemove(id);
  }
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
  uploadPics: ctrlWrapper(uploadPics),

  updateTrackPicture: ctrlWrapper(updateTrackPicture),
  addTrackToChart: ctrlWrapper(addTrackToChart),
  removeTrackFromChart: ctrlWrapper(removeTrackFromChart),
  deleteTrackInPlaylist: ctrlWrapper(deleteTrackInPlaylist),

  getTracksInChart: ctrlWrapper(getTracksInChart),

  createShop: ctrlWrapper(createShop),

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
  deletePlaylistInShopSubCategory: ctrlWrapper(deletePlaylistInShopSubCategory),
  deletePlaylistInShopItem: ctrlWrapper(deletePlaylistInShopItem),
};
