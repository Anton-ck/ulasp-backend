import { Schema, model } from "mongoose";

import handleMongooseError from "../helpers/handleMongooseError.js";

const shopSchema = new Schema(
  {
    shopCategoryName: {
      type: String,
      required: true,
    },
    shopAvatarURL: {
      type: String,
      default: null,
    },
    playList: [
      {
        type: Schema.Types.ObjectId,
        ref: "playlist",
        playList: [],
        default: null,
      },
    ],
    shopChildItems: [
      {
        type: Schema.Types.ObjectId,
        ref: "shopitem",
        default: null,
      },
    ],
  },
  { versionKey: false, timestamps: true }
);

shopSchema.post("findOneAndUpdate", handleMongooseError);
shopSchema.post("save", handleMongooseError);

const Shop = model("shop", shopSchema);

export default Shop;
