import PlayList from "../models/playlistModel.js";
import Pics from "../models/picsModel.js";
import Genre from "../models/genreModel.js";
import HttpError from "../helpers/HttpError.js";
import ctrlWrapper from "../helpers/ctrlWrapper.js";

import { resizePics } from "../helpers/resizePics.js";
import randomCover from "../helpers/randomCover.js";

const createPlayList = async (req, res) => {
  console.log(req.body);
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
  console.log(req.admin);
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
    playListName: newPlayList.playListName,
    typeOfShop: newPlayList.typeOfShop,
    shopCategory: newPlayList.shopCategory,
    owner: newPlayList.owner,
    playListAvatarURL: newPlayList.playListAvatarURL,
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

  res.json({ countPlaylists });
};

const latestPlaylists = async (req, res) => {
  const latestPlaylists = await PlayList.find(
    {},
    "playListName playListAvatarURL"
  ).sort({ createdAt: -1 });

  res.json({
    latestPlaylists,
  });
};

const createGenre = async (req, res) => {
  const { genre } = req.body;

  const isExistGenre = await Genre.findOne({ genre });

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




export default {
  createPlayList: ctrlWrapper(createPlayList),
  createPlayListByGenre: ctrlWrapper(createPlayListByGenre),
  uploadPics: ctrlWrapper(uploadPics),
  deletePlaylist: ctrlWrapper(deletePlaylist),
  playlistsCount: ctrlWrapper(playlistsCount),
  latestPlaylists: ctrlWrapper(latestPlaylists),
  createGenre: ctrlWrapper(createGenre),
};
