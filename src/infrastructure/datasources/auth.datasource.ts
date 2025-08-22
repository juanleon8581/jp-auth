import { LoginDto } from "@/domain/dtos/auth/login.dto";
import { RegisterDto } from "@/domain/dtos/auth/register.dto";
import { ResetPasswordDto } from "@/domain/dtos/auth/resetPassword.dto";
import { UpdateUserDto } from "@/domain/dtos/auth/update.dto";
import { UserEntity } from "@/domain/entities/user.entity";
import { AuthRepository } from "@/domain/repositories/auth.repository";
import { supabase } from "@/infrastructure/config/supabase.client";

export class AuthDatasource implements AuthRepository {
  constructor(private readonly authProvider = supabase) {}
  async register(dto: RegisterDto): Promise<UserEntity> {
    const { data, error } = await this.authProvider.auth.signUp({
      email: dto.email,
      password: dto.password,
    });
    if (error) throw error;
    if (!data.user) throw new Error("User not created");
    const user = UserEntity.create({
      id: data.user.id,
      email: data.user.email!,
      name: dto.name,
      email_verified: false,
    });
    return user;
  }
  login(dto: LoginDto): Promise<UserEntity> {
    throw new Error("Method not implemented.");
  }
  logout(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  updateUser(dto: UpdateUserDto): Promise<UserEntity> {
    throw new Error("Method not implemented.");
  }
  resetPassword(dto: ResetPasswordDto): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
