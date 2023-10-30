import bcrypt from "bcrypt";

import PlayList from "../models/playlistModel.js";
import Pics from "../models/picsModel.js";
import HttpError from "../helpers/HttpError.js";
import ctrlWrapper from "../helpers/ctrlWrapper.js";

import { resizePics } from "../helpers/resizePics.js";

const createPlayList = async (req, res) => {
  const { playListName } = req.body;
  const { _id: owner } = req.admin;

  const playlist = await PlayList.findOne({ playListName });

  const allPics = await Pics.find();

  const randomValue = Math.floor(Math.random() * allPics.length);

  const randomPicUrl = allPics[randomValue].picsURL;

  if (playlist) {
    throw HttpError(409, "PlayList name in use");
  }

  const newPlayList = await PlayList.create({
    ...req.body,
    playListAvatarURL: randomPicUrl,
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

const uploadPics = async (req, res) => {
  if (!req.file) {
    throw HttpError(404, "File not found for upload");
  }
  const picsURL = await resizePics(req.file);
  const cover = await Pics.create({ picsURL });
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

export default {
  createPlayList: ctrlWrapper(createPlayList),
  uploadPics: ctrlWrapper(uploadPics),
  deletePlaylist: ctrlWrapper(deletePlaylist),
};
