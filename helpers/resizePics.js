import fs from "fs/promises";
import Jimp from "jimp";
import path from "path";

const tempDirResize = path.resolve("tmp", "resize");
const picsDir = path.resolve("public", "covers");

export const resizePics = async (file) => {
  const { path: tempDir, originalname, fieldname } = file;

  const sizeImg = "60x40_";
  const fileName = `${originalname}`;
  const resizeFileName = `${sizeImg}${fileName}`;
  const resultUpload = path.resolve(picsDir, resizeFileName);
  const resizeResultUpload = path.resolve(tempDirResize, resizeFileName);

  const resizeImg = await Jimp.read(tempDir);

  resizeImg
    .autocrop()
    .cover(60, 40)
    .quality(100)
    .writeAsync(`${tempDirResize}/${resizeFileName}`);

  await fs.unlink(tempDir);
  await fs.rename(resizeResultUpload, resultUpload);

  const picsURL = path.join("covers", resizeFileName);


  return picsURL;
};
