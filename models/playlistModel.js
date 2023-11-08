import { Schema, model } from "mongoose";

import handleMongooseError from "../helpers/handleMongooseError.js";

const playListSchema = new Schema(
  {
    playListName: {
      type: String,
      required: true,
      unique: true,
    },
    playListAvatarURL: {
      type: String,
      default: null,
    },
    typeOfShop: {
      type: Array,
      default: null,
    },
    shopCategory: {
      type: Array,
      default: null,
    },
    trackList: {
      type: Array,
      default: null,
    },
    published: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "admin" || "user",
      required: true,
    },
  },

  { versionKey: false, timestamps: true }
);

playListSchema.post("findOneAndUpdate", handleMongooseError);
playListSchema.post("save", handleMongooseError);

const PlayList = model("playlist", playListSchema);

export default PlayList;
