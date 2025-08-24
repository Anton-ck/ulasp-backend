import path from 'path';

import PlayList from '../../models/playlistModel.js';
import Track from '../../models/trackModel.js';

import HttpError from '../../helpers/HttpError.js';

import autoPictureForTrack from '../../helpers/autoPicureForTrack.js';

import defaultTrackCover from '../../common/resources/defaultCovers.js';

const updateTracksPicture = async (idPlaylist) => {
  if (!idPlaylist) {
    HttpError(404, 'PlayList id not found');
  }

  const publicDir = path.resolve('public/');

  try {
    const playlist = await PlayList.findById(idPlaylist);

    const songs = await Track.find({
      _id: playlist.trackList,
      trackPictureURL: defaultTrackCover,
    }).lean();

    const res = await Promise.all(
      songs.map(async ({ _id, artist, trackName, trackURL }) => {
        const URL = path.join(publicDir, trackURL);

        const result = await autoPictureForTrack(artist, trackName, URL);

        if (result) {
          await Track.findByIdAndUpdate(_id, {
            trackPictureURL: result,
          });
        }
        return result;
      }),
    );

    const incNull = res.filter((el) => el === null);
    const noIncNull = res.filter((el) => el !== null);

    return {
      withNull: { length: incNull.length },
      withOutNull: { noIncNull, length: noIncNull.length },
    };
  } catch (error) {
    console.log(error);
  }
};

export default updateTracksPicture;
