import mongoose, { model } from "mongoose";
import bcrypt from "bcrypt";
import { UserDocument, UserModel } from "./types";

const { Schema } = mongoose;

const usersSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    //if I want to implement google OAuth, then the password won't be required
    //because google doesn't share the password with us when performing OAuth
    role: { type: String, enum: ["host", "guest"], default: "guest" },
  },
  {
    timestamps: true,
  }
);

usersSchema.pre("save", async function (next) {
  const currentUser = this;
  if (currentUser.isModified("password")) {
    const plainPassword = currentUser.password;
    currentUser.password = await bcrypt.hash(plainPassword, 10);
  }

  next();
});

usersSchema.methods.toJSON = function () {
  const usersMongoDoc = this;
  const user = usersMongoDoc.toObject();
  delete user.password;
  delete user.__v;
  delete user.createdAt;
  delete user.updatedAt;
  return user;
};

usersSchema.static(
  "checkCredentials",
  async function (email: string, password: string) {
    const user: UserDocument = await this.findOne({ email });

    if (user) {
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch) {
        return user;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }
);

export default model<UserDocument, UserModel>("User", usersSchema);
