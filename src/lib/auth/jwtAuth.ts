import createHttpError from "http-errors";
import { verifyAccessToken } from "./tools";
import AccommodationsModel from "../../api/accommodation/model";
import { UserDocument } from "../../api/user/types";
import { Request, RequestHandler } from "express";

export interface UserRequest extends Request {
  user?: Partial<UserDocument>;
}

export const JWTAuthMiddleware: RequestHandler = async (
  req: UserRequest,
  res,
  next
) => {
  if (!req.headers.authorization) {
    next(
      createHttpError(
        401,
        "Please provide Bearer Token in the authorization header"
      )
    );
  } else {
    try {
      const accessToken = req.headers.authorization.replace("Bearer ", "");
      const payload = await verifyAccessToken(accessToken);
      req.user = {
        _id: payload._id,
        role: payload.role,
      };

      //   HOST-ONLY validator - checks if user is host when interacting with HOST-ONLY endpoints
      const requestOptions = {
        originalUrl: req.originalUrl,
        method: req.method,
      };

      const hostOnlyEndpoints = [
        { baseUrl: "/users/me/accommodations", method: "GET" },
        { baseUrl: "/accommodations", method: "POST" },
        { baseUrl: "/accommodations", method: "PUT" },
        { baseUrl: "/accommodations", method: "DELETE" },
      ];

      const endpointIndex = hostOnlyEndpoints.findIndex(
        (endpoint) =>
          (endpoint.baseUrl === requestOptions.originalUrl ||
            endpoint.baseUrl === req.baseUrl) &&
          endpoint.method === requestOptions.method
      );
      const isThisAHostOnlyReq = endpointIndex === -1 ? false : true;

      if (isThisAHostOnlyReq) {
        if (req.user.role === "Host") {
          if (requestOptions.method === "GET") {
            next();
          } else {
            if (requestOptions.method === "POST") {
              // Checks if posting user is specified user within the new accommodation data in request body

              if (req.body.host === req.user._id) {
                next();
              } else {
                next(
                  createHttpError(
                    403,
                    "You may not post a new accommodation without you as the host, if you wish to post under this account please log into the account and post there."
                  )
                );
              }
            } else {
              //   Checks if user is host of accommodation in case of PUT or DELETE of accommodation

              const accommodation = await AccommodationsModel.findById(
                req.params.id
              );

              if (accommodation) {
                if (accommodation.host.toString() === req.user._id) {
                  next();
                } else {
                  next(
                    createHttpError(
                      403,
                      "You may not edit or delete another users post."
                    )
                  );
                }
              } else {
                next(
                  createHttpError(
                    404,
                    `Accommodation with id ${req.params.id} not found.`
                  )
                );
              }
            }
          }
        } else {
          next(
            createHttpError(403, "Must be a host to access these endpoints!")
          );
        }
      } else {
        next();
      }
    } catch (error) {
      console.log(error);
      next(createHttpError(401, "Token not valid!"));
    }
  }
};