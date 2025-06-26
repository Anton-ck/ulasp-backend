import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import Admin from '../models/adminModel.js';

import HttpError from '../helpers/HttpError.js';

dotenv.config();

const { ACCESS_SECRET_KEY } = process.env;

export const permisionsEditor = async (req, res, next) => {
  const { authorization = '' } = req.headers;
  const [bearer, accessToken] = authorization.split(' ');

  try {
    const { id } = jwt.verify(accessToken, ACCESS_SECRET_KEY);
    const admin = await Admin.findById(id);

    if (!admin.editorRole) {
      next(HttpError(403, "You don't have access for this operation"));
    }

    req.admin = admin;
    next();
  } catch (error) {
    next(HttpError(401));
    console.log(error);
  }
};
