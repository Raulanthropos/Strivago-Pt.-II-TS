import { Model, Document } from "mongoose";

export interface User {
  email: string;
  password: string;
  role: "Host" | "Guest";
  refreshToken: string;
}

export interface UserDocument extends User, Document {}

export interface UsersModel extends Model<UserDocument> {
  checkCredentials(
    email: string,
    plainPassword: string
  ): Promise<UserDocument | null>;
}