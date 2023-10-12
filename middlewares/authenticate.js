import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import Admin from "../models/admin.js";

import HttpError from "../helpers/HttpError.js";

dotenv.config();

const { ACCESS_SECRET_KEY } = process.env;

const authenticate = async (req, res, next) => {
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
    next();
  } catch (error) {
    next(HttpError(401));
  }
};

export default authenticate;
