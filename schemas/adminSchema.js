import Joi from "joi";
import { joiPasswordExtendCore } from "joi-password";

import {
  emailRegexp,
  loginAdminRegexp,
  nameRegexp,
  onlyNumberRegexp,
  regularDateRegexp,
  phoneNumberUaRegexp,
  passportUaRegexp,
} from "../helpers/regExp.js";
const joiPassword = Joi.extend(joiPasswordExtendCore);

export const adminLoginSchema = Joi.object({
  login: Joi.string()
    .required()
    .empty(false)
    .min(3)
    .max(10)
    .pattern(loginAdminRegexp)
    .messages({
      "string.base": "The login must be a string.",
      "any.required": "The login field is required.",
      "string.empty": "The login must not be empty.",
      "string.pattern.base":
        "The login must consist of only lowercase Latin letters. ",
    }),
  password: joiPassword
    .string()
    .min(6)
    .minOfLowercase(1)
    .minOfNumeric(1)
    .required(),
});

export const createEditorSchema = Joi.object({
  firstName: Joi.string().min(5).max(30).pattern(nameRegexp).required(),
  lastName: Joi.string().min(5).max(30).pattern(nameRegexp).required(),
  fatherName: Joi.string().min(5).max(30).pattern(nameRegexp),
  login: Joi.string().min(3).max(10).pattern(loginAdminRegexp).required(),
  password: joiPassword
    .string()
    .min(6)
    .minOfLowercase(1)
    .minOfNumeric(1)
    .required(),
  editorRole: Joi.boolean(),
  taxCode: Joi.string().min(10).max(10).pattern(onlyNumberRegexp).required(),
  dayOfBirthday: Joi.string().pattern(regularDateRegexp).required(),
  telNumber: Joi.string().pattern(phoneNumberUaRegexp).required(),
  email: Joi.string().pattern(emailRegexp).required(),
});

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const updateAdminInfo = Joi.object({
  firstName: Joi.string().min(5).max(30).pattern(nameRegexp).required(),
  lastName: Joi.string().min(5).max(30).pattern(nameRegexp).required(),
  fatherName: Joi.string().min(5).max(30).pattern(nameRegexp),
  login: Joi.string()
    .min(3)
    .max(10)
    .pattern(loginAdminRegexp)
    .required(),
  taxCode: Joi.string().min(10).max(10).pattern(onlyNumberRegexp).required(),
  dayOfBirthday: Joi.string().pattern(regularDateRegexp).required(),
  telNumber: Joi.string().pattern(phoneNumberUaRegexp).required(),
  email: Joi.string().pattern(emailRegexp).required(),
});


export const updateAdminPassword = Joi.object({
  password: joiPassword
    .string()
    .min(6)
    .minOfLowercase(1)
    .minOfNumeric(1)
    .required(),
});