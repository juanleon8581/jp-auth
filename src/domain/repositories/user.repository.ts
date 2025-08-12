import { User, CreateUserData, UpdateUserData } from "../entities/user.entity";

// User repository interface
export interface IUserRepository {
  // Create operations
  create(userData: CreateUserData): Promise<User>;

  // Read operations
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findMany(options?: FindManyUsersOptions): Promise<User[]>;
  count(options?: CountUsersOptions): Promise<number>;
  exists(id: string): Promise<boolean>;
  existsByEmail(email: string): Promise<boolean>;

  // Update operations
  update(id: string, userData: UpdateUserData): Promise<User>;
  updateEmailVerification(id: string, verified: boolean): Promise<User>;

  // Delete operations
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<User>;

  // Bulk operations
  createMany(usersData: CreateUserData[]): Promise<User[]>;
  updateMany(ids: string[], userData: Partial<UpdateUserData>): Promise<User[]>;
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
