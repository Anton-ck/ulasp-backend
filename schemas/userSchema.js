import Joi from "joi";
import { joiPasswordExtendCore } from "joi-password";

import {
  emailRegexp,
  onlyNumberRegexp,
  regularDateRegexp,
  phoneNumberUaRegexp,
  nameRegexp,
  nameCompanyRegexp,
} from "../helpers/regExp.js";
const joiPassword = Joi.extend(joiPasswordExtendCore);

export const loginUserSchema = Joi.object({
  contractNumber: Joi.string().min(5).max(30).required(),
  password: joiPassword
    .string()
    .min(6)
    // .minOfLowercase(1)
    // .minOfNumeric(1)
    .required(),
});

export const createCommonUserSchema = Joi.object({
  contractNumber: Joi.string().min(5).max(30).required(),
  // firstName: Joi.string().min(5).max(30).pattern(nameRegexp),
  userFop: Joi.string().default(true),
  telNumber: Joi.string().pattern(phoneNumberUaRegexp).required(),
  email: Joi.string().pattern(emailRegexp).required(),
  contactFace: Joi.string().min(5).max(30),
  contactFaceTaxCode: Joi.string().min(8).max(10).pattern(onlyNumberRegexp),
  contactFaceTelNumber: Joi.string().pattern(phoneNumberUaRegexp).required(),
  contactFaceEmail: Joi.string().pattern(emailRegexp).required(),
  status: Joi.boolean(),
  lastPay: Joi.string(),
  comment: Joi.string().allow("").optional(),
  dateOfAccess: Joi.string(),
  access: Joi.boolean(),
  online: Joi.boolean(),
});

export const createFopUserSchema = createCommonUserSchema.keys({
  firstName: Joi.string().min(3).max(30).pattern(nameRegexp).required(),
  lastName: Joi.string().min(3).max(30).pattern(nameRegexp).required(),
  fatherName: Joi.string().min(3).max(30).pattern(nameRegexp),
  dayOfBirthday: Joi.string().pattern(regularDateRegexp).required(),
  taxCode: Joi.string().min(10).max(10).pattern(onlyNumberRegexp),
});

export const createCompanyUserSchema = createCommonUserSchema.keys({
  name: Joi.string().min(5).max(30).pattern(nameCompanyRegexp).required(),
  taxCode: Joi.string().min(8).max(10).pattern(onlyNumberRegexp),
  // lastPay: Joi.string().pattern(regularDateRegexp).required(),
});

export const playListUserSchema = Joi.object({
  playListName: Joi.string().required().empty(false).min(1).max(30),
  picsURL: Joi.string().empty(""),
  type: Joi.string().required().empty(false),
});
