import ctrlWrapper from "../../helpers/ctrlWrapper.js";
import HttpError from "../../helpers/HttpError.js";
import UserPlaylist from "../../models/userPlayList.js";
import Track from "../../models/trackModel.js";

import { resizePics } from "../../helpers/resizePics.js";
import isExistStringToLowerCase from "../../helpers/compareStringToLowerCase.js";

const addTracksToPlaylist = async (req, res) => {
  const { id, tracksIdArray } = req.body;

  const playList = await UserPlaylist.findById(id);

  if (!playList) {
    throw HttpError(404, `Playlist with id ${id} not found`);
  }

  let arrayTracksForUpdate = [];
  let existTracksInPlaylist = [];

  tracksIdArray.map((track) => {
    if (!playList.trackList.includes(track)) {
      arrayTracksForUpdate.push(track);
    } else {
      existTracksInPlaylist.push(track);
    }
  });

  await UserPlaylist.findByIdAndUpdate(
    { _id: id },
    { $push: { trackList: arrayTracksForUpdate } },
    { new: true }
  );

  const resultSuccess = await Track.find(
    {
      _id: { $in: arrayTracksForUpdate },
    },
    "artist trackName"
  );

  const resultReject = await Track.find(
    {
      _id: { $in: existTracksInPlaylist },
    },
    "artist trackName"
  );

  res.status(201).json({ resultReject, resultSuccess });
};

const deleteTracksFromPlaylist = async (req, res) => {
  const { id, tracksIdArray } = req.body;

  const playList = await UserPlaylist.findById(id);

  if (!playList) {
    throw HttpError(404, `Playlist with id ${id} not found`);
  }

  await UserPlaylist.findByIdAndUpdate(
    { _id: id },
    { $pullAll: { trackList: tracksIdArray } },
    { new: true }
  );

  res.json({ message: "Success" });
};

const addTrackToPlaylistUser = async (req, res) => {
  const { id, trackId } = req.body; //плелист и трек
  console.log("req.body :>> ", req.body);

  const { _id: user } = req.user;
  const playList = await UserPlaylist.findOne({ _id: id, owner: user });
  console.log("playList :>> ", playList);
  if (!playList) {
    throw HttpError(
      404,
      `Playlist with id ${id} not found or you don't have access to it`
    );
  }

  if (playList.trackList.includes(trackId)) {
    throw HttpError(400, `Track ${trackId} already added to playList ${id}`);
  }

  await UserPlaylist.findByIdAndUpdate(playList._id, {
    $push: { trackList: trackId },
  });
  res
    .status(200)
    .json({ message: `Added ${trackId} to ${playList.playListName}` });
};

const updateUserPlaylistById = async (req, res) => {
  const { id } = req.params;
  const { playListName, type = "playlist" } = req.body;

  console.log("id", id);

  console.log("playListName", playListName);

  console.log("req.body", req.body);

  let isExist;
  if (playListName) {
    const isExistPlayList = await UserPlaylist.findOne({
      playListName: {
        $regex: playListName.toString(),
        $options: "i",
      },
    });
    isExist = isExistStringToLowerCase(
      playListName,
      isExistPlayList?.playListName
    );
  }

  if (playListName === "" && !req.file) {
    throw HttpError(404, `Playlist is empty`);
  }
  if (isExist) {
    res.status(409).json({
      message: `${playListName} already in use`,
      code: "4091",
      object: `${playListName}`,
    });
    return;
  }

  let resizePicURL;

  if (req.file) {
    resizePicURL = await resizePics(req.file, type);
  }

  const updatedPlaylist = await UserPlaylist.findByIdAndUpdate(
    id,
    { ...req.body, playListAvatarURL: resizePicURL },
    {
      new: true,
    }
  );
  res.json(updatedPlaylist);
};

const createUserPlaylist = async (req, res) => {
  const { playListName, type } = req.body;
  const { _id: owner } = req?.user;
  let randomPicUrl;
  let resizePicURL;

  const playlist = await UserPlaylist.findOne({ playListName });

  let isExist;
  if (playListName) {
    const isExistPlayList = await UserPlaylist.findOne({
      playListName: {
        $regex: playListName.toString(),
        $options: "i",
      },
    });
    isExist = isExistStringToLowerCase(
      playListName,
      isExistPlayList?.playListName
    );
  }

  if (playListName === "" && !req.file) {
    throw HttpError(404, `Playlist is empty`);
  }
  if (isExist) {
    res.status(409).json({
      message: `${playListName} already in use`,
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

  const newPlayList = await UserPlaylist.create({
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

export default {
  addTrackToPlaylistUser: ctrlWrapper(addTrackToPlaylistUser),
  addTracksToPlaylist: ctrlWrapper(addTracksToPlaylist),
  deleteTracksFromPlaylist: ctrlWrapper(deleteTracksFromPlaylist),
  updateUserPlaylistById: ctrlWrapper(updateUserPlaylistById),
  createUserPlaylist: ctrlWrapper(createUserPlaylist),
};
