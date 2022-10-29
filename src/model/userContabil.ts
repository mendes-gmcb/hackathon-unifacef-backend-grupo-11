import mongoose, { Document } from "mongoose";
import Authservice from "@src/services/authService";

export interface UserContabil {
  _id?: string;
  name_repre: string;
  email: string;
  password: string;
  cnpj: string;
  razao_social: string;
  crc: string;
}

export enum CUSTOM_VALIDATION {
  DUPLICATED = "DUPLICATED",
}

interface UserContabilModel extends Omit<UserContabil, "_id">, Document {}

const schema = new mongoose.Schema(
  {
    name_repre: { type: String, required: true },
    email: { type: String, required: true},
    password: { type: String, required: true },
    cnpj: { type: String, required: true, unique: true },
    razao_social: { type: String, required: true },
    crc: { type: String, required: true },
    active: { type: Number, required: true}
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

schema.path("cnpj").validate(
  async (cnpj: string) => {
    const cnpjCount = await mongoose.models.UserContabil.countDocuments({ cnpj });
    return !cnpjCount;
  },
  "already exists in the database.",
  CUSTOM_VALIDATION.DUPLICATED
);


schema.pre<UserContabilModel>("save", async function (): Promise<void> {
  if (!this.password || !this.isModified("password")) {
    return;
  }

  try {
    const hashedPassword = await Authservice.hashPassword(this.password);
    this.password = hashedPassword;
  } catch (err) {
    console.error(`Erro no hash do password do usuario ${this.name_repre}`);
    
  }
});

export const UserContabil = mongoose.model<UserContabilModel>("UserContabil", schema);
