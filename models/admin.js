import { Schema, model } from "mongoose";

import handleMongooseError from "../helpers/handleMongooseError.js";

import {
  emailRegexp,
  loginAdminRegexp,
  nameRegexp,
  onlyNumberRegexp,
} from "../helpers/regExp.js";
const adminSchema = new Schema(
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
      default: "",
      match: nameRegexp,
    },
    login: {
      type: String,
      required: [true, "Login is required"],
      match: loginAdminRegexp,
      unique: true,
    },
    password: {
      type: String,
      minlength: 6,
      required: [true, "Set password for admin"],
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
    adminRole: {
      type: Boolean,
      default: false,
    },
    editorRole: {
      type: Boolean,
      default: false,
    },
    passportDetails: {
      type: String,
      required: true,
      unique: true,
    },
    idNubmer: {
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
  },
  { versionKey: false, timestamps: true }
);

adminSchema.post("save", handleMongooseError);

const Admin = model("admin", adminSchema);

export default Admin;
