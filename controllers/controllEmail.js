import ctrlWrapper from "../helpers/ctrlWrapper.js";
// import { sendEmail } from "../helpers/sendEmail.js";
import { User, Fop, Company } from "../models/userModel.js";
import HttpError from "../helpers/HttpError.js";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const {
  EMAIL_ADMIN_ULASP,
  EMAIL_INFO_ULASP,
  EMAIL_INFO_ULASP_PASSWD,
  EMAIL_CLIENT_ULASP,
  EMAIL_CLIENT_ULASP_PASSWD,
  EMAIL_BUCH_ULASP,
} = process.env;

const nodemailerConfig = {
  host: "freemail.freehost.com.ua",
  port: 465,
  secure: true,
  auth: {
    user: EMAIL_CLIENT_ULASP,
    pass: EMAIL_CLIENT_ULASP_PASSWD,
  },
};

const transporter = nodemailer.createTransport(nodemailerConfig);

const sendEmail = async (data) => {
  const email = { ...data, from: EMAIL_CLIENT_ULASP };
  await transporter.sendMail(email);
  return true;
};

const nodemailerConfigInfo = {
  host: "freemail.freehost.com.ua",
  port: 465,
  secure: true,
  auth: {
    user: EMAIL_INFO_ULASP,
    pass: EMAIL_INFO_ULASP_PASSWD,
  },
};

const transporterInfo = nodemailer.createTransport(nodemailerConfigInfo);

const sendEmailInfo = async (data) => {
  const email = { ...data, from: EMAIL_INFO_ULASP };
  await transporterInfo.sendMail(email);
  return true;
};

const sendEmailByAccess = async (req, res) => {
  const { id } = req.params;
  console.log("_id", id);
  const objectId = new mongoose.Types.ObjectId(id);
  const user = await User.findOne({ _id: objectId });
  console.log("user", user);
  if (!user) {
    throw HttpError(404, "User not found");
  }
  const accessEmail = {
    to: user.email,
    subject: "Доступ до музичного сервісу Ulasp Music",
    html: `<h2>Шановний користувач! </h2>
    <div>

    <p>Вам надано доступ сервісу Ulasp Music: http://music.ulasp.com.ua:9080/</p>
</br>
    Ваші дані для входу:

     <p>Номер договору: ${user.contractNumber} </p>
    <p>Ідентифікаційний номер: ${user.taxCode} </p>
    </div>
`,
  };

  await sendEmailInfo(accessEmail);

  res.json({
    message: "Successful access",
  });
};

const sendEmailByAct = async (req, res) => {
  const { id } = req.params;
  const { actText } = req.body;
  // console.log("body :>> ", req.body);
  // console.log("_id", id);
  const objectId = new mongoose.Types.ObjectId(id);
  const user = await User.findOne({ _id: objectId });

  if (!user) {
    throw HttpError(404, "User not found");
  }
  const actEmail = {
    to: EMAIL_BUCH_ULASP,
    subject: `Акт звірки Ulasp Music для ${user.contractNumber}`,
    html: `<h2> Користувач  ${
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.name
    }! </h2>
    <div
    <p>Запросив акт звірки </p>
    <p>Номер договору: ${user.contractNumber} </p>
     <p>Ідентифікаційний номер: ${user.taxCode} </p>
    <p>Email: ${user.email} </p>
    <p>Деталі: </p>
    ${actText}
    </div>
`,
  };

  await sendEmail(actEmail);

  res.json({
    message: "Successful send request for reconciliation report",
  });
};

const sendEmailToAdminFromUser = async (req, res) => {
  const { id } = req.params;
  const { subject, text } = req.body;
  // console.log("body :>> ", req.body);
  // console.log("_id", id);
  const objectId = new mongoose.Types.ObjectId(id);
  const user = await User.findOne({ _id: objectId });

  if (!user) {
    throw HttpError(404, "User not found");
  }
  const userToAdminEmail = {
    to: EMAIL_ADMIN_ULASP,
    subject: ` ${subject} від ${user.contractNumber}`,
    html: `
    <div>
 
    ${text}
    </div>
`,
  };

  await sendEmail(userToAdminEmail);

  res.json({
    message: "Successful send mail for admin",
  });
};

export default {
  sendEmailByAccess: ctrlWrapper(sendEmailByAccess),
  sendEmailByAct: ctrlWrapper(sendEmailByAct),
  sendEmailToAdminFromUser: ctrlWrapper(sendEmailToAdminFromUser),
};
