import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// transporter, is obj, created using nodemailer used to send mails.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
// send mail is also a fucn provided by nodemailer, to actually send mail
export const sendMail = async (to: string, subject: string, text: string, html?: string) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  };
// now this info contail all details abt the mail.
  const info = await transporter.sendMail(mailOptions);
  // just to print the id that sent mail
  console.log("Email sent:", info.messageId);
  return info;
};
