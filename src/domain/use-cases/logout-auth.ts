import { AuthRepository } from "../repositories/auth.repository";

interface LogoutAuthUseCase {
  execute(): Promise<void>;
}

export class LogoutAuth implements LogoutAuthUseCase {
  constructor(private readonly datasource: AuthRepository) {}

  async execute(): Promise<void> {
    await this.datasource.logout();
  }
}
