import Joi from "joi";

export const createGenreSchema = Joi.object({
  genre: Joi.string().required().empty(false).min(2).max(29),
  genreAvatarURL: Joi.string().empty(""),
  type: Joi.string().required().empty(false),
});

export const updateGenreSchema = Joi.object({
  genre: Joi.string().min(2).max(29),
  genreAvatarURL: Joi.string().empty(""),
  type: Joi.string(),
});
