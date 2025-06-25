import dotenv from 'dotenv';
import defaultTrackCover from '../common/resources/defaultCovers.js';
import Track from '../models/trackModel.js';
import PlayList from '../models/playlistModel.js';

import autoPictureForTrack from '../helpers/autoPicureForTrack.js';

import path from 'path';

dotenv.config();

const { BASE_URL, PORT } = process.env;

const isImageUrlValid = async (url) => {
  if (!url) return false;
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// const isValidImageUrl = async (req, res, next) => {
//   const bulkOps = [];

//   try {
//     const songs = await Track.find({
//       trackPictureURL: { $exists: true, $ne: defaultTrackCover },
//     }).lean();

//     await Promise.all(
//       songs.map(async ({ _id, trackPictureURL }) => {
//         const isValid = await isImageUrlValid(
//           `${BASE_URL}:${PORT}/${trackPictureURL}`,
//         );
//         if (!isValid) {
//           bulkOps.push({
//             updateOne: {
//               filter: { _id },
//               update: { $set: { trackPictureURL: defaultTrackCover } },
//             },
//           });
//         }
//       }),
//     );
//     if (bulkOps.length > 0) {
//       await Track.bulkWrite(bulkOps);
//     }
//     next();
//   } catch (error) {
//     next(error);
//   }
// };

const isValidImageUrl = async (req, res, next) => {
  const bulkOps = [];

  const publicDir = path.resolve('public/');

  const { id } = req.params;

  try {
    const playlist = await PlayList.findById(id);

    const songs = await Track.find({
      _id: playlist.trackList,
      trackPictureURL: defaultTrackCover,
    }).lean();

    await Promise.all(
      songs.map(async ({ _id, artist, trackName, trackURL }) => {
        const URL = path.join(publicDir, trackURL);

        const result = await autoPictureForTrack(artist, trackName, URL);

        if (result) {
          bulkOps.push({
            updateOne: {
              filter: { _id },
              update: { $set: { trackPictureURL: result } },
            },
          });
        }
      }),
    );

    if (bulkOps.length > 0) {
      await Track.bulkWrite(bulkOps);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default isValidImageUrl;
