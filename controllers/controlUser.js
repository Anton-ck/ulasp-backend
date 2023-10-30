import bcrypt from "bcrypt";
import { User, Fop, Company } from "../models/userModel.js";
import Admin from "../models/adminModel.js";
import HttpError from "../helpers/HttpError.js";
import ctrlWrapper from "../helpers/ctrlWrapper.js";
import jwt from "jsonwebtoken";

const getAllUsers = async (req, res) => {
  const result = await User.find();

  res.json(result);
};

export default {
  getAllUsers: ctrlWrapper(getAllUsers),
};
