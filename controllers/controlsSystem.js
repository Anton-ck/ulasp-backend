import path from 'path';
import fs from 'fs/promises';

import Track from '../models/trackModel.js';

import ctrlWrapper from '../helpers/ctrlWrapper.js';

import updTracksPicture from '../services/editor/updateTrackPictureService.js';

const updateTracksPictureInPlaylist = async (req, res) => {
  const { id } = req.body;

  const result = await updTracksPicture(id);

  res.json({ m: result });
};

const deleteAllPicture = async (req, res) => {
  const trackCovers = path.resolve('public', 'trackCovers');
  const tmpFolder = path.resolve('tmp');
  const resizeFolder = path.resolve(tmpFolder, 'resize');

  const trackCoversFiles = await fs.readdir(trackCovers, {
    withFileTypes: true,
  });
  const tmpFiles = await fs.readdir(tmpFolder, { withFileTypes: true });
  const resizeFiles = await fs.readdir(resizeFolder, { withFileTypes: true });

  trackCoversFiles.forEach(async (file) => {
    if (file.name === '55x36_trackCover_default.jpg') {
      return;
    }
    if (file.isFile()) {
      await fs.unlink(path.join(trackCovers.toString(), file.name));
    }
  });

  tmpFiles.forEach(async (file) => {
    if (file.isFile()) {
      await fs.unlink(path.join(tmpFolder.toString(), file.name));
    }
  });

  resizeFiles.forEach(async (file) => {
    if (file.isFile()) {
      await fs.unlink(path.join(resizeFolder.toString(), file.name));
    }
  });

  await Track.updateMany({
    trackPictureURL: 'trackCovers/55x36_trackCover_default.jpg',
  });

  res.json({ m: 'ok' });
};

export default {
  updateTracksPictureInPlaylist: ctrlWrapper(updateTracksPictureInPlaylist),
  deleteAllPicture: ctrlWrapper(deleteAllPicture),
};
