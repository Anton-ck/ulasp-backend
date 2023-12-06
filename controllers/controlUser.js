import { User, Fop, Company } from "../models/userModel.js";
import PlayList from "../models/playlistModel.js";
import Track from "../models/trackModel.js";
import Genre from "../models/genreModel.js";
import Admin from "../models/adminModel.js";
import HttpError from "../helpers/HttpError.js";
import ctrlWrapper from "../helpers/ctrlWrapper.js";
import jwt from "jsonwebtoken";

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
  const latestPlaylists = await PlayList.find(
    { published: true },
    "playListName playListAvatarURL"
  ).sort({ createdAt: -1 });

  res.json(latestPlaylists);
};

const allGenres = async (req, res) => {
  const allGenres = await Genre.find();

  res.json(allGenres);
};

const latestTracks = async (req, res) => {
  const latestTracks = await Track.find()
    .sort({ createdAt: -1 })
    .limit(9)
    .populate("playList");

  res.json(latestTracks);
};

export default {
  getAllUsers: ctrlWrapper(getAllUsers),
  createPlayList: ctrlWrapper(createPlayList),
  latestPlaylists: ctrlWrapper(latestPlaylists),
  allGenres: ctrlWrapper(allGenres),
  latestTracks: ctrlWrapper(latestTracks),
};
