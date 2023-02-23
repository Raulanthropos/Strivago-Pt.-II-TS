import { ErrorRequestHandler } from "express";

export const badRequestHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err.status === 400) {
    res.status(400).send({ message: err.message, errorList: err.errorsList });
  } else {
    next(err);
  }
};

export const unauthorizedHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  next
) => {
  if (err.status === 401) {
    res.status(401).send({ message: err.message });
  } else {
    next(err);
  }
};

export const forbiddenHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err.status === 403) {
    res.status(403).send({ success: false, message: err.message });
  } else {
    next(err);
  }
};

export const notFoundHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err.status === 404) {
    res.status(404).send({ success: false, message: err.message });
  } else {
    next(err);
  }
};

export const genericServerErrorHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  next
) => {
  console.log("ERR: ", err);
  res.status(500).send({
    message: "There was an error with the server, please try again later!",
  });
};