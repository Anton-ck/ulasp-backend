import albumArt from "album-art";
import getId3Tags from "./id3Tags.js";
import { resizeTrackCover } from "./resizePics.js";
const autoPictureForTrack = async (artist, trackName, trackURL) => {
  const metadata = await getId3Tags(trackURL);

  const { album } = metadata?.common;

  console.log("metadata", metadata);

  const trackPicture = await albumArt(artist, {
    album,

    size: "large",
  });
  console.log("artist", artist);
  console.log("album", album);
  console.log("trackPicture", trackPicture);

  if (!trackPicture) {
    return;
  }
  const resizeTrackCoverURL = await resizeTrackCover(
    trackPicture,
    "trackCover"
  );

  return resizeTrackCoverURL;
};

export default autoPictureForTrack;
