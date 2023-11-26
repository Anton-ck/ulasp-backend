import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import Admin from "../models/adminModel.js";
import HttpError from "../helpers/HttpError.js";
import ctrlWrapper from "../helpers/ctrlWrapper.js";
import { resizeAvatar } from "../helpers/resizePics.js";

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
  } = req.admin;

  if (adminRole) {
    res.json({
      admin: {
        login,
        firstName,
        lastName,
        fatherName,
        avatarURL,
        adminRole,
        taxCode,
        dayOfBirthday,
        telNumber,
        email,
      },
    });
  } else {
    res.json({
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
  const { _id } = req.admin;
  await Admin.findByIdAndUpdate(_id, { accessToken: "", refreshToken: "" });
  res.status(204).json();
};

const updateAdminAvatar = async (req, res) => {
  const { _id } = req.admin;
  if (!req.file) {
    throw HttpError(404, "File not found for upload");
  }
  const avatarURL = await resizeAvatar(req.file);

  await Admin.findByIdAndUpdate(_id, { avatarURL }, { new: true });

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
