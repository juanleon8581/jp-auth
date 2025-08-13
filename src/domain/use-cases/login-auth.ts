import { LoginDto } from "../dtos/auth/login.dto";
import { UserEntity } from "../entities/user.entity";
import { AuthRepository } from "../repositories/auth.repository";

interface LoginAuthUseCase {
  execute(dto: LoginDto): Promise<UserEntity>;
}

export class LoginAuth implements LoginAuthUseCase {
  constructor(private readonly repository: AuthRepository) {}

  execute(dto: LoginDto): Promise<UserEntity> {
    return this.repository.login(dto);
  }
}
