import { Schema, model } from "mongoose";

import handleMongooseError from "../helpers/handleMongooseError.js";

const shopItemSchema = new Schema(
  {
    shopItemName: {
      type: String,
      required: true,
    },
    shopItemAvatarURL: {
      type: String,
      default: null,
    },
    shopParentType: [
      {
        type: Schema.Types.ObjectId,
        ref: "shop",
        default: null,
      },
    ],
    shopChildSubType: [
      {
        type: Schema.Types.ObjectId,
        ref: "shopsubtype",
        default: null,
      },
    ],
    playList: [
      {
        type: Schema.Types.ObjectId,
        ref: "playlist",
        default: null,
      },
    ],
  },
  { versionKey: false, timestamps: true }
);

shopItemSchema.post("findOneAndUpdate", handleMongooseError);
shopItemSchema.post("save", handleMongooseError);

const ShopItem = model("shopitem", shopItemSchema);

export default ShopItem;
