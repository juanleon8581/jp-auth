// Token domain interfaces and types with 'I' prefix convention

// Token types enum
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
  RESET_PASSWORD = 'reset_password',
  EMAIL_VERIFICATION = 'email_verification',
}

// Token expiration constants (in milliseconds)
export const TOKEN_EXPIRATION = {
  ACCESS: 15 * 60 * 1000, // 15 minutes
  REFRESH: 7 * 24 * 60 * 60 * 1000, // 7 days
  RESET_PASSWORD: 60 * 60 * 1000, // 1 hour
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000, // 24 hours
} as const;

export interface ICreateTokenData {
  userId: string;
  type: TokenType;
  value: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface ITokenData {
  id: string;
  userId: string;
  type: TokenType;
  value: string;
  expiresAt: Date;
  isRevoked: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}