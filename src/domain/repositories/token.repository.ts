import { TokenEntity, CreateTokenData, TokenType } from "../entities/token.entity";

// Token repository interface
export interface ITokenRepository {
  // Create operations
  create(tokenData: CreateTokenData, id: string): Promise<TokenEntity>;

  // Read operations
  findById(id: string): Promise<TokenEntity | null>;
  findByToken(token: string): Promise<TokenEntity | null>;
  findByUserId(userId: string, type?: TokenType): Promise<TokenEntity[]>;
  findValidByUserId(userId: string, type?: TokenType): Promise<TokenEntity[]>;
  findMany(options?: FindManyTokensOptions): Promise<TokenEntity[]>;
  count(options?: CountTokensOptions): Promise<number>;
  exists(id: string): Promise<boolean>;

  // Update operations
  revoke(id: string): Promise<TokenEntity>;
  revokeByToken(token: string): Promise<TokenEntity>;
  revokeAllByUserId(userId: string, type?: TokenType): Promise<number>; // Returns count of revoked tokens
  updateMetadata(id: string, metadata: Record<string, any>): Promise<TokenEntity>;

  // Delete operations
  delete(id: string): Promise<void>;
  deleteByToken(token: string): Promise<void>;
  deleteExpired(): Promise<number>; // Returns count of deleted tokens
  deleteRevokedOlderThan(hours: number): Promise<number>;

  // Validation operations
  validateToken(token: string, type?: TokenType): Promise<TokenEntity | null>;
  isTokenValid(token: string): Promise<boolean>;

  // Cleanup operations
  cleanupExpiredTokens(): Promise<number>;
  cleanupRevokedTokens(olderThanHours?: number): Promise<number>;
}

// Options for finding multiple tokens
export interface FindManyTokensOptions {
  limit?: number;
  offset?: number;
  sortBy?: "created_at" | "updated_at" | "expires_at";
  sortOrder?: "asc" | "desc";
  userId?: string;
  type?: TokenType;
  revoked?: boolean;
  expired?: boolean;
  valid?: boolean; // Not revoked and not expired
  createdAfter?: Date;
  createdBefore?: Date;
  expiresAfter?: Date;
  expiresBefore?: Date;
}

// Options for counting tokens
export interface CountTokensOptions {
  userId?: string;
  type?: TokenType;
  revoked?: boolean;
  expired?: boolean;
  valid?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  expiresAfter?: Date;
  expiresBefore?: Date;
}

// Token repository errors
export class TokenRepositoryError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "TokenRepositoryError";
  }
}

export class TokenNotFoundError extends TokenRepositoryError {
  constructor(identifier: string) {
    super(`Token not found: ${identifier}`, "TOKEN_NOT_FOUND");
    this.name = "TokenNotFoundError";
  }
}

export class InvalidTokenError extends TokenRepositoryError {
  constructor(reason: string) {
    super(`Invalid token: ${reason}`, "INVALID_TOKEN");
    this.name = "InvalidTokenError";
  }
}

export class ExpiredTokenError extends TokenRepositoryError {
  constructor(tokenId: string) {
    super(`Token has expired: ${tokenId}`, "EXPIRED_TOKEN");
    this.name = "ExpiredTokenError";
  }
}

export class RevokedTokenError extends TokenRepositoryError {
  constructor(tokenId: string) {
    super(`Token has been revoked: ${tokenId}`, "REVOKED_TOKEN");
    this.name = "RevokedTokenError";
  }
}

export class TokenValidationError extends TokenRepositoryError {
  constructor(message: string) {
    super(`Token validation error: ${message}`, "TOKEN_VALIDATION_ERROR");
    this.name = "TokenValidationError";
  }
}

export class TokenTypeError extends TokenRepositoryError {
  constructor(expected: TokenType, actual: TokenType) {
    super(
      `Expected token type '${expected}', but got '${actual}'`,
      "TOKEN_TYPE_ERROR"
    );
    this.name = "TokenTypeError";
  }
}
