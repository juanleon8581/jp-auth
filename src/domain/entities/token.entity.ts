import {
  TokenType,
  TOKEN_EXPIRATION,
  ICreateTokenData,
  ITokenData,
} from '../interfaces';

// Type aliases for backward compatibility
export type CreateTokenData = ICreateTokenData;
export type TokenData = ITokenData;

// Re-export types for convenience
export { TokenType, TOKEN_EXPIRATION };

// Token entity class
export class Token {
  private constructor(
    public readonly id: string,
    public readonly user_id: string,
    public readonly type: TokenType,
    public readonly token: string,
    public readonly expires_at: Date,
    public readonly revoked: boolean,
    public readonly metadata: Record<string, any> | null,
    public readonly created_at: Date,
    public readonly updated_at: Date
  ) {}

  // Factory method to create Token from data
  static create(data: TokenData): Token {
    return new Token(
      data.id,
      data.userId,
      data.type,
      data.value,
      data.expiresAt,
      data.isRevoked,
      data.metadata,
      data.createdAt,
      data.updatedAt
    );
  }

  // Factory method to create Token from raw data
  static fromRaw(data: TokenData): Token {
    return Token.create(data);
  }

  // Factory method to create new token with appropriate expiration
  static createNew(
    data: CreateTokenData,
    id: string
  ): Omit<TokenData, "isRevoked" | "createdAt" | "updatedAt"> {
    const now = new Date();
    const expiresAt = data.expiresAt ?? Token.calculateExpiration(data.type);

    return {
      id,
      userId: data.userId,
      type: data.type,
      value: data.value,
      expiresAt,
      metadata: data.metadata || {},
    };
  }

  // Helper method to calculate expiration date based on token type
  static calculateExpiration(type: TokenType): Date {
    const now = new Date();

    switch (type) {
      case TokenType.ACCESS:
        return new Date(now.getTime() + TOKEN_EXPIRATION.ACCESS);
      case TokenType.REFRESH:
        return new Date(now.getTime() + TOKEN_EXPIRATION.REFRESH);
      case TokenType.RESET_PASSWORD:
        return new Date(now.getTime() + TOKEN_EXPIRATION.RESET_PASSWORD);
      case TokenType.EMAIL_VERIFICATION:
        return new Date(now.getTime() + TOKEN_EXPIRATION.EMAIL_VERIFICATION);
      default:
        throw new Error(`Unknown token type: ${type}`);
    }
  }

  // Convert to plain object
  toJSON(): TokenData {
    return {
      id: this.id,
      userId: this.user_id,
      type: this.type,
      value: this.token,
      expiresAt: this.expires_at,
      isRevoked: this.revoked,
      metadata: this.metadata ?? {},
      createdAt: this.created_at,
      updatedAt: this.updated_at,
    };
  }

  // Check if token is valid (not expired and not revoked)
  isValid(): boolean {
    return !this.revoked && !this.isExpired();
  }

  // Check if token is expired
  isExpired(): boolean {
    return new Date() > this.expires_at;
  }

  // Check if token is revoked
  isRevoked(): boolean {
    return this.revoked;
  }

  // Revoke token
  revoke(): Token {
    return new Token(
      this.id,
      this.user_id,
      this.type,
      this.token,
      this.expires_at,
      true, // revoked
      this.metadata,
      this.created_at,
      new Date() // updated_at
    );
  }

  // Get time until expiration in minutes
  getTimeUntilExpirationMinutes(): number {
    const now = new Date();
    const diffMs = this.expires_at.getTime() - now.getTime();
    return Math.max(0, Math.floor(diffMs / (60 * 1000)));
  }

  // Check if token belongs to user
  belongsToUser(userId: string): boolean {
    return this.user_id === userId;
  }

  // Check if token is of specific type
  isOfType(type: TokenType): boolean {
    return this.type === type;
  }

  // Update metadata
  updateMetadata(metadata: Record<string, any>): Token {
    return new Token(
      this.id,
      this.user_id,
      this.type,
      this.token,
      this.expires_at,
      this.revoked,
      { ...this.metadata, ...metadata },
      this.created_at,
      new Date()
    );
  }

  // Check if token should be cleaned up (expired and old)
  shouldCleanup(cleanupAfterHours: number = 24): boolean {
    if (!this.isExpired()) {
      return false;
    }

    const cleanupAfterMs = cleanupAfterHours * 60 * 60 * 1000;
    const cleanupTime = new Date(this.expires_at.getTime() + cleanupAfterMs);

    return new Date() > cleanupTime;
  }
}
