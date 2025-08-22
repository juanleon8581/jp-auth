import { AuthRepository } from "@/domain/repositories/auth.repository";
import { RegisterUser } from "@/domain/use-cases/register-user";
import { RegisterValidator } from "@/infrastructure/validators/auth/register.validator";
import { Request, Response } from "express";

export class AuthController {
  constructor(private readonly repository: AuthRepository) {}

  public async register(req: Request, res: Response) {
    const [error, registerDto] = RegisterValidator.validate(req.body);
    if (error) {
      return res.status(400).json({ error });
    }

    new RegisterUser(this.repository)
      .execute(registerDto!)
      .then((user) => res.json(user))
      .catch((error) => {
        res.status(400).json({ error });
      });
  }
}
