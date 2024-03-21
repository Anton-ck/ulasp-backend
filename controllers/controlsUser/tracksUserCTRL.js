import ctrlWrapper from "../../helpers/ctrlWrapper.js";
import HttpError from "../../helpers/HttpError.js";
import UserPlaylist from "../../models/userPlayList.js";
import Track from "../../models/trackModel.js";

const getAllTracksForUserPlaylists = async (req, res) => {
  const {
    id = req.query.id,
    page = req.query.page,
    limit = req.query.limit || 10,
    search = req.query.query || "",
  } = req.query;
  const skip = (page - 1) * limit;

  const playList = await UserPlaylist.findById(id, "trackList");

  if (!playList) {
    throw HttpError(404, `Playlist with id ${id} not found`);
  }

  console.log("playList.trackList", playList.trackList);

  const queryOptions = {
    _id: { $nin: playList.trackList },
    $or: [
      { artist: { $regex: search.toString(), $options: "i" } },
      { trackName: { $regex: search.toString(), $options: "i" } },
    ],
  };

  const tracks = await Track.find(
    queryOptions,
    "artist trackName trackDuration playList",
    {
      skip,
      limit,
    }
  )
    .sort({ createdAt: -1 })

    .populate({
      path: "playList",
      select: "playlistGenre",
      options: {
        populate: {
          path: "playlistGenre",
          select: "genre",
        },
      },
    });

  const totalTracks = await Track.find(queryOptions).countDocuments();

  const tracksSRC = await Track.find(
    queryOptions,
    "artist trackName trackURL"
  ).sort({ createdAt: -1 });
  const totalPages = Math.ceil(totalTracks / limit);
  const pageNumber = page ? parseInt(page) : null;

  res.json({
    tracks,

    tracksSRC,
    totalTracks,
    totalPages,
    pageNumber,
  });
};

export default {
  getAllTracksForUserPlaylists: ctrlWrapper(getAllTracksForUserPlaylists),
};
