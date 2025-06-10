import { Schema, model } from 'mongoose';

import handleMongooseError from '../helpers/handleMongooseError.js';

const genreSchema = new Schema(
  {
    genre: {
      type: String,
      required: true,
      unique: true,
    },
    genreAvatarURL: {
      type: String,
      default: null,
    },
    playList: [
      {
        type: Schema.Types.ObjectId,
        ref: 'playlist',
        playList: [],
        default: null,
      },
    ],
  },
  { versionKey: false, timestamps: true },
);

genreSchema.post('save', handleMongooseError);

const Genre = model('genre', genreSchema);

export default Genre;
