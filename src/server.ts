import express from "express";
import listEndpoints from "express-list-endpoints";
import cors from "cors";
import {
  badRequestHandler,
  forbiddenHandler,
  genericServerErrorHandler,
  notFoundHandler,
  unauthorizedHandler,
} from "./errorHandlers";
import mongoose from "mongoose";
import usersRouter from "./api/user/index";
import accommodationsRouter from "./api/accommodation/index";

const server = express();
const port = process.env.PORT || 3003;

server.use(
  cors()
);

server.use(express.json());

server.use("/users", usersRouter);
server.use("/accommodations", accommodationsRouter);

server.use(badRequestHandler);
server.use(unauthorizedHandler);
server.use(forbiddenHandler);
server.use(notFoundHandler);
server.use(genericServerErrorHandler);

if (process.env.MONGO_DB_CONNECTION_STRING) {
  mongoose.connect(process.env.MONGO_DB_CONNECTION_STRING);
}

server.listen(port, () => {
  console.table(listEndpoints(server));
  console.log("Server is up and running on port " + port);
});

export default server;