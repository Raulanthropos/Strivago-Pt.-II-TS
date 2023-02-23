import supertest from "supertest";
import mongoose from "mongoose";
import dotenv from "dotenv";
import server from "../server";
import UsersModel from "../api/user/model";
import { UserDocument } from "../api/user/types";

dotenv.config();

const client = supertest(server);

describe("Test Accommodations Endpoints", () => {
  let users: UserDocument[];

  beforeAll(async () => {
    users = await UsersModel.find({ role: "host" });
  });

  it("should create a new accommodation", async () => {
    const correctAccommodation = {
      name: "Chandris Hotel",
      host: users[0]._id,
      description: "test description",
      maxGuests: 4,
      city: "Chios",
    }


  const invalidAccommodation = {
    name: "Anemone",
    host: users[0]._id,
    description: "test description",
    maxGuests: "DIS IS A STRING",
    city: "Chios",
  };
});
  let newAccommodationId: string;

  beforeAll(async () => {
    if (process.env.MONGO_DB_URL) {
      await mongoose.connect(process.env.MONGO_DB_URL);
    }
  });

  //   Mongo check

  it("Should check that Mongo connection string is not undefined", () => {
    expect(process.env.MONGO_DB_URL).toBeDefined();
  });

  //   GET accommodations

  it("Should return 200 when GET /accommodations is successful", async () => {
    const response = await client.get("/accommodations");
    expect(response.status).toBe(200);
  });

  // Close MongoDB connection after suite finish

  afterAll(async () => {
    await mongoose.connection.close();
  });
});