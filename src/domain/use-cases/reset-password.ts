import { ResetPasswordDto } from "../dtos/auth/resetPassword.dto";
import { AuthRepository } from "../repositories/auth.repository";

interface ResetPasswordUseCase {
  execute(dto: ResetPasswordDto): Promise<void>;
}

export class ResetPassword implements ResetPasswordUseCase {
  constructor(private readonly repository: AuthRepository) {}

  execute(dto: ResetPasswordDto): Promise<void> {
    return this.repository.resetPassword(dto);
  }
}