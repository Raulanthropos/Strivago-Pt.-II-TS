import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { UserDocument, UsersModel } from "./types";

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["Host", "Guest"], default: "Guest" },
    refreshToken: { type: String },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  const currentUser = this;
  if (currentUser.isModified("password")) {
    const plainPW = currentUser.password;

    const hash = await bcrypt.hash(plainPW, 11);
    currentUser.password = hash;
  }

  next();
});

userSchema.methods.toJSON = function () {
  const user = this.toObject();

  delete user.password;
  delete user.createdAt;
  delete user.updatedAt;
  delete user.__v;
  delete user.refreshToken;

  return user;
};

userSchema.static("checkCredentials", async function (email, password) {
  const user = await this.findOne({ email });

  if (user) {
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      return user;
    } else {
      return null;
    }
  } else {
    return null;
  }
});

export default model<UserDocument, UsersModel>("User", userSchema);