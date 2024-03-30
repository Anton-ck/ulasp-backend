import HttpError from "../../helpers/HttpError.js";
import ctrlWrapper from "../../helpers/ctrlWrapper.js";

import PlayList from "../../models/playlistModel.js";
import Shop from "../../models/shopModel.js";

const deletePlaylistInShop = async (req, res) => {
  const { idShop, idPlaylist } = req.params;

  const playlist = await PlayList.findById(idPlaylist);

  const shop = await Shop.findById(idShop);

  if (!playlist) {
    throw HttpError(404, `Playlist with ${idPlaylist} not found`);
  }

  if (!shop) {
    throw HttpError(404, `Shop item with ${idShop} not found`);
  }

  const isExistPlaylist = shop.playList.includes(idPlaylist);

  if (isExistPlaylist) {
    await Shop.findByIdAndUpdate(idShop, {
      $pull: { playList: idPlaylist },
    });
  } else {
    throw HttpError(
      404,
      `Playlist "${playlist.playListName}" in item "${shopItem.shopItemName}" not found`
    );
  }
  res.json({
    message: `Playlist ${playlist.playListName} was deleted`,
  });
};

export default {
  deletePlaylistInShop: ctrlWrapper(deletePlaylistInShop),
};
