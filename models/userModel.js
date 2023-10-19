import { Schema, model } from "mongoose";

import handleMongooseError from "../helpers/handleMongooseError.js";
import {
  emailRegexp,
  nameRegexp,
  onlyNumberRegexp,
} from "../helpers/regExp.js";
const userSchema = new Schema(
  {
    name: {
      type: String,
      default: "",
      required: true,
    },
    password: {
      type: String,
      minlength: 6,
      required: [true, "Set password for user"],
    },
    contractNumber: {
      type: String,
      required: [true, "Login is required"],
      unique: true,
    },

    idNumber: {
      type: String,
      required: true,
      match: onlyNumberRegexp,
      unique: true,
    },
    dayOfBirthday: {
      type: String,
      required: true,
    },
    telNumber: {
      type: String,
      required: true,
      unique: true,
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
    idContactFace: {
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
      type: String,
      required: true,
    },
    lastPay: {
      type: String,
      required: true,
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
  },
  { versionKey: false, timestamps: true }
);

userSchema.post("save", handleMongooseError);

const User = model("user", userSchema);

export default User;
