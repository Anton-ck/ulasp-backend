import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import Admin from "../models/admin.js";
import HttpError from "../helpers/HttpError.js";
import ctrlWrapper from "../helpers/ctrlWrapper.js";

const createEditorRole = async (req, res) => {
  const { login, password } = req.body;

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
    taxCode: newEditor.taxCode,
    dayOfBirthday: newEditor.dayOfBirthday,
    telNumber: newEditor.telNumber,
    email: newEditor.email,
  });
};

const updateAdminInfo = async (req, res) => {
  console.log(req.params.id);
  const { id } = req.params;
  const result = await Admin.findByIdAndUpdate(id, req.body, { new: true });
  if (!result) {
    throw HttpError(404, "Not found");
  }
  res.json({
    login: result.login,
    firstName: result.firstName,
    lastName: result.lastName,
    fatherName: result.fatherName,
    avatarURL: result.avatarURL,
    adminRole: result.adminRole,
    editorRole: result.editorRole,
    taxCode: result.taxCode,
    dayOfBirthday: result.dayOfBirthday,
    telNumber: result.telNumber,
    email: result.email,
  });
};

export default {
  createEditorRole: ctrlWrapper(createEditorRole),
  updateAdminInfo: ctrlWrapper(updateAdminInfo),
};
