import express, { NextFunction, Response } from "express";
import createHttpError from "http-errors";
import { JWTAuthMiddleware, UserRequest } from "../../lib/auth/jwtAuth";
import {
  createTokens,
  verifyRefreshAndCreateNewTokens,
} from "../../lib/auth/tools";
import UsersModel from "./model";
import AccommodationsModel from "../accommodation/model";
import { User } from "./types";

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

const usersRouter = express.Router();

usersRouter.post(
  "/register",
  async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      const newUser = new UsersModel(req.body);
      const { _id } = await newUser.save();
      res.status(201).send({ _id });
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user1 = await UsersModel.checkCredentials(email, password);

    if (user1) {
      const { accessToken, refreshToken } = await createTokens(user1);
      res.send({ accessToken, refreshToken });
    } else {
      next(createHttpError(401, `Credentials are not ok!`));
    }
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/refreshTokens", async (req, res, next) => {
  try {
    const { currentRefreshToken } = req.body;
    const newTokens = await verifyRefreshAndCreateNewTokens(
      currentRefreshToken,
      next
    )!;

    res.send({ ...newTokens });
  } catch (error) {
    next(error);
  }
});

// GET ME

usersRouter.get(
  "/me",
  JWTAuthMiddleware,
  async (req: UserRequest, res, next) => {
    try {
      const users = await UsersModel.findById(req.user?._id);
      res.send(users);
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.get("/", async (req, res, next) => {
  try {
    const users = await UsersModel.find();
    res.send(users);
  } catch (error) {
    next(error);
  }
});

export default usersRouter;