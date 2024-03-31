import Joi from "joi";

export const playListSchema = Joi.object({
  playListName: Joi.string().required().empty(false).min(2).max(29),
  picsURL: Joi.string().empty(""),
  type: Joi.string().required().empty(false),
  valueMediaLibrary: Joi.string().empty(""),
});
