import supertest from "supertest";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { server } from "../server";
// import { expressServer } from "../server";
import UsersModel from "../apis/users/model";
import { response } from "express";
import AccommodationsModel from "../apis/accommodations/model";

dotenv.config(); // This command forces .env vars to be loaded into process.env. This is the way to do it whenever you can't use -r dotenv/config

// supertest is capable of executing server.listen of our Express app if we pass the Express server to it
// It will give us back a client that can be used to run http requests on that server
const client = supertest(server);

const validUser = {
  email: "user@examplemail.com",
  password: "1234",
};

const invalidUser = {
  email: "user@examplemail.com",
};

const validUserNotInDb = {
  email: "test@gmail.com",
  password: "1234",
};

const validAccommodation = {
  name: "valid accommodation",
  description: "nice",
  maxGuests: 4,
  city: "Chios",
  host: "1312",
};

const invalidAccommodation = {
  name: "invalid accommodation",
  description: "nice",
  city: "Chios",
  host: "1312",
};

let validAccommodationId: string;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL_TEST!);
  const user = new UsersModel(validUser);
  await user.save();
  validAccommodation.host = user._id;
  const accommodation = new AccommodationsModel(validAccommodation);
  await accommodation.save();
  validAccommodationId = accommodation._id;
});

afterAll(async () => {
  await UsersModel.deleteMany();
  await AccommodationsModel.deleteMany();
  await mongoose.connection.close();
});

let accessToken: string;

describe("Testing USER APIs", () => {
  it("Should test that POST /users with an invalid user returns a 400", async () => {
    await client.post("/users").send(invalidUser).expect(400);
  });

  it("Should test that POST/users/login with correct credentials will return a JWT token", async () => {
    const response = await client.post("/users/login").send(validUser);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("accessToken");
    accessToken = response.body.accessToken;
  });
  it("Should test that POST /users/register with existing user will return 400 (email already exists in db)", async () => {
    const response = await client.post("/users/register").send(validUser);
    expect(response.status).toBe(400);
  });

  it("Should test that POST /users/register with existing user credentials will return a token", async () => {
    const response = await client
      .post("/users/register")
      .send(validUserNotInDb);
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("accessToken");
    accessToken = response.body.accessToken;
  });

  it("Should test that GET /users/me returns 401 forbidden, if you don't provide a valid accessToken", async () => {
    await client.get("/users/me").expect(401);
  });

  it("Should test that GET /users/me with correct credentials and access token will return the valid user", async () => {
    const response = await client
      .get("/users/me")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(response.status).toBe(200);
    console.log(response.body);
  });
});

describe("Testing Accommodations APIs", () => {
  it("Should return all accommodations if you use valid credentials", async () => {
    const response = await client
      .get("/accommodations")
      .set("Authorization", `Bearer ${accessToken}`);
    // console.log(response);
    expect(response.status).toBe(200);
  });

  it("Should test that GET /accommodations returns 401 if you don't provide a valid accessToken", async () => {
    await client.get("/accommodations").expect(401);
  });

  it("Should test that GET /accommodations/:accommodationId with an existing id returns the accommodation that matched the id from params", async () => {
    const response = await client
      .get(`/accommodations/${validAccommodationId.toString()}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
  });

  it("Should test that GET /:accommodationId with an invalid id returns 404", async () => {
    await client
      .get("/accommodations/123456789123456789123456")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(404);
  });
});
