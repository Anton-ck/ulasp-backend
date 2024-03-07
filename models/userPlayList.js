import { Schema, SchemaType, model } from "mongoose";

import handleMongooseError from "../helpers/handleMongooseError.js";

const userPlaylistSchema = new Schema(
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
      
    trackList: [
      {
        type: Schema.Types.ObjectId,
        ref: "track",
        trackList: [],
      },
    ],

     playlistGenre: [
      {
        type: Schema.Types.ObjectId,
        ref: "genre",
      },
    ],
          
    owner: {
      type: Schema.Types.ObjectId,
      ref: "admin" || "user",
      required: true,
    },

     favoriteByUsers: [
      {
        type: Schema.Types.ObjectId,
      },
    ],
     sortedTracks: {
      type: Object,
      default: null,
    },
  },

  { versionKey: false, timestamps: true }
);

userPlaylistSchema.post("findOneAndUpdate", handleMongooseError);
userPlaylistSchema.post("save", handleMongooseError);

const userPlaylist = model("userplaylist", userPlaylistSchema );

export default userPlaylist;