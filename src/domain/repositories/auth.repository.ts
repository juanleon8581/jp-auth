import { LoginDto } from "../dtos/auth/login.dto";
import { RegisterDto } from "../dtos/auth/register.dto";
import { ResetPasswordDto } from "../dtos/auth/resetPassword.dto";
import { UpdateUserDto } from "../dtos/auth/update.dto";
import { UserEntity } from "../entities/user.entity";

export abstract class AuthRepository {
  abstract register(dto: RegisterDto): Promise<UserEntity>;
  abstract login(dto: LoginDto): Promise<UserEntity>;
  abstract logout(): Promise<void>;
  abstract updateUser(dto: UpdateUserDto): Promise<UserEntity>;
  abstract resetPassword(dto: ResetPasswordDto): Promise<void>;
}
