import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import fs from "fs/promises";
import Jimp from "jimp";
import path from "path";
import { fileURLToPath } from "url";

import Admin from "../models/adminModel.js";
import HttpError from "../helpers/HttpError.js";
import ctrlWrapper from "../helpers/ctrlWrapper.js";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

dotenv.config();

const { ACCESS_SECRET_KEY, REFRESH_SECRET_KEY } = process.env;

const accessTokenExpires = "330m";
const refreshTokenExpires = "7d";

const signUpAdmin = async (req, res) => {
  const { login, password } = req.body;
  const admin = await Admin.findOne({ login });

  if (admin) {
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
    expiresIn: refreshTokenExpires,
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
    expiresIn: refreshTokenExpires,
  });
  await Admin.findByIdAndUpdate(admin._id, { accessToken, refreshToken });

  if (admin.adminRole) {
    res.json({
      accessToken,
      refreshToken,
      admin: {
        login: admin.login,
        firstName: admin.firstName,
        lastName: admin.lastName,
        fatherName: admin.fatherName,
        avatarURL: admin.avatarURL,
        adminRole: admin.adminRole,
      },
    });
  } else {
    res.json({
      accessToken,
      refreshToken,
      editor: {
        login,
        firstName: admin.firstName,
        lastName: admin.lastName,
        fatherName: admin.fatherName,
        avatarURL: admin.avatarURL,
        editorRole: admin.editorRole,
        taxCode: admin.taxCode,
        dayOfBirthday: admin.dayOfBirthday,
        telNumber: admin.telNumber,
        email: admin.email,
      },
    });
  }
};

const getRefreshTokenAdmin = async (req, res, next) => {
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
      expiresIn: refreshTokenExpires,
    });

    await Admin.findByIdAndUpdate(isExist._id, { accessToken, refreshToken });

    res.json({ accessToken, refreshToken });
  } catch (error) {
    next(HttpError(403), error.message);
  }
};

const getCurrentAdmin = async (req, res) => {
  // console.log("req", req.user);
  const {
    login,
    firstName,
    lastName,
    fatherName,
    avatarURL,
    adminRole,
    editorRole,
    taxCode,
    dayOfBirthday,
    telNumber,
    email,
  } = req.user.admin;
  const { accessToken } = req.user;

  if (adminRole) {
    res.json({
      accessToken,
      admin: {
        login,
        firstName,
        lastName,
        fatherName,
        avatarURL,
        editorRole,
        taxCode,
        dayOfBirthday,
        telNumber,
        email,
      },
    });
  } else {
    res.json({
      accessToken,
      editor: {
        login,
        firstName,
        lastName,
        fatherName,
        avatarURL,
        editorRole,
        taxCode,
        dayOfBirthday,
        telNumber,
        email,
      },
    });
  }
};

const logoutAdmin = async (req, res) => {
  const { _id } = req.user.admin;
  console.log("req.admin", req.user.admin);
  await Admin.findByIdAndUpdate(_id, { accessToken: "", refreshToken: "" });
  res.status(204).json();
};

// const avatarsDir = path.join(__dirname, "../", "public", "avatars");
const tempDirResize = path.join(__dirname, "../", "tmp", "resize");
const avatarsDir = path.resolve("public", "avatars");

const updateAdminAvatar = async (req, res) => {
  if (!req.file) {
    throw HttpError(404, "File not found for upload");
  }

  const { _id } = req.user.admin;
  // console.log("_id  из аватара", _id);
  const { path: tempDir, originalname } = req.file;

  const sizeImg = "250x250_";
  const fileName = `${_id}_${originalname}`;
  const resizeFileName = `${sizeImg}${fileName}`;
  const resultUpload = path.join(avatarsDir, resizeFileName);
  const resizeResultUpload = path.join(tempDirResize, resizeFileName);

  const reziseImg = await Jimp.read(tempDir);

  reziseImg
    .autocrop()
    .cover(250, 250)
    .writeAsync(`${tempDirResize}/${resizeFileName}`);

  await fs.unlink(tempDir);
  await fs.rename(resizeResultUpload, resultUpload);

  const avatarURL = path.join("avatars", resizeFileName);
  await Admin.findByIdAndUpdate(
    _id,
    {
      avatarURL,
    },
    {
      new: true,
    }
  );

  res.json({ avatarURL });
};

export default {
  signUpAdmin: ctrlWrapper(signUpAdmin),
  adminSignIn: ctrlWrapper(adminSignIn),
  getRefreshTokenAdmin: ctrlWrapper(getRefreshTokenAdmin),
  getCurrentAdmin: ctrlWrapper(getCurrentAdmin),
  logoutAdmin: ctrlWrapper(logoutAdmin),
  updateAdminAvatar: ctrlWrapper(updateAdminAvatar),
};
