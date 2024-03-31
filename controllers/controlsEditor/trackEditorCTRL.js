import HttpError from "../../helpers/HttpError.js";
import ctrlWrapper from "../../helpers/ctrlWrapper.js";

import PlayList from "../../models/playlistModel.js";
import Track from "../../models/trackModel.js";

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
  addTrackToPlaylists: ctrlWrapper(addTrackToPlaylists),
};
