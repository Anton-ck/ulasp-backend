import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import Admin from "../models/admin.js";
import HttpError from "../helpers/HttpError.js";
import ctrlWrapper from "../helpers/ctrlWrapper.js";

const createEditorRole = async (req, res) => {
  const { name, login, password, editorRole } = req.body;

  const editor = await Admin.findOne({ login });

  if (editor) {
    throw HttpError(409, "login in use");
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const newEditor = await Admin.create({
    ...req.body,
    password: hashPassword,
  });

  res.status(201).json({
    login: newEditor.login,
      editorRole: newEditor.editorRole,
    avararURL: newEditor.avatarURL,
    firstName: newEditor.firstName,
    lastName: newEditor.lastName,
    fatherName: newEditor.fatherName,
    passportDetails: newEditor.passportDetails,
    idNubmer: newEditor.idNubmer,
    dayOfBirthday: newEditor.dayOfBirthday,
    telNumber: newEditor.telNumber,
    email: newEditor.email,
  });
};

export default {
  createEditorRole: ctrlWrapper(createEditorRole),
};
