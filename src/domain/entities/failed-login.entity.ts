import {
  ICreateFailedLoginData,
  IUpdateFailedLoginData,
  IFailedLoginData,
} from '../interfaces/failed-login.interface';

// Type aliases for backward compatibility
export type CreateFailedLoginData = ICreateFailedLoginData;
export type UpdateFailedLoginData = IUpdateFailedLoginData;
export type FailedLoginData = IFailedLoginData;

// Constants for failed login management
export const FAILED_LOGIN_CONSTANTS = {
  MAX_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 30,
  CLEANUP_AFTER_DAYS: 30,
} as const;

// FailedLogin entity class
export class FailedLogin {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly ipAddress: string,
    public readonly attempts: number,
    public readonly lastAttemptAt: Date,
    public readonly metadata: Record<string, any>,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly userAgent?: string,
    public readonly lockedUntil?: Date
  ) {}

  // Factory method to create FailedLogin from data
  static create(data: FailedLoginData): FailedLogin {
    return new FailedLogin(
      data.id,
      data.userId,
      data.ipAddress,
      data.attempts,
      data.lastAttemptAt,
      data.metadata,
      data.createdAt,
      data.updatedAt,
      data.userAgent,
      data.lockedUntil
    );
  }

  // Factory method to create FailedLogin from raw data
  static fromRaw(data: FailedLoginData): FailedLogin {
    return FailedLogin.create(data);
  }

  // Factory method to create new failed login record
  static createNew(data: CreateFailedLoginData): Omit<FailedLoginData, "id"> {
    const now = new Date();

    return {
      userId: data.userId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      attempts: 1,
      lastAttemptAt: data.attemptedAt ?? now,
      lockedUntil: undefined,
      metadata: data.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    };
  }

  // Convert to plain object
  toJSON(): FailedLoginData {
    return {
      id: this.id,
      userId: this.userId,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      attempts: this.attempts,
      lastAttemptAt: this.lastAttemptAt,
      lockedUntil: this.lockedUntil,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Increment failed attempts
  incrementAttempts(): FailedLogin {
    return new FailedLogin(
      this.id,
      this.userId,
      this.ipAddress,
      this.attempts + 1,
      new Date(), // lastAttemptAt
      this.metadata,
      this.createdAt,
      new Date(), // updatedAt
      this.userAgent,
      this.lockedUntil
    );
  }

  // Check if account should be locked
  shouldLockAccount(): boolean {
    return this.attempts >= FAILED_LOGIN_CONSTANTS.MAX_ATTEMPTS;
  }

  // Check if lockout period has expired
  isLockoutExpired(): boolean {
    if (!this.shouldLockAccount()) {
      return true; // Not locked
    }

    const lockoutDurationMs =
      FAILED_LOGIN_CONSTANTS.LOCKOUT_DURATION_MINUTES * 60 * 1000;
    const lockoutExpiry = new Date(
      this.lastAttemptAt.getTime() + lockoutDurationMs
    );

    return new Date() > lockoutExpiry;
  }

  // Get remaining lockout time in minutes
  getRemainingLockoutMinutes(): number {
    if (!this.shouldLockAccount() || this.isLockoutExpired()) {
      return 0;
    }

    const lockoutDurationMs =
      FAILED_LOGIN_CONSTANTS.LOCKOUT_DURATION_MINUTES * 60 * 1000;
    const lockoutExpiry = new Date(
      this.lastAttemptAt.getTime() + lockoutDurationMs
    );
    const remainingMs = lockoutExpiry.getTime() - new Date().getTime();

    return Math.ceil(remainingMs / (60 * 1000));
  }

  // Check if record should be cleaned up
  shouldCleanup(): boolean {
    const cleanupAfterMs =
      FAILED_LOGIN_CONSTANTS.CLEANUP_AFTER_DAYS * 24 * 60 * 60 * 1000;
    const cleanupTime = new Date(this.lastAttemptAt.getTime() + cleanupAfterMs);

    return new Date() > cleanupTime;
  }

  // Reset attempts (after successful login)
  reset(): FailedLogin {
    return new FailedLogin(
      this.id,
      this.userId,
      this.ipAddress,
      0,
      this.lastAttemptAt,
      this.metadata,
      this.createdAt,
      new Date(),
      this.userAgent,
      undefined
    );
  }

  // Get attempts remaining before lockout
  getAttemptsRemaining(): number {
    return Math.max(0, FAILED_LOGIN_CONSTANTS.MAX_ATTEMPTS - this.attempts);
  }
}
