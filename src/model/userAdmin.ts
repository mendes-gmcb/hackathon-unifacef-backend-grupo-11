import mongoose, { Document } from "mongoose";
import Authservice from "@src/services/authService";

export interface UserAdmin {
  _id?: string;
  nm_adm: string;
  email: string;
  password: string;
}

export enum CUSTOM_VALIDATION {
  DUPLICATED = "DUPLICATED",
}

interface UserAdminModel extends Omit<UserAdmin, "_id">, Document {}

const schema = new mongoose.Schema(
  {
    nm_adm: { type: String, required: true },
    email: { type: String, required: true, unique: true},
    password: { type: String, required: true }
  },
  {
    toJSON: {
      transform: (_, ret): void => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

schema.path("email").validate(
  async (email: string) => {
    const emailCount = await mongoose.models.UserAdmin.countDocuments({ email });
    return !emailCount;
  },
  "already exists in the database.",
  CUSTOM_VALIDATION.DUPLICATED
);


schema.pre<UserAdminModel>("save", async function (): Promise<void> {
  if (!this.password || !this.isModified("password")) {
    return;
  }

  try {
    const hashedPassword = await Authservice.hashPassword(this.password);
    this.password = hashedPassword;
  } catch (err) {
    console.error(`Erro no hash do password do usuario ${this.nm_adm}`);
    
  }
});

export const UserAdmin = mongoose.model<UserAdminModel>("UserAdmin", schema);
