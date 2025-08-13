import { UserEntity, CreateUserData, UpdateUserData } from "../entities/user.entity";

// User repository interface
export interface IUserRepository {
  // Create operations
  create(userData: CreateUserData): Promise<UserEntity>;

  // Read operations
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findMany(options?: FindManyUsersOptions): Promise<UserEntity[]>;
  count(options?: CountUsersOptions): Promise<number>;
  exists(id: string): Promise<boolean>;
  existsByEmail(email: string): Promise<boolean>;

  // Update operations
  update(id: string, userData: UpdateUserData): Promise<UserEntity>;
  updateEmailVerification(id: string, verified: boolean): Promise<UserEntity>;

  // Delete operations
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<UserEntity>;

  // Bulk operations
  createMany(usersData: CreateUserData[]): Promise<UserEntity[]>;
  updateMany(ids: string[], userData: Partial<UpdateUserData>): Promise<UserEntity[]>;
  deleteMany(ids: string[]): Promise<void>;
}

// Options for finding multiple users
export interface FindManyUsersOptions {
  limit?: number;
  offset?: number;
  sortBy?: "created_at" | "updated_at" | "name" | "email";
  sortOrder?: "asc" | "desc";
  emailVerified?: boolean;
  search?: string; // Search in name or email
  createdAfter?: Date;
  createdBefore?: Date;
}

// Options for counting users
export interface CountUsersOptions {
  emailVerified?: boolean;
  search?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

// User repository errors
export class UserRepositoryError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "UserRepositoryError";
  }
}

export class UserNotFoundError extends UserRepositoryError {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`, "USER_NOT_FOUND");
    this.name = "UserNotFoundError";
  }
}

export class UserAlreadyExistsError extends UserRepositoryError {
  constructor(email: string) {
    super(`User already exists with email: ${email}`, "USER_ALREADY_EXISTS");
    this.name = "UserAlreadyExistsError";
  }
}

export class UserValidationError extends UserRepositoryError {
  constructor(message: string) {
    super(`User validation error: ${message}`, "USER_VALIDATION_ERROR");
    this.name = "UserValidationError";
  }
}
