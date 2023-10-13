import { Schema, model } from "mongoose";

import handleMongooseError from "../helpers/handleMongooseError.js";


const adminSchema = new Schema(
  {
    name: {
      type: String,
      default: "",
    },
    login: {
      type: String,
      required: [true, "Login is required"],
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
  },
  { versionKey: false, timestamps: true }
);

adminSchema.post("save", handleMongooseError);

const Admin = model("admin", adminSchema);

export default Admin;
