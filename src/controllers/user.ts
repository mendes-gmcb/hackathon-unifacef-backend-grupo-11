import { Controller, Delete, Get, Post, Put } from "@overnightjs/core";
import { Request, Response } from "express";
import { User } from "@src/model/user";
import AuthService from "@src/services/authService";
import { BaseController } from ".";

@Controller("users")
export class UsersController extends BaseController {
  // mesmo com necessidade de extender o extender o base Controller
  @Post("")
  public async create(req: Request, res: Response): Promise<void> {
    // rota para criar novo usuario
    try {
      req.body.cnpj = await req.body.cnpj.replace(/[^0-9]/g, "");

      const user = new User(req.body);
      const newUser = await user.save();
      res.status(201).send(newUser);
    } catch (e) {
      this.sendCreateUpdateErrorResponse(res, e);
    }
  }

  @Get("get/:cnpj")
  public async get(
    req: Request,
    res: Response
  ): Promise<Response | undefined> {
    // rota para pegar o id do usuário
    const { cnpj } = req.params; 

    const user = await User.findOne({ cnpj: cnpj });

    if (!user) {
      return res
        .status(401)
        .send({ code: 401, message: "Usuario não encontrado" });
    }

    user.cnpj = user.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");

    return res.status(200).send({ user });
  }

  @Put("update/:id")
  public async update(req: Request, res: Response): Promise<Response | undefined> {
    // rota para atualizar um usuário
    try {
      const { id } = req.params;
      const { name, password } = req.body;

      if (password) {
        try {
          const hashedPassword = await AuthService.hashPassword(password);
          req.body.password = hashedPassword;
        } catch (err) {
          console.error(`Erro no hash do password do usuario ${name}`);
          // @TODO ERRO
        }
      }    

      try {
        let user = await User.findByIdAndUpdate(id, req.body);
        user = await User.findById(id);

        if (!user) {
          return res.status(401).send({code: 401, message: "Usuário não encontrado"});
        }

        user.cnpj = user.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  
        return res.status(201).send(user);
      } catch (e) {
        return res
          .status(401)
          .send({ code: 401, message: "Usuario não encontrado"});
      }
    } catch (e) {
      this.sendCreateUpdateErrorResponse(res, e);
      return;
    }
  }

  @Delete("delete/:id")
  public async delete(req: Request, res: Response): Promise<Response | undefined> {
    // rota para excluir um usuário
    try {
      const { id } = req.params;
      const user = await User.deleteOne({ id: id });
      return res.status(201).send(user);
    } catch (e) {
      this.SendErrorResponse(res, e);
      return;
    }
  }

  @Post("authenticate")
  public async authenticate(
    req: Request,
    res: Response
  ): Promise<Response | undefined> {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    // caso exista o email retorna os dados
    // caso não null

    if (!user)
      return res
        .status(401)
        .send({ code: 401, message: "Usuario não encontrado" });
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
