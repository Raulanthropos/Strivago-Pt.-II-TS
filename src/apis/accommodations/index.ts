import express from "express";
import createHttpError from "http-errors";
import hostOnlyMiddleware from "../../library/authentication/hostOnly";
import {
  JWTAuthMiddleware,
  UserRequest,
} from "../../library/authentication/jwtAuth";
import AccommodationsModel from "./model";
const accommodationsRouter = express.Router();

//just hosts can create a new accommodation
//you don't provide the host id in the body, but it will be created with the info from the token
//in the req.user we will find the data of the current user of the token
//the data is coming from performing the JWTAuthMiddleware
//the order of the middlewares matters!!! first the JWTAuthMiddleware to verify if you
//are authorized to do a certain action and then the hostOnlyMiddleware (which checks if you are a host)
accommodationsRouter.post(
  "/",
  JWTAuthMiddleware,
  hostOnlyMiddleware,
  async (req: UserRequest, res, next) => {
    try {
      const newAccommodation = new AccommodationsModel({
        ...req.body,
        host: req.user!._id,
      });
      const { _id } = await newAccommodation.save();
      res.status(201).send({ _id });
    } catch (error) {
      next(error);
    }
  }
);

//gets all the accommodations if you provide a valid token in the authorization headers
//hosts and guests endpoint
accommodationsRouter.get("/", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const accommodations = await AccommodationsModel.find().populate({
      path: "host",
    });
    res.send(accommodations);
  } catch (error) {
    next(error);
  }
});

//gets a certain accommodation if you provide a valid token in the authorization headers
//hosts and guests endpoint
accommodationsRouter.get(
  "/:accommodationId",
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      const accommodation = await AccommodationsModel.findById(
        req.params.accommodationId
      ).populate({
        path: "host",
      });
      if (accommodation) {
        res.send(accommodation);
      } else {
        next(
          createHttpError(404, "No accommodations with the provided id found")
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

//hosts only endpoint
//edits an accommodation
//JWTAuthMiddleware is checking if you are authorized to edit the accommodation (if you are the owner of it)
accommodationsRouter.put(
  "/:accommodationId",
  JWTAuthMiddleware,
  hostOnlyMiddleware,
  async (req: UserRequest, res, next) => {
    try {
      const accommodation = await AccommodationsModel.findById(
        req.params.accommodationId
      );
      if (accommodation) {
        //the req.user is updated by the JWTAuthMiddleware
        //we use the verifyAccessToken function which resolves the promise
        //(and returns the payload: with _id and the role)
        //and if it rejects the promise, it return an error
        if (accommodation.host.toString() === req.user!._id.toString()) {
          const updatedAccommodation =
            await AccommodationsModel.findByIdAndUpdate(
              req.params.accommodationId,
              req.body,
              { new: true, runValidators: true }
            );
          res.status(204).send(updatedAccommodation);
        } else {
          next(createHttpError(403, "The accommodation is not yours to update"));
        }
      } else {
        next(
          createHttpError(404, `Accommodation with the provided id not found`)
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

//deletes an accommodation
//host only endpoint
//you have to be the owner of the accommodation in order to delete it
accommodationsRouter.delete(
  "/:accommodationId",
  JWTAuthMiddleware,
  hostOnlyMiddleware,
  async (req: UserRequest, res, next) => {
    try {
      const accommodation = await AccommodationsModel.findById(
        req.params.accommodationId
      );
      if (accommodation) {
        //the req.user is updated by the JWTAuthMiddleware
        //we use the verifyAccessToken function which resolves the promise
        //(and returns the payload: with _id and the role)
        //and if it rejects the promise, it return an error
        if (accommodation.host.toString() === req.user!._id.toString()) {
          const deletedAccommodation =
            await AccommodationsModel.findByIdAndDelete(
              req.params.accommodationId
            );
          res.status(204).send();
        } else {
          next(createHttpError(403, "The accommodation is not yours to delete"));
        }
      } else {
        next(
          createHttpError(
            404,
            `Accommodation with id ${req.params.accommodationId} not found!`
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

export default accommodationsRouter;
