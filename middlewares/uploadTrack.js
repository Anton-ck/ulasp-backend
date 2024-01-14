import multer from "multer";
import path from "path";
import * as fs from "fs";
import HttpError from "../helpers/HttpError.js";
import generateLatinTranslation from "../helpers/translateToLatin.js";
const trackDir = path.resolve("public/tracks");

const isExistDestinationDir = (trackDir) => {
  if (!fs.existsSync(trackDir)) {
    fs.mkdirSync(trackDir, { recursive: true });
  }
  return trackDir;
};

const uploadProgress = (req) => {
  let progress = 0;
  console.log(req.headers);

  let fileSize = req.headers["content-length"]
    ? parseInt(req.headers["content-length"])
    : 0;
  req.on("data", (chunk) => {
    progress += chunk.length;
    console.log("progress", chunk.length);
    req.progress += progress;
    // res.write(`${Math.floor((progress * 100) / fileSize)} `);
    if (progress === fileSize) {
      console.log("Finished", progress, fileSize);
    }
  });

  // next();
};

const FileNameToUtf8 = (file) => {
  if (!file) {
    return;
  }
  const fileName = Buffer.from(file.originalname, "latin1")
    .toString("utf8")
    .replaceAll(" ", "__");

  const translatedFileName = generateLatinTranslation(fileName);

  return { fileName, translatedFileName };
};

const multerConfig = multer.diskStorage({
  destination: isExistDestinationDir(trackDir),

  filename: (req, file, cb) => {
    const fileName = FileNameToUtf8(file);
    // console.log(fileName.fileName);
    cb(null, fileName.translatedFileName);
  },
});

const uploadTrack = multer({
  storage: multerConfig,

  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = FileNameToUtf8(file);
    console.log("fileName.translatedFileName", fileName);
    const trackPath = trackDir + "/" + fileName.translatedFileName;
    if (fs.existsSync(trackPath)) {
      cb(null, false, (req.existFileError = "Error"));
    } else {
      cb(null, true);
    }

    if (ext !== ".mp3") {
      cb(null, false, (req.extError = "Error"));
    } else {
      cb(
        null,
        true,
        // (file.originalname = fileName.translatedFileName),
        // (file.filename = fileName.fileName)
        (req.translatedFileName = fileName.fileName)
      );
    }
  },
});

export default uploadTrack;
