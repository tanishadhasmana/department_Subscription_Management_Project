// jwt library to create and verify token, sign option is a TS interface/type that comes from jwt so we able to pass options like, payload, expires in etc
import jwt, { SignOptions } from "jsonwebtoken";
import dotenv from "dotenv";

// reading the .env files
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(" Missing JWT_SECRET in environment variables");
}
// fucn so we can use aywhere
export const generateToken = (
  payload: object,
  expiresIn: number | string = "1d"
): string => {
  try {
    const options: SignOptions = { expiresIn: expiresIn as SignOptions["expiresIn"] };
    // jwt.sign to create  token, and in option above we set the token expiry.
    return jwt.sign(payload, JWT_SECRET, options);
  } catch (err) {
    console.error(" generateToken error:", err);
    throw new Error("Failed to generate token");
  }
};

