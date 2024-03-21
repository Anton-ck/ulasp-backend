import ctrlWrapper from "../../helpers/ctrlWrapper.js";
import HttpError from "../../helpers/HttpError.js";
import UserPlaylist from "../../models/userPlayList.js";
import Track from "../../models/trackModel.js";

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

  await UserPlaylist.updateMany(
    { id },
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

  await UserPlaylist.updateMany(
    { id },
    { $pullAll: { trackList: tracksIdArray } },
    { new: true }
  );

  res.json({ message: "Success" });
};

export default {
  addTracksToPlaylist: ctrlWrapper(addTracksToPlaylist),
  deleteTracksFromPlaylist: ctrlWrapper(deleteTracksFromPlaylist),
};
