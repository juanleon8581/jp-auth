import { LoginDto } from "@/domain/dtos/auth/login.dto";
import { RegisterDto } from "@/domain/dtos/auth/register.dto";
import { ResetPasswordDto } from "@/domain/dtos/auth/resetPassword.dto";
import { UpdateUserDto } from "@/domain/dtos/auth/update.dto";
import { UserEntity } from "@/domain/entities/user.entity";
import { AuthRepository } from "@/domain/repositories/auth.repository";
import { supabase } from "@/infrastructure/config/supabase.client";

export class AuthDatasource implements AuthRepository {
  constructor(private readonly authProvider = supabase) {}
  register(dto: RegisterDto): Promise<UserEntity> {
    throw new Error("Method not implemented.");
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
