import bcrypt from "bcrypt";

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

const getAllAdmin = async (req, res) => {
  const result = await Admin.find(
    { ...req.query },
    "-createdAt -updatedAt -accessToken -refreshToken -password"
  );

  res.json(result);
};

const getAdminById = async (req, res) => {
  const { id } = req.params;

  const admin = await Admin.findById(
    id,
    "-createdAt -updatedAt -accessToken -refreshToken -password"
  );

  if (!admin) {
    throw HttpError(404);
  }

  res.json(admin);
};

const updateAdminInfo = async (req, res) => {
  const { id } = req.params;
  const result = await Admin.findByIdAndUpdate(id, req.body, {
    new: true,
  });
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

const deleteAdmin = async (req, res) => {
  const { id } = req.params;
  const admin = await Admin.findById(id);
  if (!admin) {
    throw HttpError(404, "Not found");
  }
  const result = await admin.deleteOne();

  res.status(200).json({
    message: `${result.editorRole ? "Editor" : "Admin"} '${
      result.firstName
    }' with ID ${result._id} was deleted`,
  });
};

const updateAdminPassword = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  const hashPassword = await bcrypt.hash(password, 10);

  await Admin.findByIdAndUpdate(id, {
    password: hashPassword,
  });

  res.json({
    password,
  });
};

// const deleteAdmin = async (req, res) => {
//   const { id } = req.params;

//   const result = Admin.findByIdAndDelete(id);
//   console.log(result);
//   if (!result) {
//     throw HttpError(404, "Not found!!!!");
//   }

//   res.status(200).json({
//     message: "Contact deleted",
//   });
// };

export default {
  createEditorRole: ctrlWrapper(createEditorRole),
  getAllAdmin: ctrlWrapper(getAllAdmin),
  getAdminById: ctrlWrapper(getAdminById),
  updateAdminInfo: ctrlWrapper(updateAdminInfo),
  deleteAdmin: ctrlWrapper(deleteAdmin),
  updateAdminPassword: ctrlWrapper(updateAdminPassword),
};
