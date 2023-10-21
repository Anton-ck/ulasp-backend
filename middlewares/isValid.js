import { isValidObjectId } from "mongoose";
import HttpError from "../helpers/HttpError.js";

const isValid = (req, res, next) => {
  const { adminID } = req.params;
  if (!isValidObjectId(adminID)) {
    next(HttpError(400, `${adminID} is not valid ID`));
  }
  next();
};

export default isValid;
