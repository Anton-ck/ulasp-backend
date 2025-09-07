import multer from 'multer';
import path from 'path';
import * as fs from 'fs';
import slugify from '../helpers/slugify.js';

const trackDir = path.resolve('public/tracks');

const isExistDestinationDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const FileNameToUtf8 = (file) => {
  if (!file) {
    throw new Error('File not found');
  }
  const translatedFileName = Buffer.from(file.originalname, 'latin1')
    .toString('utf8')
    .replaceAll(/[ #]/g, '__');

  const fileName = slugify(translatedFileName);

  return { fileName, translatedFileName };
};

const multerConfig = multer.diskStorage({
  destination: isExistDestinationDir(trackDir),

  filename: (req, file, cb) => {
    const fileName = FileNameToUtf8(file);
    cb(null, fileName.fileName);
  },
});

const uploadTrack = multer({
  storage: multerConfig,

  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = FileNameToUtf8(file);
    const trackPath = `${trackDir}/${fileName.fileName}`;

    const optionsWithError = {
      existFileError: true,
      existFileName: fileName,
      file,
      path: trackPath,
      trackDir,
    };

    const optionsWithOutError = {
      existFileError: false,
      existFileName: fileName,
      file,
      path: trackPath,
      trackDir,
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
        (req.uploadTrack = optionsWithError),
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
