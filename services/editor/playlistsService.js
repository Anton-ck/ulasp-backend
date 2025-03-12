import PlayList from "../../models/playlistModel.js";
import Track from "../../models/trackModel.js";
import HttpError from "../../helpers/HttpError.js";

import { shuffleArray } from "../../helpers/randomSort.js";

export const randomSortingService = async (id) => {
  const playList = await PlayList.findById(id).populate("trackList");

  if (!playList) {
    throw HttpError(404, `Playlist not found`);
  }

  const { trackList } = playList;

  const shuffledTracks = shuffleArray(trackList);

  const bulkOps = shuffledTracks.map((track, index) => ({
    updateOne: {
      filter: { _id: track.id },
      update: {
        $set: { sortIndex: index + Date.now() },
      },
    },
  }));

  if (bulkOps.length > 0) {
    await Track.bulkWrite(bulkOps);
  }

  await PlayList.findByIdAndUpdate(id, {
    sortedTracks: true,
  });
};

export const updatePublicationService = async (id, body) => {
  const isExistPlaylist = await PlayList.findById(id);

  if (isExistPlaylist === null) {
    res.status(404).json({
      message: `ID ${id} don't found`,
      code: "4041",
      object: `${id}`,
    });
  }
  const updatedPlaylist = await PlayList.findByIdAndUpdate(
    id,
    { ...body },
    {
      new: true,
    }
  );

  return updatedPlaylist;
};
