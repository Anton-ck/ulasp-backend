import ctrlWrapper from "../helpers/ctrlWrapper.js";
// import { sendEmail } from "../helpers/sendEmail.js";
import { User, Fop, Company } from "../models/userModel.js";
import HttpError from "../helpers/HttpError.js";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const {
  EMAIL_ADMIN,
  EMAIL_PASSWORD,
  EMAIL_ADMIN_UKR_NET,
  EMAIL_PASSWORD_UKR_NET,
  PASSWORD_UKR_NET,
  SENDGRID_API_KEY,
  EMAIL_ACCOUNTANT,
} = process.env;

// sgMail.setApiKey(SENDGRID_API_KEY);
// const email = {
//   to: "ulaspadmin@ukr.net",
//   from: "testnolimiti@gmail.com",
//   subject: "Verify email",
//   html: `<p >Click verify email</p>`,
// };

// EMAIL_ADMIN=ulaspadmin@meta.ua
// EMAIL_PASSWORD=ulaspAdmin01012000
// EMAIL_ADMIN_UKR_NET=ulaspadmin@ukr.net
// EMAIL_PASSWORD_UKR_NET=01ulaspemail01
// PASSWORD_UKR_NET = tjEXIuZCKciVIEQH

const nodemailerConfig = {
  host: "smtp.ukr.net",
  port: 2525,
  secure: true,
  auth: {
    user: EMAIL_ADMIN_UKR_NET,
    pass: PASSWORD_UKR_NET,
  },
};

const transporter = nodemailer.createTransport(nodemailerConfig);

const sendEmail = async (data) => {
  const email = { ...data, from: EMAIL_ADMIN_UKR_NET };
  await transporter.sendMail(email);
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
    subject: " Уласп доступ",
    html: `<h2>Шановний користувач! </h2>
    <div>

    <p>Вам надано доступ до ресурсу УЛАСП: http://music.ulasp.com.ua:9080/</p>
</br>
    Дані для входу:

     <p>Номер договору: ${user.contractNumber} </p>
    <p>Ідентифікаційний номер: ${user.taxCode} </p>
    </div>
`,
  };

  await sendEmail(accessEmail);

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
    to: EMAIL_ACCOUNTANT,
    subject: ` Уласп акт звірки для ${user.contractNumber}`,
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
    to: EMAIL_ADMIN_UKR_NET,
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
