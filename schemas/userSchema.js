import Joi from "joi";
import { joiPasswordExtendCore } from "joi-password";

import {
  emailRegexp,
  onlyNumberRegexp,
  regularDateRegexp,
  phoneNumberUaRegexp,
  nameRegexp,
} from "../helpers/regExp.js";
const joiPassword = Joi.extend(joiPasswordExtendCore);

export const loginUserSchema = Joi.object({
  contractNumber: Joi.string().min(5).max(30).required(),
  password: joiPassword
    .string()
    .min(6)
    .minOfLowercase(1)
    .minOfNumeric(1)
    .required(),
});

export const createUserSchema = Joi.object({
  contractNumber: Joi.string().min(5).max(30).required(),
  firstName: Joi.string().min(5).max(30).pattern(nameRegexp),
  idNumber: Joi.string().min(10).max(10).pattern(onlyNumberRegexp),
  password: joiPassword
    .string()
    .min(6)
    .minOfLowercase(1)
    .minOfNumeric(1)
    .required(),

  dayOfBirthday: Joi.string().pattern(regularDateRegexp).required(),
  telNumber: Joi.string().pattern(phoneNumberUaRegexp).required(),
  email: Joi.string().pattern(emailRegexp).required(),
  lastPay: Joi.string().pattern(regularDateRegexp).required(),
  emailContactFace: Joi.string().pattern(emailRegexp).required(),
  telNumberContactFace: Joi.string().pattern(phoneNumberUaRegexp).required(),
  contactFace: Joi.string().min(5).max(30),
  idContactFace: Joi.string().min(10).max(10).pattern(onlyNumberRegexp),
  status: Joi.string().min(3).max(30),
});
