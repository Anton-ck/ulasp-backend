import dotenv from 'dotenv';
import defaultTrackCover from '../common/resources/defaultCovers.js';
import Track from '../models/trackModel.js';

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

const isValidImageUrl = async (req, res, next) => {
  const bulkOps = [];

  try {
    const songs = await Track.find({
      trackPictureURL: { $exists: true, $ne: defaultTrackCover },
    }).lean();

    console.log('songs ===>>>>', songs.length);

    await Promise.all(
      songs.map(async ({ _id, trackPictureURL }) => {
        const isValid = await isImageUrlValid(
          `${BASE_URL}:${PORT}/${trackPictureURL}`,
        );
        if (!isValid) {
          bulkOps.push({
            updateOne: {
              filter: { _id },
              update: { $set: { trackPictureURL: defaultTrackCover } },
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
