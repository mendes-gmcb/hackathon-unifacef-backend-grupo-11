import { Controller, Delete, Post } from "@overnightjs/core";
import { Request, Response } from "express";
import AuthService from "@src/services/authService";
import { BaseController } from ".";
import { UserContabil } from "@src/model/userContabil";

@Controller("usersContabil")
export class UsersContabilController extends BaseController {
  // mesmo com necessidade de extender o extender o base Controller
  @Post("")
  public async create(req: Request, res: Response): Promise<void> {
    // rota para criar novo usuario
    try {
      const userContabil = new UserContabil(req.body);
      const newUser = await userContabil.save();
      res.status(201).send(newUser);
    } catch (e) {
      this.sendCreateUpdateErrorResponse(res, e);
    }
  }

  @Delete("delete")
  public async delete(
    req: Request,
    res: Response
  ): Promise<void> {
  }

  @Post("authenticate")
  public async authenticate(
    req: Request,
    res: Response
  ): Promise<Response | undefined> {
    const { cnpj, password } = req.body;
    const user = await UserContabil.findOne({ cnpj: cnpj });
    // caso exista o email retorna os dados
    // caso não null

    if (!user)
      return res
        .status(401)
        .send({ code: 401, message: "CNPJ não encontrado" });
    // retorna usuario não encontrada caso não encontre a conta
    else if (!(await AuthService.comparePassword(password, user.password))) {
      return res.status(401).send({ code: 401, message: "senha não coincide" });
      // caso a senha não bata com a guardada retorna a senha não bate
    }

    const token = AuthService.generateToken(user.toJSON());
    // caso as validações anteriores passem
    // gera um novo token
    return res.status(200).send({ user: user.email, token: token });
  }
}
