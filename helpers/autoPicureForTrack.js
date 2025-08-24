import fs from 'fs/promises';
import path from 'path';

import albumArt from 'album-art';
import getId3Tags from './id3Tags.js';
import { resizeTrackCover } from './resizePics.js';

import defaultTrackCover from '../common/resources/defaultCovers.js';

const getPictureFromTags = async (pictureData, { artist, trackName }) => {
  if (!pictureData) {
    throw new Error('Function getPictureFromTags must have arguments');
  }

  try {
    const imageFormat = pictureData.format.split('/')[1];
    const buffer = Buffer.from(pictureData.data);

    const tempPicture = path.resolve(
      'tmp',
      `${artist}${trackName}.${imageFormat}`,
    );

    await fs.writeFile(tempPicture, buffer);

    const result = await resizeTrackCover(tempPicture, 'trackCover');
    await fs.unlink(tempPicture);
    return result;
  } catch (error) {
    console.error(error);
  }
};

const getPictureFromAlbum = async (artist, album, imageSize = 'large') => {
  const trackPicture = await albumArt(artist, { album, size: imageSize });

  const link = await resizeTrackCover(trackPicture, 'trackCover');

  return link;
};

const autoPictureForTrack = async (artist, trackName, trackURL) => {
  try {
    const metadata = await getId3Tags(trackURL);

    const { common } = metadata;

    const { artist: dataArtist, title, album, picture } = common;

    const pictureData = picture?.[0];

    let trackPictureURL = defaultTrackCover;

    if (pictureData !== undefined) {
      trackPictureURL = await getPictureFromTags(pictureData, {
        artist,
        trackName,
      });
    } else if ((album || artist) !== undefined) {
      trackPictureURL = await getPictureFromAlbum(dataArtist, album);
    }

    return trackPictureURL;
  } catch (error) {
    console.log(error);
  }
};

export default autoPictureForTrack;
