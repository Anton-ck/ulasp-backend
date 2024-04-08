import path from "path";
import * as fs from "fs";

import HttpError from "../../helpers/HttpError.js";
import ctrlWrapper from "../../helpers/ctrlWrapper.js";

import PlayList from "../../models/playlistModel.js";
import UserPlaylist from "../../models/userPlayList.js";
import Track from "../../models/trackModel.js";

const publicDir = path.resolve("public/");

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

  const playlistWithThisTrack = await PlayList.find({
    trackList: { $in: [id] },
  });

  const userPlaylistWithThisTrack = await UserPlaylist.find({
    trackList: { $in: [id] },
  });

  if (playlistWithThisTrack) {
    playlistWithThisTrack.map(
      async ({ _id }) =>
        await PlayList.updateOne({ _id }, { $pull: { trackList: id } })
    );
  }

  if (userPlaylistWithThisTrack) {
    userPlaylistWithThisTrack.map(
      async ({ _id }) =>
        await UserPlaylist.updateOne({ _id }, { $pull: { trackList: id } })
    );
  }

  res.status(200).json({
    message: `Track ${track.artist} ${track.trackName} was deleted `,

    code: "2000",
    object: {
      artist: `${track.artist}`,
      trackName: `${track.trackName}`,
    },
  });
};

const addTrackToPlaylists = async (req, res) => {
  const { id } = req.params;
  const { idPlaylists } = req.body;

  const track = await Track.findById(id);

  if (!track) {
    throw HttpError(404, `Track with id ${id} not found`);
  }

  await Track.findByIdAndUpdate(id, {
    $push: { playList: idPlaylists },
  });

  await PlayList.updateMany(
    { _id: idPlaylists },
    {
      $push: { trackList: id },
    }
  );

  res.json({ message: "Track successfully added" });
};

export default {
  deleteTrack: ctrlWrapper(deleteTrack),
  addTrackToPlaylists: ctrlWrapper(addTrackToPlaylists),
};
