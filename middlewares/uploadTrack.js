import multer from "multer";
import path from "path";
import * as fs from "fs";
import HttpError from "../helpers/HttpError.js";



const trackDir = path.resolve("public/tracks");

const isExistDestinationDir = (trackDir) => {
  if (!fs.existsSync(trackDir)) {
    fs.mkdirSync(trackDir, { recursive: true });
  }
  return trackDir;
};

const multerConfig = multer.diskStorage({
  destination: isExistDestinationDir(trackDir),

  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const uploadTrack = multer({
  storage: multerConfig,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== ".mp3") {
      cb(
        HttpError(400, "Wrong extension type! Extensions should be only *.mp3"),
        false
      );
    } else {
      cb(null, true);
    }
  },
});

export default uploadTrack;
