import {
  FailedLogin,
  CreateFailedLoginData,
} from "../entities/failed-login.entity";

// FailedLogin repository interface
export interface IFailedLoginRepository {
  // Create operations
  create(data: CreateFailedLoginData): Promise<FailedLogin>;

  // Read operations
  findById(id: number): Promise<FailedLogin | null>;
  findByEmailAndIp(
    email: string,
    ipAddress: string
  ): Promise<FailedLogin | null>;
  findByEmail(email: string): Promise<FailedLogin[]>;
  findByIp(ipAddress: string): Promise<FailedLogin[]>;
  findMany(options?: FindManyFailedLoginsOptions): Promise<FailedLogin[]>;
  count(options?: CountFailedLoginsOptions): Promise<number>;

  // Update operations
  incrementAttempts(email: string, ipAddress: string): Promise<FailedLogin>;
  resetAttempts(email: string, ipAddress: string): Promise<void>;

  // Delete operations
  delete(id: number): Promise<void>;
  deleteByEmail(email: string): Promise<void>;
  deleteByIp(ipAddress: string): Promise<void>;
  deleteExpired(): Promise<number>; // Returns count of deleted records

  // Security operations
  isAccountLocked(email: string, ipAddress: string): Promise<boolean>;
  getRemainingLockoutTime(email: string, ipAddress: string): Promise<number>; // in minutes
  getFailedAttempts(email: string, ipAddress: string): Promise<number>;

  // Cleanup operations
  cleanupOldRecords(olderThanHours?: number): Promise<number>;
}

// Options for finding multiple failed logins
export interface FindManyFailedLoginsOptions {
  limit?: number;
  offset?: number;
  sortBy?: "created_at" | "updated_at" | "last_attempt" | "attempts";
  sortOrder?: "asc" | "desc";
  email?: string;
  ipAddress?: string;
  minAttempts?: number;
  maxAttempts?: number;
  lockedOnly?: boolean; // Only return locked accounts
  createdAfter?: Date;
  createdBefore?: Date;
  lastAttemptAfter?: Date;
  lastAttemptBefore?: Date;
}

// Options for counting failed logins
export interface CountFailedLoginsOptions {
  email?: string;
  ipAddress?: string;
  minAttempts?: number;
  maxAttempts?: number;
  lockedOnly?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  lastAttemptAfter?: Date;
  lastAttemptBefore?: Date;
}

// Failed login repository errors
export class FailedLoginRepositoryError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "FailedLoginRepositoryError";
  }
}

export class FailedLoginNotFoundError extends FailedLoginRepositoryError {
  constructor(identifier: string) {
    super(
      `Failed login record not found: ${identifier}`,
      "FAILED_LOGIN_NOT_FOUND"
    );
    this.name = "FailedLoginNotFoundError";
  }
}

export class AccountLockedError extends FailedLoginRepositoryError {
  constructor(email: string, remainingMinutes: number) {
    super(
      `Account locked for email ${email}. Try again in ${remainingMinutes} minutes.`,
      "ACCOUNT_LOCKED"
    );
    this.name = "AccountLockedError";
  }
}

export class FailedLoginValidationError extends FailedLoginRepositoryError {
  constructor(message: string) {
    super(
      `Failed login validation error: ${message}`,
      "FAILED_LOGIN_VALIDATION_ERROR"
    );
    this.name = "FailedLoginValidationError";
  }
}

export class TooManyAttemptsError extends FailedLoginRepositoryError {
  constructor(
    email: string,
    ipAddress: string,
    attempts: number,
    maxAttempts: number
  ) {
    super(
      `Too many failed attempts for ${email} from ${ipAddress}. ${attempts}/${maxAttempts} attempts used.`,
      "TOO_MANY_ATTEMPTS"
    );
    this.name = "TooManyAttemptsError";
  }
}
