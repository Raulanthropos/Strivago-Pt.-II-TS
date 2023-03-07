import { Model, Document } from "mongoose";

interface User {
  email: string;
  password: string;
  role: "guest" | "host";
}

export interface UserDocument extends User, Document {}

export interface UserModel extends Model<UserDocument> {
  checkCredentials(
    email: string,
    password: string
  ): Promise<UserDocument | null>;
}
