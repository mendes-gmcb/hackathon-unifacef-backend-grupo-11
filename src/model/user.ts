import mongoose, { Document } from "mongoose";
import Authservice from "@src/services/authService";

export interface User {
  _id?: string;
  name?: string;
  email?: string;
  password: string;
  cnpj: string;
  razao_social?: string;
  termos?: boolean;
  whatsapp?: string;
  userContabilId: string;
}

export enum CUSTOM_VALIDATION {
  DUPLICATED = "DUPLICATED",
}

interface UserModel extends Omit<User, "_id">, Document {}

const schema = new mongoose.Schema(
  {
    name: { type: String, required: false },
    email: { type: String, required: false },
    password: { type: String, required: false },
    cnpj: { type: String, required: true },
    razao_social: { type: String, required: true },
    termos: { type: Boolean, required: true, default: false },
    whatsapp: { type: String, required: false },
    userContabilId: { type: String, required: true }
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
    const emailCount = await mongoose.models.User.countDocuments({ email });
    return !emailCount;
  },
  "already exists in the database.",
  CUSTOM_VALIDATION.DUPLICATED
);

schema.path("cnpj").validate(
  async (cnpj: string) => {
    const cnpjCount = await mongoose.models.User.countDocuments({ cnpj });
    return !cnpjCount;
  },
  "already exists in the database.",
  CUSTOM_VALIDATION.DUPLICATED
);

schema.path("razao_social").validate(
  async (razao_social: string) => {
    const razaoSocialCount = await mongoose.models.User.countDocuments({ razao_social });
    return !razaoSocialCount;
  },
  "already exists in the database.",
  CUSTOM_VALIDATION.DUPLICATED
);

// trás o erro da informação duplicada para a camada do mongoose
// fazendo ele parar de retornar um erro diretamenta do MongoDB
schema.pre<UserModel>("save", async function (): Promise<void> {
  if (!this.password || !this.isModified("password")) {
    return;
  }

  try {
    const hashedPassword = await Authservice.hashPassword(this.password);
    this.password = hashedPassword;
  } catch (err) {
    console.error(`Erro no hash do password do usuario ${this.name}`);
    // @TODO ERRO
  }
});

export const User = mongoose.model<UserModel>("User", schema);
