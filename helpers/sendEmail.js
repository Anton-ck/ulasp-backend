// import nodemailer from "nodemailer";
// import dotenv from "dotenv";
// dotenv.config();

// const { EMAIL_ADMIN, EMAIL_PASSWORD } = process.env;
// console.log("EMAIL_ADMIN", EMAIL_ADMIN);
// console.log("EMAIL_PASSWORD", EMAIL_PASSWORD);
// const nodemailerConfig = {
//   host: "smtp.meta.ua",
//   port: 465,
//   secure: true,
//   auth: {
//     user: EMAIL_ADMIN,
//     pass: EMAIL_PASSWORD,
//   },
// };

// const transporter = nodemailer.createTransport(nodemailerConfig);

// export const sendEmail = async (data) => {
//   const email = { ...data, from: EMAIL_ADMIN };
//   return transporter
//     .sendMail(email)
//     .then((info) => console.log(info))
//     .catch((err) => console.log(err));
// };
