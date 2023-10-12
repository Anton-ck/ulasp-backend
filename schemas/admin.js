import Joi from "joi";
import { joiPasswordExtendCore } from "joi-password";
const joiPassword = Joi.extend(joiPasswordExtendCore);


export const adminLoginSchema = Joi.object({
  login: Joi.string().required().empty(false).min(3).max(10).messages({
    "string.base": "The login must be a string.",
    "any.required": "The login field is required.",
    "string.empty": "The login must not be empty.",
  }),
  password: joiPassword.string().min(6).minOfLowercase(1).minOfNumeric(1).required(),
});

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const updateAdminName = Joi.object({
  name: Joi.string().required(),
});
