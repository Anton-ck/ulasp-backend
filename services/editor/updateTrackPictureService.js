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

    // const res = await songs.reduce((promise, { _id, trackURL }) => {
    //   const pr = promise.then(async (results) => {
    //     const URL = path.join(publicDir, trackURL);

    //     const result = await autoPictureForTrack(URL);

    //     if (result) {
    //       await Track.findByIdAndUpdate(_id, {
    //         trackPictureURL: result,
    //       });
    //     }
    //     return [...results, result];
    //   });

    //   return pr;
    // }, Promise.resolve([]));

    const res = await Promise.all(
      songs.map(async ({ _id, trackURL }) => {
        const URL = path.join(publicDir, trackURL);

        const result = await autoPictureForTrack(URL);

        if (result) {
          await Track.findByIdAndUpdate(_id, {
            trackPictureURL: result,
          });
        }
        return result;
      }),
    );

    const incNull = res.filter((el) => el === undefined);
    const noIncNull = res.filter((el) => el !== undefined);

    const result = {
      withNull: { length: incNull.length },
      withOutNull: { noIncNull, length: noIncNull.length },
    };

    return result;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export default updateTracksPicture;
