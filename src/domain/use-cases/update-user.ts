import { UpdateUserDto } from "../dtos/auth/update.dto";
import { UserEntity } from "../entities/user.entity";
import { AuthRepository } from "../repositories/auth.repository";

interface UpdateUserUseCase {
  execute(dto: UpdateUserDto): Promise<UserEntity>;
}

export class UpdateUser implements UpdateUserUseCase {
  constructor(private readonly repository: AuthRepository) {}

  execute(dto: UpdateUserDto): Promise<UserEntity> {
    return this.repository.updateUser(dto);
  }
}