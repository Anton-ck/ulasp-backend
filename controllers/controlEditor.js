import PlayList from "../models/playlistModel.js";
import Pics from "../models/picsModel.js";
import Genre from "../models/genreModel.js";
import Track from "../models/trackModel.js";
import HttpError from "../helpers/HttpError.js";
import ctrlWrapper from "../helpers/ctrlWrapper.js";
import path from "path";

import { resizePics, resizeTrackCover } from "../helpers/resizePics.js";
import randomCover from "../helpers/randomCover.js";
import getId3Tags from "../helpers/id3Tags.js";

import albumArt from "album-art";

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
  const { playListName } = req.body;
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
    resizePicURL = await resizePics(req.file);
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
      $push: { childPlaylist: newPlayList.id },
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

const updatePlaylist = async (req, res) => {};

const deletePlaylist = async (req, res) => {
  const { id } = req.params;
  const { _id: admin } = req.admin;

  console.log(id);
  const playlist = await PlayList.findById(id);

  if (!playlist) {
    throw HttpError(404, `Playlist with ${id} not found`);
  }

  if (playlist.owner.toString() !== admin.toString()) {
    throw HttpError(
      403,
      "You can't delete this playlist, because you don't owner"
    );
  }

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
  const latestPlaylists = await PlayList.find(
    {},
    "playListName playListAvatarURL"
  ).sort({ createdAt: -1 });

  res.json(latestPlaylists);
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

const allGenres = async (req, res) => {
  const allGenres = await Genre.find();

  res.json(allGenres);
};
//написать доки
const uploadTrack = async (req, res) => {
  const playlistId = req?.params?.id;
  const { originalname } = req.file;
  const fileName = originalname.split(" ");
  const defaultCoverURL = "trackCovers/55x36_trackCover_default.png";
  if (!req.file) {
    throw HttpError(404, "File not found for upload");
  }

  const metadata = await getId3Tags(req.file);
  const { artist, title, genre, album } = metadata?.common;
  const { duration } = metadata.format;
  const isExistTrack = await Track.find({ artist: artist, trackName: title });
  if (isExistTrack.length !== 0) {
    throw HttpError(409, `Track "${originalname}" already exist`);
  }

  const tracksDir = req.file.path.split("/").slice(-2)[0];
  const trackURL = path.join(tracksDir, originalname);
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

  const payload = {
    id: newTrack._id,
  };

  const track = await Track.findByIdAndUpdate(
    newTrack._id,
    {
      trackURL,
      artist: artist ? artist : fileName[0],
      trackName: title ? title : fileName[1],
      trackGenre: genre?.toString(),
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

//написать доки
const countTracks = async (req, res) => {
  const countTracks = await Track.find().count();

  res.json({ countTracks: countTracks });
};
//написать доки

const latestTracks = async (req, res) => {
  const latestTracks = await Track.find()
    .sort({ createdAt: -1 })
    .limit(9)
    .populate("playList");

  res.json(latestTracks);
};

export default {
  createPlayList: ctrlWrapper(createPlayList),
  createPlayListByGenre: ctrlWrapper(createPlayListByGenre),
  uploadPics: ctrlWrapper(uploadPics),
  deletePlaylist: ctrlWrapper(deletePlaylist),
  playlistsCount: ctrlWrapper(playlistsCount),
  latestPlaylists: ctrlWrapper(latestPlaylists),
  createGenre: ctrlWrapper(createGenre),
  allGenres: ctrlWrapper(allGenres),
  uploadTrack: ctrlWrapper(uploadTrack),
  countTracks: ctrlWrapper(countTracks),
  latestTracks: ctrlWrapper(latestTracks),
};
