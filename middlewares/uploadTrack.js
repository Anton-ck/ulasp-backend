import multer from "multer";
import path from "path";
import * as fs from "fs";
import generateLatinTranslation from "../helpers/translateToLatin.js";
const trackDir = path.resolve("public/tracks");

const isExistDestinationDir = (trackDir) => {
  if (!fs.existsSync(trackDir)) {
    fs.mkdirSync(trackDir, { recursive: true });
  }
  return trackDir;
};

const FileNameToUtf8 = (file) => {
  if (!file) {
    return;
  }
  const fileName = Buffer.from(file.originalname, "latin1")
    .toString("utf8")
    .replaceAll(" ", "__");

  // const fileName = file.originalname
  //   .toString("cp1251")
  //   // .toString("utf8")
  //   .replaceAll(" ", "__");

  const translatedFileName = generateLatinTranslation(fileName);

  return { fileName, translatedFileName };
};

const multerConfig = multer.diskStorage({
  destination: isExistDestinationDir(trackDir),

  filename: (req, file, cb) => {
    const fileName = FileNameToUtf8(file);
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

    const optionsWithError = {
      existFileError: true,
      existFileName: fileName,
      translatedFileName: fileName.fileName,
    };

    const optionsWithOutError = {
      existFileError: false,
      existFileName: fileName,
      translatedFileName: fileName.fileName,
    };

    const codeError = {
      fileExist: 4091,
      wrongExt: 4001,
    };

    if (fs.existsSync(trackPath)) {
      cb(
        null,
        false,
        (req.uploadTrackError = codeError.fileExist),
        (req.uploadTrack = optionsWithError)
      );
    } else {
      cb(null, true, (req.uploadTrack = optionsWithOutError));
    }

    // if (ext !== ".mp3") {
    //   cb(
    //     null,
    //     false,
    //     ((req.uploadTrack.codeError = codeError.wrongExt),
    //     (req.uploadTrack.options = optionsWithError))
    //   );
    // } else {
    //   cb(null, true, (req.options = optionsWithOutError));
    // }
  },
});

export default uploadTrack;
