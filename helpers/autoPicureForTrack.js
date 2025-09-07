import fs from 'fs/promises';
import path from 'path';

import albumArt from 'album-art';
import getId3Tags from './id3Tags.js';
import { resizeTrackCover } from './resizePics.js';
import { getRandomNumber } from '../helpers/randomSort.js';
import defaultTrackCover from '../common/resources/defaultCovers.js';
import slugify from '../helpers/slugify.js';

const getPictureFromTags = async (pictureData, artist, trackName) => {
  if (!pictureData) {
    throw new Error('Function getPictureFromTags must have arguments');
  }

  try {
    const imageFormat = pictureData.format.split('/')[1];
    const buffer = Buffer.from(pictureData.data);

    const clearTrackName = slugify(trackName);

    const rmNumber = getRandomNumber(1, 1000);

    const tempPicture = path.resolve(
      'tmp',
      `${clearTrackName}${rmNumber}.${imageFormat}`,
    );

    await fs.writeFile(tempPicture, buffer);

    const result = await resizeTrackCover(tempPicture, 'trackCover', 'file');
    await fs.unlink(tempPicture);
    return result;
  } catch (error) {
    console.error(error);
  }
};

const getPictureFromAlbum = async (artist, album, imageSize = 'large') => {
  const trackPicture = await albumArt(artist, { album, size: imageSize });

  // console.log('файл получили');

  const link = await resizeTrackCover(trackPicture, 'trackCover', 'noFile');

  return link;
};

const autoPictureForTrack = async (trackURL) => {
  try {
    const metadata = await getId3Tags(trackURL);

    const { common } = metadata;

    const { artist, title, album, picture } = common;

    const pictureData = picture?.[0];

    let trackPictureURL = defaultTrackCover;

    if (pictureData !== undefined) {
      trackPictureURL = await getPictureFromTags(pictureData, artist, title);
    } else if ((album || artist) !== undefined) {
      console.log('Просим достать файл с интернета');

      trackPictureURL = await getPictureFromAlbum(artist, album);
    }

    return trackPictureURL;
  } catch (error) {
    console.log(error);
  }
};

export default autoPictureForTrack;
