import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import Admin from "../models/adminModel.js";
import { User } from "../models/userModel.js";
import HttpError from "../helpers/HttpError.js";

dotenv.config();

const { ACCESS_SECRET_KEY } = process.env;

export const authenticateAdmin = async (req, res, next) => {
  const { authorization = "" } = req.headers;
  const [bearer, accessToken] = authorization.split(" ");

  if (bearer !== "Bearer") {
    next(HttpError(401));
    return;
  }

  try {
    const { id } = jwt.verify(accessToken, ACCESS_SECRET_KEY);
    const admin = await Admin.findById(id);

    if (!admin || !admin.accessToken || admin.accessToken !== accessToken) {
      next(HttpError(401));
    }
    req.admin = admin;
    // req.user = { accessToken, admin }; iskra
    // console.log("req из авторизации", req.admin);
    next();
  } catch (error) {
    console.log(error);
    next(HttpError(401));
  }
};

export const authenticatUser = async (req, res, next) => {
  const { authorization = "" } = req.headers;
  const [bearer, accessToken] = authorization.split(" ");
  if (bearer !== "Bearer") {
    next(HttpError(401));
    return;
  }

  try {
    const { id } = jwt.verify(accessToken, ACCESS_SECRET_KEY);
    console.log('id', id)
    const user = await User.findById(id);
    if (!user || !user.accessToken || user.accessToken !== accessToken) {
      next(HttpError(401));
    }

    req.user = user;
    next();
  } catch (error) {
    next(HttpError(401));
  }
};
