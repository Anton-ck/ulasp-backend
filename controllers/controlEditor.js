import PlayList from "../models/playlistModel.js";
import Pics from "../models/picsModel.js";
import Genre from "../models/genreModel.js";
import Track from "../models/trackModel.js";
import Shop from "../models/shopModel.js";
import HttpError from "../helpers/HttpError.js";
import ctrlWrapper from "../helpers/ctrlWrapper.js";
import path from "path";
import * as fs from "fs";
import { resizePics, resizeTrackCover } from "../helpers/resizePics.js";
import randomCover from "../helpers/randomCover.js";
import getId3Tags from "../helpers/id3Tags.js";

import albumArt from "album-art";

const publicDir = path.resolve("public/");

const createPlayList = async (req, res) => {
  const { playListName } = req.body;
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
    resizePicURL = await resizePics(req.file);
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

  console.log("BODY", req.body);
  console.log("FILE", req.file);

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

const findPlayListById = async (req, res) => {
  const { id } = req.params;
  const playlist = await PlayList.findById(id).populate({
    path: "trackList",
    options: { sort: { createdAt: -1 }, populate: "trackGenre" },
  });

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
  const { _id: admin } = req.admin;

  const playlist = await PlayList.findById(id);

  const idPlayListInGenre = await Genre.find({
    playList: { $in: [id] },
  });

  if (idPlayListInGenre) {
    idPlayListInGenre.map(
      async (playlist) =>
        await Genre.updateOne(
          { _id: playlist._id },
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

const playlistsCount = async (req, res) => {
  const countPlaylists = await PlayList.find().count();

  res.json({ countPlaylists: countPlaylists });
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

  const totalHits = await PlayList.countDocuments();

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
    .sort({ createdAt: -1 });

  res.json(allGenres);
};

const createGenre = async (req, res) => {
  const { genre } = req.body;
  const isExistGenre = await Genre.findOne({ genre });
  if (genre === "") {
    throw HttpError(404, `genre is empty`);
  }
  if (isExistGenre) {
    throw HttpError(409, `${genre} already in use`);
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
  const isExistGenre = await Genre.findOne({ genre });
  if (genre === "") {
    throw HttpError(404, `genre is empty`);
  }
  // if (isExistGenre) {
  //   throw HttpError(409, `${genre} already in use`);
  // }

  if (isExistGenre) {
    res.status(409).json({
      message: `${genre} already in use`,
      code: "4091",
      object: `${genre}`,
    });
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
  // console.log("FILE", req.file);
  // console.log(req.translatedFileName);
  
  const translatedFileName = req.translatedFileName;

  if (req.existFileError === "Error") {
    throw HttpError(409, `Track "${req.file.filename}" already exist`);
  }

  if (req.extError === "Error") {
    throw HttpError(400, "Wrong extension type! Extensions should be *.mp3");
  }

  if (!req.file) {
    throw HttpError(404, "File not found for upload");
  }

  const playlistId = req?.params?.id;
  const { originalname, filename } = req.file;

  const fileName = path.parse(translatedFileName).name.split("__");

  const defaultCoverURL = "trackCovers/55x36_trackCover_default.jpg";

  const metadata = await getId3Tags(req.file);

  const { artist, title, genre, album } = metadata?.common;
  const { duration } = metadata.format;
  const isExistTrack = await Track.find({ artist: artist, trackName: title });
  // if (isExistTrack.length !== 0) {
  //   throw HttpError(409, `Track "${originalname}" already exist`);
  // }

  const tracksDir = req.file.path.split("/").slice(-2)[0];
  const trackURL = path.join(tracksDir, filename);
  let resizeTrackCoverURL;

  if (artist) {
    const trackPicture = await albumArt(artist, {
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
        ? artist
        : `${fileName[0] ? fileName[0] : ""}${" "}${
            fileName[1] ? fileName[1] : ""
          }`,
      trackName: title
        ? title
        : `${fileName[2] ? fileName[2] : ""}${" "}${
            fileName[3] ? fileName[3] : ""
          }`,
      // trackGenre: genre?.toString(),
      trackGenre: null,
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

    const playlistInGenre = await Genre.find({
      playList: { $in: [playlistId] },
    });

    if (playlistInGenre.length !== 0) {
      console.log("playlistInGenre", playlistInGenre[0]._id);
      await Track.findByIdAndUpdate(newTrack.id, {
        $push: { playList: playlistId },
        trackGenre: playlistInGenre[0]._id,
      });
    } else {
      console.log("Плейлиста в жанре нету");
      await Track.findByIdAndUpdate(newTrack.id, {
        $push: { playList: playlistId },
      });
    }
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

  await Track.findByIdAndDelete(id);

  if (fs.existsSync(trackPath)) {
    fs.unlinkSync(trackPath);
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

//написать доки
const countTracks = async (req, res) => {
  const countTracks = await Track.find().count();

  res.json({ countTracks: countTracks });
};
//написать доки

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

    .populate("playList")
    .populate("trackGenre");

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

const createShop = async (req, res) => {
  const { shopCategoryName } = req.body;
  const isExistShop = await Shop.findOne({ shopCategoryName });
  if (shopCategoryName === "") {
    throw HttpError(404, `shop is empty`);
  }
  if (isExistShop) {
    throw HttpError(409, `${shopCategoryName} already in use`);
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

const deleteShop = async (req, res) => {
  const { id } = req.params;

  const shop = await Shop.findById(id);

  if (!shop) {
    throw HttpError(404, `Genre with ${id} not found`);
  }

  await Shop.findByIdAndDelete(id);

  res.json({
    message: `Shop ${shop.shopCategoryName} was deleted`,
  });
};

// const getTracksInGenre = async (req, res) => {
//   const { id } = req.params;
//   const allTracks = [];

//   const genre = await Genre.findById(id).populate({
//     path: "playList",
//     options: { populate: "trackList" },
//   });

//   genre.playList.map((playlist) => allTracks.push(playlist.trackList));

//   res.json(allTracks.flat());

//  const { id } = req.params;

//  const genre = await Genre.findById(id).populate("playList");

//  const tracksPromises = genre.playList.map(async (playlist) => {
//    const tracks = await Track.find({ playList: playlist._id });

//    return tracks;
//  });

//  const tracks = await Promise.all(tracksPromises).then((results) => {
//    return results.flat();
//  });

//  res.json(tracks);
// };

export default {
  createPlayList: ctrlWrapper(createPlayList),
  createPlayListByGenre: ctrlWrapper(createPlayListByGenre),
  findPlayListById: ctrlWrapper(findPlayListById),
  updatePlaylistById: ctrlWrapper(updatePlaylistById),
  uploadPics: ctrlWrapper(uploadPics),
  deletePlaylist: ctrlWrapper(deletePlaylist),
  playlistsCount: ctrlWrapper(playlistsCount),
  latestPlaylists: ctrlWrapper(latestPlaylists),
  allGenres: ctrlWrapper(allGenres),
  createGenre: ctrlWrapper(createGenre),
  findGenreById: ctrlWrapper(findGenreById),
  updateGenreById: ctrlWrapper(updateGenreById),
  deleteGenre: ctrlWrapper(deleteGenre),
  uploadTrack: ctrlWrapper(uploadTrack),
  deleteTrack: ctrlWrapper(deleteTrack),
  countTracks: ctrlWrapper(countTracks),
  latestTracks: ctrlWrapper(latestTracks),
  allShops: ctrlWrapper(allShops),
  createShop: ctrlWrapper(createShop),
  deleteShop: ctrlWrapper(deleteShop),
  // getTracksInGenre: ctrlWrapper(getTracksInGenre),
};
