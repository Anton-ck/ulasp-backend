import { isValidObjectId } from "mongoose";
import HttpError from "../helpers/HttpError.js";

const isValid = (req, res, next) => {
  const { recipId, userId, id } = req.params;
  if (!isValidObjectId(userId || id)) {
    next(HttpError(400, `${userId || id} is not valid ID`));
  }
  next();
};

export default isValid;
