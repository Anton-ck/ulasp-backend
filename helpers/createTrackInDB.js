import Track from '../models/trackModel.js';
import PlayList from '../models/playlistModel.js';
import getId3Tags from './id3Tags.js';
import decodeFromIso8859 from './decode8859-1.js';
import albumArt from 'album-art';
import { resizeTrackCover } from './resizePics.js';
import HttpError from './HttpError.js';
import path from 'path';
import defaultTrackCover from '../common/resources/defaultCovers.js';
import autoPictureForTrack from './autoPicureForTrack.js';

const createTrackInDB = async (
  file,
  FileNameLatin,
  playlistId,
  req,
  trackDir,
) => {
  const { filename } = file;

  let trackFileName;
  if (filename === undefined) {
    trackFileName = FileNameLatin;
  } else {
    trackFileName = filename;
  }

  if (!file) {
    throw HttpError(404, 'File not found for upload');
  }

  const tracksDir = trackDir.split(/[\\\/]/g).slice(-1)[0];

  const trackURL = path.join(tracksDir, trackFileName);
  const trackUrlInOS = path.join(trackDir, trackFileName);

  const fileName = path.parse(FileNameLatin).name.split('__');

  const metadata = await getId3Tags(path.join(trackDir, trackFileName));

  const { artist, title, genre, album } = metadata?.common;
  const { duration } = metadata.format;

  const resArtist = decodeFromIso8859(artist);
  const resTitle = decodeFromIso8859(title);

  const trackCoverUrlDB = await autoPictureForTrack(trackUrlInOS);

  const newTrack = await Track.create({
    ...req.body,
  });

  const track = await Track.findByIdAndUpdate(
    newTrack._id,
    {
      trackURL,
      artist: artist
        ? resArtist
        : `${fileName[0] ? fileName[0] : ''}${' '}${
            fileName[1] ? fileName[1] : ''
          }`,
      trackName: title
        ? resTitle
        : `${fileName[2] ? fileName[2] : ''}${' '}${
            fileName[3] ? fileName[3] : ''
          }`,

      $push: { trackGenre: genre ? genre[0] : null },
      trackDuration: duration ? duration : null,
      trackPictureURL: trackCoverUrlDB || null,
    },
    { new: true },
  );
  if (playlistId) {
    await PlayList.findByIdAndUpdate(playlistId, {
      $push: { trackList: newTrack.id },
    });
    await Track.findByIdAndUpdate(newTrack.id, {
      $push: { playList: playlistId },
    });
  }

  return track;
};

export default createTrackInDB;
