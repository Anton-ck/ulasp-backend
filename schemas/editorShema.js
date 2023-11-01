import Joi from "joi";

export const playListSchema = Joi.object({
  playListName: Joi.string().required().empty(false).min(1).max(30),
  picsURL: Joi.string().empty(""),
});
