import Track from "../models/trackModel.js";
import PlayList from "../models/playlistModel.js";
import getId3Tags from "./id3Tags.js";
import decodeFromIso8859 from "./decode8859-1.js";
import albumArt from "album-art";
import { resizeTrackCover } from "./resizePics.js";
import HttpError from "./HttpError.js";
import path from "path";

const createTrackInDB = async (
  file,
  FileNameLatin,
  playlistId,
  req,
  trackDir
) => {
  const { filename } = file;

  let trackFileName;
  if (filename === undefined) {
    trackFileName = FileNameLatin;
  } else {
    trackFileName = filename;
  }

  if (!file) {
    throw HttpError(404, "File not found for upload");
  }

  //   const tracksDir = file.path.split("/").slice(-2)[0];

  const tracksDir = trackDir.split("/").slice(-1)[0];


  const trackURL = path.join(tracksDir, trackFileName);


  const fileName = path.parse(FileNameLatin).name.split("__");

  const defaultCoverURL = "trackCovers/55x36_trackCover_default.jpg";

  const metadata = await getId3Tags(path.join(trackDir, trackFileName));

  const { artist, title, genre, album } = metadata?.common;
  const { duration } = metadata.format;

  const resArtist = decodeFromIso8859(artist);
  const resTitle = decodeFromIso8859(title);

  let resizeTrackCoverURL;

  if (resArtist) {
    const trackPicture = await albumArt(resArtist, {
      album: album,
      size: "large",
    });
    resizeTrackCoverURL = await resizeTrackCover(trackPicture, "trackCover");
  }

  const newTrack = await Track.create({
    ...req.body,
  });

  const track = await Track.findByIdAndUpdate(
    newTrack._id,
    {
      trackURL,
      artist: artist
        ? resArtist
        : `${fileName[0] ? fileName[0] : ""}${" "}${
            fileName[1] ? fileName[1] : ""
          }`,
      trackName: title
        ? resTitle
        : `${fileName[2] ? fileName[2] : ""}${" "}${
            fileName[3] ? fileName[3] : ""
          }`,

      $push: { trackGenre: genre ? genre[0] : null },
      trackDuration: duration ? duration : null,
      trackPictureURL: resizeTrackCoverURL
        ? resizeTrackCoverURL
        : defaultCoverURL || null,
    },
    { new: true }
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
