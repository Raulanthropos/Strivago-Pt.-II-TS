import { NextFunction } from "express";
import createHttpError, { HttpError, HttpErrorConstructor } from "http-errors";
import jwt, { VerifyOptions } from "jsonwebtoken";
import { ObjectId } from "mongoose";
import UsersModel from "../../api/user/model";
import { User } from "../../api/user/types";

interface TokenPayload {
  _id: ObjectId;
  role: "Host" | "Guest";
}

const createAccessToken = (payload: TokenPayload): Promise<string> =>
  new Promise((resolve, reject) =>
    jwt.sign(
      payload,
      process.env.JWT_SECRET!,
      { expiresIn: "1 week" },
      (err, token) => {
        if (err) reject(err);
        else resolve(token as string);
      }
    )
  );

export const verifyAccessToken = (accessToken: string): Promise<TokenPayload> =>
  new Promise((res, rej) =>
    jwt.verify(accessToken, process.env.JWT_SECRET!, (err, originalPayload) => {
      if (err) rej(err);
      else res(originalPayload as TokenPayload);
    })
  );

const createRefreshToken = (payload: object): Promise<string> =>
  new Promise((resolve, reject) =>
    jwt.sign(
      payload,
      process.env.REFRESH_SECRET!,
      { expiresIn: "1 week" },
      (err, token) => {
        if (err) reject(err);
        else resolve(token as string);
      }
    )
  );

export const verifyRefreshToken = (
  accessToken: string
): Promise<TokenPayload> =>
  new Promise((resolve, reject) =>
    jwt.verify(
      accessToken,
      process.env.REFRESH_SECRET!,
      (err, originalPayload) => {
        if (err) reject(err);
        else resolve(originalPayload as TokenPayload);
      }
    )
  );

export const createTokens = async (user1: any) => {
  const accessToken = await createAccessToken({
    _id: user1._id,
    role: user1.role,
  });
  const refreshToken = await createRefreshToken({ _id: user1._id });
  user1.refreshToken = refreshToken;

  await user1.save();

  return { accessToken, refreshToken };
};

export const verifyRefreshAndCreateNewTokens = async (
  currentRefreshToken: string,
  next: NextFunction
) => {
  try {
    const refreshTokenPayload = await verifyRefreshToken(currentRefreshToken);

    const user2 = await UsersModel.findById(refreshTokenPayload._id);
    if (!user2)
      next(
        createHttpError(
          404,
          `User with id ${refreshTokenPayload._id} not found!`
        )
      );
    if (user2!.refreshToken && user2!.refreshToken === currentRefreshToken) {
      const { accessToken, refreshToken } = await createTokens(user2!);
      return { accessToken, refreshToken };
    } else {
      next(createHttpError(401, "Refresh token not valid!"));
    }
  } catch (error) {
    next(createHttpError(401, "Refresh token not valid!"));
  }
};