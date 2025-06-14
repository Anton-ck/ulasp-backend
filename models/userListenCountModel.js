import { Schema, model } from 'mongoose';

import handleMongooseError from '../helpers/handleMongooseError.js';

//general Schema FOP and company

const userListenCountSchema = new Schema(
  {
    userId: Schema.Types.ObjectId,
    tracks: [
      {
        trackId: { type: Schema.Types.ObjectId },
        trackName: { type: String, default: null },
        artist: { type: String, default: null },

        listens: [
          {
            countOfListenes: {
              type: Number,
            },
            date: {
              type: Date,
            },
          },
        ],
      },
    ],
    totalListens: {
      type: Number,
      default: 0,
    },
  },

  { versionKey: false, timestamps: true },
);

userListenCountSchema.post('save', handleMongooseError);

export const UserListenCount = model('userListenCount', userListenCountSchema);
