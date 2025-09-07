import fs from 'fs/promises';
import Jimp from 'jimp';
import path from 'path';

import { getRandomNumber } from './randomSort.js';
import slugify from './slugify.js';

const tempDirResize = path.resolve('tmp', 'resize');
const picsDir = path.resolve('public', 'covers');
const avatarsDir = path.resolve('public', 'avatars');
const trackCovers = path.resolve('public', 'trackCovers');
const genreCovers = path.resolve('public', 'genreCovers');
const shopCovers = path.resolve('public', 'shopCovers');

export const resizePics = async (file, type) => {
  const { path: tempDir, originalname, fieldname } = file;

  let picsFolder;

  switch (type) {
    case 'trackCover':
      picsFolder = trackCovers;
      break;

    case 'genre':
      picsFolder = genreCovers;
      break;

    case 'playlist':
      picsFolder = picsDir;
      break;

    case 'shop':
      picsFolder = shopCovers;
      break;

    default:
      picsFolder = picsDir;
  }

  const sizeImg = '55x36_';
  const fileName = `${originalname}`;
  const resizeFileName = `${sizeImg}${type}_${fileName}`;

  const resultUpload = path.resolve(picsFolder, resizeFileName);
  const resizeResultUpload = path.resolve(tempDirResize, resizeFileName);

  const resizeImg = await Jimp.read(tempDir);

  await resizeImg
    .autocrop({ cropSymmetric: true })
    .cover(55, 36)
    .quality(100)
    .writeAsync(`${tempDirResize}/${resizeFileName}`);

  await fs.unlink(tempDir);

  await fs.rename(resizeResultUpload, resultUpload);

  const picsURL = path.join(picsFolder.split(/[\\\/]/g).pop(), resizeFileName);

  return picsURL;
};

export const resizeAvatar = async (file) => {
  const { path: tempDir, originalname } = file;

  const sizeImg = '250x250_';
  const fileName = `${originalname}`;
  const resizeFileName = `${sizeImg}${fileName}`;
  const resultUpload = path.resolve(avatarsDir, resizeFileName);
  const resizeResultUpload = path.resolve(tempDirResize, resizeFileName);

  const reziseImg = await Jimp.read(tempDir);

  await reziseImg
    .autocrop()
    .cover(250, 250)
    .quality(100)
    .writeAsync(`${tempDirResize}/${resizeFileName}`);

  await fs.unlink(tempDir);
  await fs.rename(resizeResultUpload, resultUpload);

  const avatarURL = path.join('avatars', resizeFileName);

  return avatarURL;
};

export const resizeTrackCover = async (link, type, source = 'noFile') => {
  let fileName;

  fileName = link.split('/').pop();

  fileName =
    source === 'file'
      ? slugify(fileName)
      : getRandomNumber(1, 100000).toString();

  // console.log('создали новое имя', fileName);

  const resizeImg = await Jimp.read(link);

  // console.log('прочитали файл');

  const extentionFile = resizeImg._originalMime.split('/')[1];

  // console.log('получили расширение файла', extentionFile);

  const sizeImg = '55x36_';
  const resizeFileName = `${sizeImg}${type}_${fileName}.${extentionFile}`;
  const resultUpload = path.resolve(trackCovers, resizeFileName);

  const resizeResultUpload = path.resolve(tempDirResize, resizeFileName);

  // console.log('Просим изменить файл и перенести в папку темп');
  await resizeImg
    .autocrop({ cropSymmetric: true })
    .cover(55, 36)
    .quality(100)
    .writeAsync(`${tempDirResize}/${resizeFileName}`);

  // console.log('просим с папки темп перенести в папку результат');

  await fs.rename(resizeResultUpload, resultUpload);

  const picsURL = path.join('trackCovers', resizeFileName);

  return picsURL;
};
