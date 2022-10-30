import { Controller, Delete, Get, Post, Put } from "@overnightjs/core";
import { Request, Response } from "express";
import AuthService from "@src/services/authService";
import { BaseController } from ".";
import { UserAdmin } from "@src/model/userAdmin";


@Controller("userAdmin")
export class UserAdminController extends BaseController {

  @Get(":id")
  public async get(
    req: Request,
    res: Response
  ): Promise<Response | undefined> {
    // rota para pegar o id do usuário
    const { id } = req.params; 
    console.log(id)
    const user = await UserAdmin.findById(id);

    if (!user) {
      return res
        .status(401)
        .send({ code: 401, message: "Usuario não encontrado" });
    }

    return res.status(200).send({ user });
  }
  // mesmo com necessidade de extender o extender o base Controller
  @Post("/")
  public async create(req: Request, res: Response): Promise<void> {
    // rota para criar novo usuario
    try {
      console.log(req.body)
      const userAdmin = new UserAdmin(req.body);
      const newUser = await userAdmin.save();
      res.status(201).send(newUser);
    } catch (e) {
      this.sendCreateUpdateErrorResponse(res, e);
    }
  }

  @Delete("delete/:id")
  public async delete(
    req: Request,
    res: Response
  ): Promise<Response> {
      const { id } = req.params;
    await UserAdmin.deleteOne({ id: id });
    return res.status(200).send({ id: id });
  }

  @Put("update/:id")
  public async update(req: Request, res: Response): Promise<void> {
    // rota para atualizar um usuário
    try {
      const { id } = req.params;
      const userAdmin = await UserAdmin.findByIdAndUpdate(id, req.body);
      res.status(201).send(userAdmin);
    } catch (e) {
      this.sendCreateUpdateErrorResponse(res, e);
    }
  }

  @Post("authenticate")
  public async authenticate(
    req: Request,
    res: Response
  ): Promise<Response | undefined> {
    const { email, password } = req.body;
    const user = await UserAdmin.findOne({ email: email });
    // caso exista o email retorna os dados
    // caso não null

    if (!user)
      return res
        .status(401)
        .send({ code: 401, message: "Email não encontrado" });
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
