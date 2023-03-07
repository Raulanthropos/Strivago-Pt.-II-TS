import express from "express";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import UsersModel from "./model";
import {
  JWTAuthMiddleware,
  UserRequest,
} from "../../library/authentication/jwtAuth";
import { createAccessToken } from "../../library/authentication/jwtTools";
import hostOnlyMiddleware from "../../library/authentication/hostOnly";
import AccommodationsModel from "../accommodations/model";

const usersRouter = express.Router();

//simple post method
//not required
usersRouter.post("/", async (req, res, next) => {
  try {
    const newUser = new UsersModel(req.body);
    const { _id } = await newUser.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

//login user which generates a valid token if the user already exists
//otherwise, error (first you must register)
usersRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    //if the user doesn't exist, cannot generate new token
    const user = await UsersModel.checkCredentials(email, password);
    if (user) {
      const payload = { _id: user._id, role: user.role };
      const accessToken = await createAccessToken(payload);
      res.send({ accessToken });
    } else {
      next(createHttpError(401, "Credentials are not ok!"));
    }
  } catch (error) {
    next(error);
  }
});

//register user which creates a new user and generates a valid token for him
usersRouter.post("/register", async (req, res, next) => {
  try {
    //expectes email, password and role in req.body
    const { email, password } = req.body;
    const emailAlreadyRegistered = await UsersModel.findOne({ email: email });
    if (emailAlreadyRegistered)
      next(createHttpError(400, `User with provided email already exists`));
    const newUser = new UsersModel(req.body);
    await newUser.save();
    if (newUser && email && password) {
      const payload = { _id: newUser._id, role: newUser.role };

      const accessToken = await createAccessToken(payload);
      res.status(201).send({ accessToken });
    }
    //creates a user
    //returns a valid token
  } catch (error) {
    next(error);
  }
});

//get all users
//not required for hw
usersRouter.get("/", async (req, res, next) => {
  try {
    const users = await UsersModel.find();
    res.send(users);
  } catch (error) {
    next(error);
  }
});

//a user or a host can get his profile
//put the token in the authorization headers
//and you will get all the data for a user that matches the token
usersRouter.get(
  "/me",
  JWTAuthMiddleware,
  async (req: UserRequest, res, next) => {
    try {
      const user = await UsersModel.findById(req.user!._id);
      res.send(user);
    } catch (error) {
      next(error);
    }
  }
);

//host only endpoint
//gets all the accommodations of a certain host
usersRouter.get(
  "/me/accommodations",
  JWTAuthMiddleware,
  hostOnlyMiddleware,
  async (req: UserRequest, res, next) => {
    try {
      //user is updated from using JWTAuthMiddleware
      const accommodations = await AccommodationsModel.find({
        host: req.user!._id,
      });
      if (accommodations) {
        res.send(accommodations);
      } else {
        next(
          createHttpError(404, `This host doesn't have any accommodations yet`)
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

export default usersRouter;
