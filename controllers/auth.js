import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import Admin from "../models/admin.js";
import HttpError from "../helpers/HttpError.js";
import ctrlWrapper from "../helpers/ctrlWrapper.js";

dotenv.config();

const { ACCESS_SECRET_KEY, REFRESH_SECRET_KEY } = process.env;

const accessTokenExpires = "130m";

const signUpAdmin = async (req, res) => {
  const { login, password } = req.body;
  const user = await Admin.findOne({ login });

  if (user) {
    throw HttpError(409, "login in use");
  }
  const hashPassword = await bcrypt.hash(password, 10);

  const newUser = await Admin.create({
    ...req.body,
    password: hashPassword,
  });

  const payload = {
    id: newUser._id,
  };

  const accessToken = jwt.sign(payload, ACCESS_SECRET_KEY, {
    expiresIn: accessTokenExpires,
  });

  const refreshToken = jwt.sign(payload, REFRESH_SECRET_KEY, {
    expiresIn: "7d",
  });

  await Admin.findByIdAndUpdate(newUser._id, { accessToken, refreshToken });

  res.status(201).json({
    accessToken,
    refreshToken,
    user: {
      login: newUser.login,
    },
  });
};



const adminSignIn = async (req, res) => {
  const { login, password } = req.body;

  const admin = await Admin.findOne({ login });
  const passwordCompare = await bcrypt.compare(password, admin.password);
  if (!admin || !passwordCompare) {
    throw HttpError(401, "Login  or password is wrong");
  }

  const payload = {
    id: admin._id,
  };

  if (!admin || !passwordCompare) {
    throw HttpError(401, "Login  or password is wrong");
  }

  const accessToken = jwt.sign(payload, ACCESS_SECRET_KEY, {
    expiresIn: accessTokenExpires,
  });

  const refreshToken = jwt.sign(payload, REFRESH_SECRET_KEY, {
    expiresIn: "7d",
  });
  await Admin.findByIdAndUpdate(admin._id, { accessToken, refreshToken });
  res.json({
    accessToken,
    refreshToken,
    admin: { name: admin.name, login: admin.login, avatarURL: admin.avatarURL },
  });
};

const getRefreshToken = async (req, res, next) => {
  const { refreshToken: token } = req.body;
  try {
    const { id } = jwt.verify(token, REFRESH_SECRET_KEY);

    const isExist = await Admin.findOne({ refreshToken: token });
    if (!isExist) {
      next(HttpError(403), "Token invalid");
    }

    const payload = {
      id,
    };

    const accessToken = jwt.sign(payload, ACCESS_SECRET_KEY, {
      expiresIn: accessTokenExpires,
    });

    const refreshToken = jwt.sign(payload, REFRESH_SECRET_KEY, {
      expiresIn: "7d",
    });

    await Admin.findByIdAndUpdate(isExist._id, { accessToken, refreshToken });

    res.json({ accessToken, refreshToken });
  } catch (error) {
    next(HttpError(403), error.message);
  }
};

// const getCurrentUser = async (req, res) => {
//   const { name, email, avatarURL } = req.user;

//   res.json({
//     name,
//     email,
//     avatarURL,
//   });
// };

// const logoutUser = async (req, res) => {
//   const { _id } = req.user;
//   await User.findByIdAndUpdate(_id, { accessToken: "", refreshToken: "" });
//   res.status(204).json();
// };

// const updateUserName = async (req, res) => {
//   const { _id } = req.user;
//   const result = await User.findByIdAndUpdate(_id, req.body, { new: true });
//   if (!result) {
//     throw HttpError(404, "Not found");
//   }
//   res.json({ name: result.name });
// };

// const updateAvatar = async (req, res) => {
//   const { _id } = req.user;

//   if (!req.file) {
//     throw HttpError(404, "File not found for upload");
//   }

//   const avatarURL = req.file.path;

//   await User.findByIdAndUpdate(_id, { avatarURL });

//   res.json({
//     avatarURL,
//   });
// };

export default {
  signUpAdmin: ctrlWrapper(signUpAdmin),
  adminSignIn: ctrlWrapper(adminSignIn),
  // getRefreshToken: ctrlWrapper(getRefreshToken),
  // getCurrentUser: ctrlWrapper(getCurrentUser),
  // logoutUser: ctrlWrapper(logoutUser),
  // updateUserName: ctrlWrapper(updateUserName),
  // updateAvatar: ctrlWrapper(updateAvatar),
};
