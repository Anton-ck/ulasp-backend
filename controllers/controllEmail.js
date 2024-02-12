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

export default {
  sendEmailByAccess: ctrlWrapper(sendEmailByAccess),
};
