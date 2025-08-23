import HttpError from '../../helpers/HttpError.js';
import ctrlWrapper from '../../helpers/ctrlWrapper.js';
import Genre from '../../models/genreModel.js';

import isExistStringToLowerCase from '../../helpers/compareStringToLowerCase.js';
import randomCover from '../../helpers/randomCover.js';
import { resizePics } from '../../helpers/resizePics.js';

const allGenres = async (req, res) => {
  const { page = 1, limit = req.query.limit, ...query } = req.query;
  const skip = (page - 1) * limit;
  const allGenres = await Genre.find(
    { ...req.query },
    '-createdAt -updatedAt',
    {
      skip,
      limit,
    },
  )
    .populate('playList')
    .sort({ genre: 1 });

  if (!allGenres) {
    res.status(404).json({
      message: `Genres not found`,
      messageUK: 'Помилка отримання жанрів',
      code: '4041',
      object: `${null}`,
    });
    return;
  }

  res.json(allGenres);
};

const createGenre = async (req, res) => {
  const { genre, type = 'genre' } = req.body;

  const isExistGenre = await Genre.findOne({
    genre: {
      $regex: genre.toString(),
      $options: 'i',
    },
  });

  const isExist = isExistStringToLowerCase(genre, isExistGenre?.genre);

  if (genre === '') {
    throw HttpError(404, `genre is empty`);
  }
  if (isExist) {
    res.status(409).json({
      message: `${genre} already in use`,
      code: '4091',
      object: `${genre}`,
    });
    return;
  }

  const randomPicUrl = await randomCover(type);

  const newGenre = await Genre.create({
    ...req.body,
    genreAvatarURL: randomPicUrl,
  });

  res.status(201).json({
    newGenre,
  });
};

const findGenreById = async (req, res) => {
  const { id } = req.params;

  const genre = await Genre.findById(id).populate('playList');

  if (!genre) {
    throw HttpError(404, `Genre with id ${id} not found`);
  }

  res.json(genre);
};

const updateGenreById = async (req, res) => {
  const { id } = req.params;
  const { genre, type = 'genre' } = req.body;

  let isExist;
  if (genre) {
    const isExistGenre = await Genre.findOne({
      genre: {
        $regex: genre.toString(),
        $options: 'i',
      },
    });
    isExist = isExistStringToLowerCase(genre, isExistGenre?.genre);
  }

  if (genre === '' && !req.file) {
    throw HttpError(404, `genre is empty`);
  }
  if (isExist) {
    res.status(409).json({
      message: `${genre} already in use`,
      code: '4091',
      object: `${genre}`,
    });
    return;
  }

  let resizePicURL;

  if (req.file) {
    resizePicURL = await resizePics(req.file, type);
  }

  const newGenre = await Genre.findByIdAndUpdate(
    id,
    { ...req.body, genreAvatarURL: resizePicURL },
    {
      new: true,
    },
  );
  res.json(newGenre);
};

const deleteGenre = async (req, res) => {
  const { id } = req.params;

  const genre = await Genre.findById(id);

  if (!genre) {
    throw HttpError(404, `Genre with ${id} not found`);
  }

  await Genre.findByIdAndDelete(id);

  res.json({
    message: `Genre ${genre.genre} was deleted`,
  });
};

export default {
  allGenres: ctrlWrapper(allGenres),
  createGenre: ctrlWrapper(createGenre),
  findGenreById: ctrlWrapper(findGenreById),
  updateGenreById: ctrlWrapper(updateGenreById),
  deleteGenre: ctrlWrapper(deleteGenre),
};
