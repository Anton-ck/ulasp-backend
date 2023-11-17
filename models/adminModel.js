import { Schema, model } from "mongoose";

import handleMongooseError from "../helpers/handleMongooseError.js";

import {
  emailRegexp,
  loginAdminRegexp,
  nameRegexp,
  onlyNumberRegexp,
  phoneNumberUaRegexp,
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
    taxCode: {
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
      match: phoneNumberUaRegexp,
    },
    email: {
      type: String,
      required: true,
      match: emailRegexp,
      unique: true,
    },
    comment: {
      type: String,
      default: "",
    }
  },
  { versionKey: false, timestamps: true }
);

adminSchema.post("findOneAndUpdate", handleMongooseError);
adminSchema.post("save", handleMongooseError);

const Admin = model("admin", adminSchema);

export default Admin;
