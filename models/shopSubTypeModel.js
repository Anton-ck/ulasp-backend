import { Schema, model } from "mongoose";

import handleMongooseError from "../helpers/handleMongooseError.js";

const shopSubTypeSchema = new Schema(
  {
    shopSubTypeName: {
      type: String,
      required: true,
      unique: true,
    },
    shopSubTypeAvatarURL: {
      type: String,
      default: null,
    },
    shopParentItem: [
      {
        type: Schema.Types.ObjectId,
        ref: "shopitem",
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

shopSubTypeSchema.post("findOneAndUpdate", handleMongooseError);
shopSubTypeSchema.post("save", handleMongooseError);

const ShopSubType = model("shopsubtype", shopSubTypeSchema);

export default ShopSubType;
