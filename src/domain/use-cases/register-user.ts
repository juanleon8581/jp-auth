import { RegisterDto } from "../dtos/auth/register.dto";
import { UserEntity } from "../entities/user.entity";
import { AuthRepository } from "../repositories/auth.repository";

interface RegisterUserUseCase {
  execute(dto: RegisterDto): Promise<UserEntity>;
}

export class RegisterUser implements RegisterUserUseCase {
  constructor(private readonly repository: AuthRepository) {}

  execute(dto: RegisterDto): Promise<UserEntity> {
    return this.repository.register(dto);
  }
}