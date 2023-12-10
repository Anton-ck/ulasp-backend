import bcrypt from "bcrypt";
import { User, Fop, Company } from "../models/userModel.js";
import Admin from "../models/adminModel.js";
import HttpError from "../helpers/HttpError.js";
import ctrlWrapper from "../helpers/ctrlWrapper.js";
import jwt from "jsonwebtoken";

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

  res.json({
    result
  });
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

  console.log(result);
  if (!result) {
    throw HttpError(404, "Not found");
  }
  res.json({
    id: result.id,
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

  const result = await Admin.findByIdAndUpdate(id, {
    password: hashPassword,
  });

  res.status(200).json({
    message: `Password for ${result.editorRole ? "Editor" : "Admin"} '${
      result.firstName
    }' with ID ${result._id} has been changed`,
  });
};

const createUser = async (req, res) => {
  const { contractNumber, taxCode, password, userFop } = req.body;
  const user = await User.findOne({ contractNumber });

  if (user) {
    throw HttpError(409, "contractNumber in use");
  }
  const hashtaxCode = await bcrypt.hash(taxCode, 10);

  let newUser = {};
  console.log("newUser", newUser);
  if (userFop === "fop") {
    console.log("tut");
    newUser = await Fop.create({
      ...req.body,
      password: hashtaxCode
      
    });
  } else {
    newUser = await Company.create({
      ...req.body,
      password: hashtaxCode
    });
  }

  res.status(201).json({
    user: {
      id: newUser._id,
      contractNumber: newUser.contractNumber,
    },
  });
};

const getAllUsers = async (req, res) => {
  const allUsers = await User.find({...req.body});

  res.json({
    allUsers,
  });
};

const getUserById = async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(
    id,
    "-createdAt -updatedAt -accessToken -refreshToken -password"
  );

  if (!user) {
    throw HttpError(404);
  }

  res.json(user);
};


const deleteUser = async (req, res) => {
  
  const { id } = req.params;

  const user = await User.findById(id);
    
  if (!user) {
    throw HttpError(404);
  }

  const result = await User.findByIdAndDelete(id);

  res.status(200).json({ message: 'User deleted ' });
  if (!result) {
    res.status(500).json({ message: 'An error occurred' });
  }
};

const toggleUserStatus = async (req, res) => {
  const { id } = req.params;

   const user = await User.findById(id);
 
if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

   user.status = !user.status;
    await user.save();

  res.status(200).json({
    message: `Status for user '${user.firstName} ${user.lastName}' with ID ${user._id} has been toggled`,
    newStatus: user.status,
  });
};


const toggleUserAccess = async (req, res) => {
  const { id } = req.params;

   const user = await User.findById(id);
 
if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

   user.access = !user.access;
    await user.save();

  res.status(200).json({
    message: `Access for user '${user.firstName} ${user.lastName}' with ID ${user._id} has been toggled`,
    newAccess: user.access,
  });
};

const updateUserInfo = async (req, res) => {
  const { id } = req.params;
  console.log("id", id);
  console.log("req.body", req.body);

  let result = {};
  if( req.body.userFop === "fop") {
     result = await Fop.findByIdAndUpdate(id, req.body, {
      new: true,
    })} else {  result = await Company.findByIdAndUpdate(id, req.body, {
    new: true,
  })}
 

  if (!result) {
    throw HttpError(404, "Not found");
  }
  res.json({result

    // id: result.id,
    // login: result.login,
    // firstName: result.firstName,
    // lastName: result.lastName,
    // fatherName: result.fatherName,
    // avatarURL: result.avatarURL,
    
    // taxCode: result.taxCode,
    // dayOfBirthday: result.dayOfBirthday,
    // telNumber: result.telNumber,
    // email: result.email,
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
  createUser: ctrlWrapper(createUser),
  getAllUsers: ctrlWrapper(getAllUsers),
  getUserById: ctrlWrapper(getUserById),
  deleteUser: ctrlWrapper(deleteUser),
  toggleUserStatus:ctrlWrapper(toggleUserStatus),
  toggleUserAccess: ctrlWrapper(toggleUserAccess),
  updateUserInfo: ctrlWrapper(updateUserInfo),
};
