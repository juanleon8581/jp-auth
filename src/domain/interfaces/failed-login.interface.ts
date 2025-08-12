// FailedLogin domain interfaces with 'I' prefix convention

export interface ICreateFailedLoginData {
  userId: string;
  ipAddress: string;
  userAgent?: string;
  attemptedAt?: Date;
  metadata?: Record<string, any>;
}

export interface IUpdateFailedLoginData {
  attempts?: number;
  lastAttemptAt?: Date;
  lockedUntil?: Date;
  metadata?: Record<string, any>;
}

export interface IFailedLoginData {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent?: string;
  attempts: number;
  lastAttemptAt: Date;
  lockedUntil?: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}