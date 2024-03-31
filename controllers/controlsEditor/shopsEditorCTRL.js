import HttpError from "../../helpers/HttpError.js";
import ctrlWrapper from "../../helpers/ctrlWrapper.js";

import PlayList from "../../models/playlistModel.js";
import Shop from "../../models/shopModel.js";
import ShopItem from "../../models/shopItemModel.js";
import ShopSubType from "../../models/shopSubTypeModel.js";

const allShops = async (req, res) => {
  const { page = 1, limit = req.query.limit, ...query } = req.query;
  const skip = (page - 1) * limit;
  const allShops = await Shop.find({ ...req.query }, "-createdAt -updatedAt", {
    skip,
    limit,
  }).sort({ createdAt: -1 });

  res.json(allShops);
};

const getShopById = async (req, res) => {
  const { id } = req.params;
  const allPlaylistsInShopCategory = [];

  const shop = await Shop.findById(id, "-createdAt -updatedAt").populate([
    { path: "playList", select: "playListName playListAvatarURL" },
    {
      path: "shopChildItems",
      select: "shopItemName shopItemAvatarURL playList shopChildSubType",
      options: {
        populate: [
          {
            path: "playList",
            select: "playListName playListAvatarURL",
          },
          {
            path: "shopChildSubType",
            select: "shopSubTypeName playList",
            options: {
              populate: {
                path: "playList",
                select: "playListName playListAvatarURL",
              },
            },
          },
        ],
      },
    },
  ]);

  if (!shop) {
    throw HttpError(404, `Shop with ${id} not found`);
  }

  shop.playList.map((playlist) => allPlaylistsInShopCategory.push(playlist));

  //Проходимся по категориям в ресторанах
  shop.shopChildItems.map((shopChildItem) => {
    // console.log("shopChildItem", shopChildItem);

    //Проходимся по по всем плейлистам в категорях
    shopChildItem.playList.map(async (playlist) => {
      // console.log("playlist", playlist);

      //Добавляем все плейлисты в массив
      allPlaylistsInShopCategory.push(playlist);
    });
    shopChildItem.shopChildSubType.map(async (subtypeitem) => {
      console.log(subtypeitem);
      subtypeitem.playList.map(async (playlist) => {
        // console.log("playlist", playlist);

        allPlaylistsInShopCategory.push(playlist);
      });
    });
  });

  res.json({ shop, allPlaylistsInShopCategory });
};

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
  allShops: ctrlWrapper(allShops),
  getShopById: ctrlWrapper(getShopById),
  deletePlaylistInShop: ctrlWrapper(deletePlaylistInShop),
};
