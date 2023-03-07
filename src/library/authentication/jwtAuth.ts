import createHttpError from "http-errors";
import { verifyAccessToken } from "./jwtTools";
import { RequestHandler, Request } from "express";
import { TokenPayload } from "./jwtTools";

export interface UserRequest extends Request {
  user?: TokenPayload;
}

export const JWTAuthMiddleware: RequestHandler = async (
  req: UserRequest,
  res,
  next
) => {
  if (!req.headers.authorization) {
    //if the authorization header is in the request, it's good
    //otherwise -> 401 (unauthorized)
    next(
      createHttpError(
        401,
        "You didn't provide a Beared Token in the authorization header. Please provide one."
      )
    );
  } else {
    try {
      //if we have an authorization header in the request, we have to verify it
      //extract the token => check integrity and validity => if the checks are good,
      // we update the req.user with the new info from the payload extracted from verify function
      //if everything is good => next (we go to the async function which comes after this middleware)

      const accessToken = req.headers.authorization.replace("Bearer ", "");
      const payload = await verifyAccessToken(accessToken);
      req.user = {
        _id: payload._id,
        role: payload.role,
      };

      next();
    } catch (error) {
      console.log("Error from jwtAuthorization Middleware", error);
      next(createHttpError(401, "The token is not valid"));
    }
  }
};
