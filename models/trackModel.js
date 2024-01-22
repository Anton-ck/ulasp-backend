import { Schema, model } from "mongoose";

import handleMongooseError from "../helpers/handleMongooseError.js";

const trackSchema = new Schema(
  {
    artist: {
      type: String,
      default: null,
    },
    trackName: {
      type: String,
      default: null,
    },
    trackDuration: {
      type: String,
      default: null,
    },
    trackPictureURL: {
      type: String,
      default: null,
    },
    // trackGenre: {
    //   type: String,
    //   default: null,
    // },
    trackGenre: {
      type: Schema.Types.ObjectId,
      ref: "genre",
      default: null,
    },
    trackURL: {
      type: String,
      default: null,
    },
    playList: [
      {
        type: Schema.Types.ObjectId,
        ref: "playlist",
        playList: [],
      },
    ],
  },
  { versionKey: false, timestamps: true }
);

trackSchema.post("save", handleMongooseError);

const Track = model("track", trackSchema);

export default Track;
