import path from 'path';
import * as fs from 'fs';

import HttpError from '../../helpers/HttpError.js';
import ctrlWrapper from '../../helpers/ctrlWrapper.js';

import PlayList from '../../models/playlistModel.js';
import UserPlaylist from '../../models/userPlayList.js';
import Track from '../../models/trackModel.js';

import createTrackInDB from '../../helpers/createTrackInDB.js';

const publicDir = path.resolve('public/');

//Все треки
const latestTracks = async (req, res) => {
  const {
    page = req.query.page,
    limit = req.query.limit,
    sort = req.query.sort,
    search = req.query.query || '',
    ...query
  } = req.query;

  const skip = (page - 1) * limit;
  let queryOptions;
  switch (search === '') {
    case true:
      queryOptions = {
        ...req.query,
      };
      break;
    case false:
      // queryOptions = { ...req.query, $text: { $search: search } };
      queryOptions = {
        $or: [
          { artist: { $regex: search.toString(), $options: 'i' } },
          { trackName: { $regex: search.toString(), $options: 'i' } },
        ],
        ...req.query,
      };

      break;
    default:
      queryOptions = {
        ...req.query,
      };
  }

  const latestTracks = await Track.find(
    queryOptions,
    '-sortIndex -addTrackByUsers -trackGenre -createdAt -updatedAt',
    {
      skip,
      limit,
    },
  )
    .populate({
      path: 'playList',
      select: 'playListName',

      options: {
        populate: {
          path: 'playlistGenre',
          select: 'genre',
        },
      },
    })
    .sort({ createdAt: sort });

  const totalTracks = await Track.find(queryOptions).countDocuments();

  const totalPlaylists = await PlayList.find().countDocuments();

  const tracksSRC = await Track.find(
    queryOptions,
    'artist trackName trackURL',
  ).sort({ createdAt: sort });
  const totalPages = Math.ceil(totalTracks / limit);
  const pageNumber = page ? parseInt(page) : null;

  res.json({
    latestTracks,
    totalTracks,
    totalPlaylists,
    totalPages,
    pageNumber,
    tracksSRC,
  });
};

//Загрузка треков
const uploadTrack = async (req, res) => {
  const { existFileError, existFileName, file, path, trackDir } =
    req.uploadTrack;
  const wrongExt = req?.extError;
  const FileNameLatin = existFileName.fileName;
  const FileNameCyrillic = existFileName.translatedFileName;

  if (wrongExt) {
    throw HttpError(400, 'Wrong extension type! Extensions should be *.mp3');
  }

  const playlistId = req?.params?.id;

  ///////// Запись трека в базу данных, если он в плейлисте и файл на сервере существует
  if (playlistId && existFileError) {
    const trackExist = await Track.findOne({
      trackURL: `tracks/${FileNameLatin}`,
    });
    //если трек есть на сервере, но в базе не записан
    if (!trackExist && existFileError) {
      const track = await createTrackInDB(
        file,
        FileNameLatin,
        playlistId,
        req,
        trackDir,
      );
      res.json({
        track,
      });
      return;
    }

    // если ли трек в плейлисте
    const playList = await PlayList.findById(playlistId);

    const isExistTrackInPlaylist = playList.trackList.includes(trackExist?.id);

    if (isExistTrackInPlaylist) {
      throw HttpError(409);
    } else {
      await PlayList.findByIdAndUpdate(playlistId, {
        $push: { trackList: trackExist.id },
      });
      await Track.findByIdAndUpdate(trackExist.id, {
        $push: { playList: playlistId },
      });
    }
    res.status(201).json({
      message: `Track successfully wrote to ${playList.playListName}`,
    });

    return;
  }
  /////////////

  if (existFileError) {
    const trackExist = await Track.findOne({
      trackURL: `tracks/${FileNameLatin}`,
    });

    if (trackExist) {
      throw HttpError(409, `Track "${FileNameCyrillic}" already exist`);
    } else {
      const track = await createTrackInDB(
        file,
        FileNameLatin,
        playlistId,
        req,
        trackDir,
      );
      res.json({
        track,
      });
      return;
    }
  }

  const track = await createTrackInDB(
    req.file,
    FileNameLatin,
    playlistId,
    req,
    trackDir,
  );

  res.json({
    track,
  });
};

const deleteTrack = async (req, res) => {
  const { id } = req.params;
  const track = await Track.findById(id);
  if (!track) {
    throw HttpError(404, `Track with ${id} not found`);
  }

  const trackPath = publicDir + '/' + track?.trackURL;
  const coverPath = publicDir + '/' + track?.trackPictureURL;

  const howManyCoverUsed = await Track.countDocuments({
    trackPictureURL: track?.trackPictureURL,
  });

  await Track.findByIdAndDelete(id);

  if (fs.existsSync(trackPath)) {
    fs.unlinkSync(trackPath);
  }

  if (
    fs.existsSync(coverPath) &&
    !coverPath.includes('trackCover_default') &&
    howManyCoverUsed === 1
  ) {
    fs.unlinkSync(coverPath);
  }

  const playlistWithThisTrack = await PlayList.find({
    trackList: { $in: [id] },
  });

  const userPlaylistWithThisTrack = await UserPlaylist.find({
    trackList: { $in: [id] },
  });

  if (playlistWithThisTrack) {
    playlistWithThisTrack.map(
      async ({ _id }) =>
        await PlayList.updateOne({ _id }, { $pull: { trackList: id } }),
    );
  }

  if (userPlaylistWithThisTrack) {
    userPlaylistWithThisTrack.map(
      async ({ _id }) =>
        await UserPlaylist.updateOne({ _id }, { $pull: { trackList: id } }),
    );
  }

  res.status(200).json({
    message: `Track ${track.artist} ${track.trackName} was deleted `,

    code: '2000',
    object: {
      artist: `${track.artist}`,
      trackName: `${track.trackName}`,
    },
  });
};

const addTrackToPlaylists = async (req, res) => {
  const { id } = req.params;
  const { idPlaylists } = req.body;

  const track = await Track.findById(id);

  if (!track) {
    throw HttpError(404, `Track with id ${id} not found`);
  }

  await Track.findByIdAndUpdate(id, {
    $push: { playList: idPlaylists },
  });

  await PlayList.updateMany(
    { _id: idPlaylists },
    {
      $push: { trackList: id },
    },
  );

  res.json({ message: 'Track successfully added' });
};

export default {
  latestTracks: ctrlWrapper(latestTracks),
  uploadTrack: ctrlWrapper(uploadTrack),
  deleteTrack: ctrlWrapper(deleteTrack),
  addTrackToPlaylists: ctrlWrapper(addTrackToPlaylists),
};
