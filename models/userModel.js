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
    // addPlayList: [
    //   {
    //     type: Schema.Types.ObjectId,
    //     ref: "playlist",
    //   },
    // ],
    // favotitePlayList: [
    //   {
    //     type: Schema.Types.ObjectId,
    //     ref: "playlist",
    //   },
    // ],

    password: {
      type: String,
    },
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
      type: String,
      // default: true,
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
    contactFaceTaxCode: {
      //ИНН контактного лица
      type: String,
      required: true,
      match: onlyNumberRegexp,
      unique: true,
    },
    contactFaceTelNumber: {
      type: String,
      required: true,
      // unique: true,
    },
    contactFaceEmail: {
      type: String,
      required: true,
      match: emailRegexp,
      unique: true,
    },
    status: {
      //{block unblock}
      type: Boolean,
      required: true,
      default: false,
    },
    access: {
      //{on off}
      type: Boolean,
      required: true,
      default: false,
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
    // quantityPlaylists: {
    //   type: Number,
    //   required: true,
    //   default: 0,
    // },
    // quantitySongs: {
    //   type: Number,
    //   required: true,
    //   default: 0,
    // },

    comment: {
      type: String,

      default: "",
    },
    online: {
      //{on off}
      type: Boolean,
      required: true,
      default: false,
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

// userSchema.post("save", handleMongooseError);
// fopSchema.post("save", handleMongooseError);
// companySchema.post("save", handleMongooseError);

export const User = model("user", userSchema);
export const Fop = User.discriminator("fop", fopSchema);
export const Company = User.discriminator("company", companySchema);
