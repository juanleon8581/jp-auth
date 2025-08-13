import { LoginDto } from "../dtos/auth/login.dto";
import { UserEntity } from "../entities/user.entity";
import { AuthRepository } from "../repositories/auth.repository";

interface LoginAuthUseCase {
  execute(dto: LoginDto): Promise<UserEntity>;
}

export class LoginAuth implements LoginAuthUseCase {
  constructor(private readonly repository: AuthRepository) {}

  async execute(dto: LoginDto): Promise<UserEntity> {
    return await this.repository.login(dto);
  }
}
