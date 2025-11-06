import db from "../../src/connection";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { sendMail } from "../utils/mailer";
import dotenv from "dotenv";
dotenv.config();

const RESET_SECRET: Secret = (process.env.RESET_TOKEN_SECRET || process.env.JWT_SECRET || "default_secret") as Secret;
const RESET_EXPIRES = process.env.RESET_TOKEN_EXPIRES || "15m";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

export const forgotPasswordService = async (email: string) => {
  const user = await db("users").where({ email }).first();
  if (!user) throw new Error("User not found");

  const token = jwt.sign({ id: user.id, email: user.email }, RESET_SECRET, { expiresIn: RESET_EXPIRES } as SignOptions);
  const resetLink = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;

  const subject = "Reset your admin panel password";
  const text = `Hello ${user.firstName || ""}, Use the link below to reset your password (expires in ${RESET_EXPIRES}): ${resetLink}`;
  const html = `<p>Hello ${user.firstName || ""},</p>
    <p>Click below to reset your password (expires in ${RESET_EXPIRES}):</p>
    <a href="${resetLink}" style="padding:10px 16px;background:#0366d6;color:white;text-decoration:none;border-radius:6px;">Reset password</a>`;

  await sendMail(user.email, subject, text, html);
};

export const resetPasswordService = async (token: string, newPassword: string) => {
  const decoded = jwt.verify(token, RESET_SECRET) as { id: number; email: string };
  const hashed = await bcrypt.hash(newPassword, 10);

  await db("users")
    .where({ id: decoded.id })
    .update({
      password: hashed,
      updatedAt: db.fn.now(),
    });
};
