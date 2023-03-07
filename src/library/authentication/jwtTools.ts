import jwt from "jsonwebtoken";
import { ObjectId } from "mongoose";

const options = { expiresIn: `1 week` };

export interface TokenPayload {
  _id: ObjectId;
  role: "host" | "guest";
}

export const createAccessToken = (payload: TokenPayload): Promise<string> => {
  return new Promise((resolve, reject) => {
    return jwt.sign(payload, process.env.JWT_SECRET!, options, (err, token) => {
      if (err) reject(err);
      else resolve(token as string);
    });
  });
};

export const verifyAccessToken = (token: string): Promise<TokenPayload> => {
  return new Promise((resolve, reject) => {
    return jwt.verify(
      token,
      process.env.JWT_SECRET!,
      (err, originalPayload) => {
        if (err) reject(err);
        else resolve(originalPayload as TokenPayload);
      }
    );
  });
};
