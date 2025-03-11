import fs from "fs/promises";
import Jimp from "jimp";
import path from "path";

import decodeFromWindows1252 from "../helpers/decodeWindows1252.js";

const tempDirResize = path.resolve("tmp/resize");
const picsDir = path.resolve("public", "covers");
const avatarsDir = path.resolve("public", "avatars");
const trackCovers = path.resolve("public", "trackCovers");
const genreCovers = path.resolve("public", "genreCovers");
const shopCovers = path.resolve("public", "shopCovers");

export const resizePics = async (file, type) => {
  const { path: tempDir, originalname, fieldname } = file;

  console.log("TEST ====>>>", decodeFromWindows1252(originalname));
  console.log("DATE NOW", Date.now());

  let picsFolder;

  switch (type) {
    case "trackCover":
      picsFolder = trackCovers;
      break;

    case "genre":
      picsFolder = genreCovers;
      break;

    case "playlist":
      picsFolder = picsDir;
      break;

    case "shop":
      picsFolder = shopCovers;
      break;

    default:
      picsFolder = picsDir;
  }

  const sizeImg = "55x36_";
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

  const sizeImg = "250x250_";
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

  const avatarURL = path.join("avatars", resizeFileName);

  return avatarURL;
};

export const resizeTrackCover = async (link, type) => {
  const fileName = link.slice(link.length / 2, link.length);

  const resizeImg = await Jimp.read(link);
  const extentionFile = resizeImg._originalMime.split("/")[1];

  const sizeImg = "55x36_";
  const resizeFileName = `${sizeImg}${type}_${fileName}.${extentionFile}`;
  const resultUpload = path.resolve(trackCovers, resizeFileName);

  const resizeResultUpload = path.resolve(tempDirResize, resizeFileName);

  await resizeImg
    .autocrop({ cropSymmetric: true })
    .cover(55, 36)
    .quality(100)
    .writeAsync(`${tempDirResize}/${resizeFileName}`);

  await fs.rename(resizeResultUpload, resultUpload);

  const picsURL = path.join("trackCovers", resizeFileName);

  return picsURL;
};
