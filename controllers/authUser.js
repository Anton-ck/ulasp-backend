import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import * as fs from "fs";
import Jimp from "jimp";
import path from "path";
import { fileURLToPath } from "url";

import { User, Fop, Company } from "../models/userModel.js";
import HttpError from "../helpers/HttpError.js";
import ctrlWrapper from "../helpers/ctrlWrapper.js";
import { resizeAvatar } from "../helpers/resizePics.js";
import isExistAvatar from "../helpers/isExistAvatar.js";
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

dotenv.config();

const { ACCESS_SECRET_KEY, REFRESH_SECRET_KEY } = process.env;

const accessTokenExpires = "7d";

// const createUser = async (req, res) => {
//   const { contractNumber, taxCode, userFop } = req.body;
//   const user = await User.findOne({ contractNumber });

//   if (user) {
//     throw HttpError(409, "contractNumber in use");
//   }
//   const hashtaxCode = await bcrypt.hash(taxCode, 10);
//   let newUser = {};

//   console.log(userFop);

//   if (userFop === "true") {
//     newUser = await Fop.create({
//       ...req.body,
//       taxCode: hashtaxCode,
//     });
//   } else {
//     newUser = await Company.create({
//       ...req.body,
//       taxCode: hashtaxCode,
//     });
//   }

//   const payload = {
//     id: newUser._id,
//   };

//   const accessToken = jwt.sign(payload, ACCESS_SECRET_KEY, {
//     expiresIn: accessTokenExpires,
//   });

//   await User.findByIdAndUpdate(newUser._id, { accessToken });

//   res.status(201).json({
//     accessToken,
//     user: {
//       id: newUser._id,
//       contractNumber: newUser.contractNumber,
//     },
//   });
// };

const userSignIn = async (req, res) => {
  const { contractNumber, password } = req.body;

  const user = await User.findOne({ contractNumber });
  console.log("contractNumber", contractNumber);
  console.log("password", password);
  console.log("user", user);

  if (!user) {
    throw HttpError(401, "Contract Number or taxCode is wrong");
  }

  const payload = {
    id: user._id,
  };

  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, "Contract Number or taxCode is wrong");
  }
  if (!user.access) {
    throw HttpError(403, "Access Denied");
  }
  const accessToken = jwt.sign(payload, ACCESS_SECRET_KEY, {
    expiresIn: accessTokenExpires,
  });
  await User.findByIdAndUpdate(user._id, { accessToken, online: true });

  const avatar = isExistAvatar(user.avatarURL);

  res.json({
    accessToken,

    user: {
      contractNumber: user.contractNumber,
      firstName: user.firstName,
      lastName: user.lastName,
      fatherName: user.fatherName,
      name: user.name,
      avatarURL: avatar,
      online: user.online,
      taxCode: user.taxCode,
      dayOfBirthday: user.dayOfBirthday,
      telNumber: user.telNumber,
      email: user.email,
      lastPay: user.lastPay,
      dateOfAccess: user.dateOfAccess,
    },
  });
};

const getCurrentUser = async (req, res) => {
  console.log("getCurrentUser", req.user);
  const {
    _id,
    firstName,
    lastName,
    fatherName,
    name,
    avatarURL,
    taxCode,
    dayOfBirthday,
    telNumber,
    email,
    contractNumber,
    contractNumberDoc,
    dateOfAccess,
    lastPay,
  } = req.user;

  const avatar = isExistAvatar(avatarURL);

  res.json({
    user: {
      id: _id,
      firstName,
      lastName,
      fatherName,
      name,
      avatarURL: avatar,
      taxCode,
      dayOfBirthday,
      telNumber,
      email,
      lastPay,
      contractNumber,
      contractNumberDoc,
      dateOfAccess,
    },
  });
};

const logoutUser = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, {
    accessToken: "",
    refreshToken: "",
    online: false,
  });
  res.status(204).json();
};
const updateUserAvatar = async (req, res) => {
  const { _id } = req.user;
  if (!req.file) {
    throw HttpError(404, "File not found for upload");
  }
  const avatarURL = await resizeAvatar(req.file);

  await User.findByIdAndUpdate(_id, { avatarURL }, { new: true });

  res.json({ avatarURL });
};
// const getRefreshTokenAdmin = async (req, res, next) => {
//   const { refreshToken: token } = req.body;
//   try {
//     const { id } = jwt.verify(token, REFRESH_SECRET_KEY);

//     const isExist = await Admin.findOne({ refreshToken: token });
//     if (!isExist) {
//       next(HttpError(403), "Token invalid");
//     }

//     const payload = {
//       id,
//     };

//     const accessToken = jwt.sign(payload, ACCESS_SECRET_KEY, {
//       expiresIn: accessTokenExpires,
//     });

//     const refreshToken = jwt.sign(payload, REFRESH_SECRET_KEY, {
//       expiresIn: "7d",
//     });

//     await Admin.findByIdAndUpdate(isExist._id, { accessToken, refreshToken });

//     res.json({ accessToken, refreshToken });
//   } catch (error) {
//     next(HttpError(403), error.message);
//   }
// };

export default {
  userSignIn: ctrlWrapper(userSignIn),
  updateUserAvatar: ctrlWrapper(updateUserAvatar),
  logoutUser: ctrlWrapper(logoutUser),
  getCurrentUser: ctrlWrapper(getCurrentUser),
};
