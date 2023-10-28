import { Schema, model } from "mongoose";

import handleMongooseError from "../helpers/handleMongooseError.js";
import {
  emailRegexp,
  nameRegexp,
  onlyNumberRegexp,
  phoneNumberUaRegexp,
} from "../helpers/regExp.js";

//general Schema FOP and company

const userSchema = new Schema(
  {
    // password: {
    //   type: String,
    //   minlength: 6,
    //   required: [true, "Set password for user"],
    // },
    contractNumber: {
      type: String,
      required: [true, "Login is required"],
      unique: true,
    },
    accessToken: {
      type: String,
      default: "",
    },
    refreshToken: {
      type: String,
      default: "",
    },
    avatarURL: {
      type: String,
      default: null,
    },
    userFop: {
      type: Boolean,
      default: true,
    },

    telNumber: {
      type: String,
      required: true,
      unique: true,
      match: phoneNumberUaRegexp,
    },
    email: {
      type: String,
      required: true,
      match: emailRegexp,
      unique: true,
    },

    contactFace: {
      type: String,
      required: true,
    },
    taxCodeContactFace: {
      //ИНН контактного лица
      type: String,
      required: true,
      match: onlyNumberRegexp,
      unique: true,
    },
    telNumberContactFace: {
      type: String,
      required: true,
      unique: true,
    },
    emailContactFace: {
      type: String,
      required: true,
      match: emailRegexp,
      unique: true,
    },
    status: {
      //{on off}
      type: String,
      required: true,
    },
    dateOfAccess: {
      type: String,
      required: true,
      default: 0,
    },
    lastPay: {
      type: String,
      required: true,
      default: 0,
    },
    quantityPlaylists: {
      type: Number,
      required: true,
      default: 0,
    },
    quantitySongs: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { versionKey: false, timestamps: true, discriminatorKey: "kind" }
);

const fopSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      match: nameRegexp,
    },
    lastName: {
      type: String,
      required: true,
      match: nameRegexp,
    },
    fatherName: {
      type: String,
      match: nameRegexp,
    },

    taxCode: {
      type: String,
      required: true,
      // match: onlyNumberRegexp,
      unique: true,
    },
    dayOfBirthday: {
      type: String,
      required: true,
    },
  },
  { versionKey: false, timestamps: true }
);

const companySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    taxCode: {
      type: String,
      required: true,
      length: 8,
      match: onlyNumberRegexp,
      unique: true,
    },
  },
  { versionKey: false, timestamps: true }
);

userSchema.post("save", handleMongooseError);

export const User = model("user", userSchema);
export const Fop = User.discriminator("fop", fopSchema);
export const Company = User.discriminator("company", companySchema);
