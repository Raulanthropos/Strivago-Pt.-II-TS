import createHttpError from "http-errors";
import UsersModel from "../../apis/users/model";
import { RequestHandler } from "express";
import { UserRequest } from "./jwtAuth";

const hostOnlyMiddleware: RequestHandler = async (
  req: UserRequest,
  res,
  next
) => {
  //this req.user._id is coming from host only middleware where we overwrite the user
  //if the credentials match

  if (!req.user) {
    next(createHttpError(500, `Wrong order...`));
  } else {
    const user = await UsersModel.findById(req.user._id);

    if (!user) {
      next(createHttpError(404, "User not found"));
    } else {
      if (user.role.toString() === "host") {
        next();
      } else {
        next(
          createHttpError(403, "This endpoint is available just for hosts!")
        );
      }
    }
  }
};

export default hostOnlyMiddleware;
