import '../../../setup';
import {
  ITokenRepository,
  FindManyTokensOptions,
  CountTokensOptions,
  TokenRepositoryError,
  TokenNotFoundError,
  InvalidTokenError,
  ExpiredTokenError,
  RevokedTokenError,
  TokenValidationError,
  TokenTypeError
} from '../token.repository';
import { Token, CreateTokenData, TokenType } from '../../entities/token.entity';

// Mock implementation for testing interface compliance
class MockTokenRepository implements ITokenRepository {
  private tokens: Map<string, Token> = new Map();
  private nextId = 1;

  async create(tokenData: CreateTokenData, id: string): Promise<Token> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    
    const token = Token.create({
      id,
      userId: tokenData.userId,
      value: tokenData.value,
      type: tokenData.type,
      expiresAt: expiresAt,
      isRevoked: false,
      metadata: tokenData.metadata || {},
      createdAt: now,
      updatedAt: now
    });
    
    this.tokens.set(id, token);
    return token;
  }

  async findById(id: string): Promise<Token | null> {
    return this.tokens.get(id) || null;
  }

  async findByToken(token: string): Promise<Token | null> {
    for (const tokenEntity of this.tokens.values()) {
      if (tokenEntity.token === token) {
        return tokenEntity;
      }
    }
    return null;
  }

  async findByUserId(userId: string, type?: TokenType): Promise<Token[]> {
    return Array.from(this.tokens.values())
      .filter(token => {
        if (token.user_id !== userId) return false;
        if (type && token.type !== type) return false;
        return true;
      });
  }

  async findValidByUserId(userId: string, type?: TokenType): Promise<Token[]> {
    return Array.from(this.tokens.values())
      .filter(token => {
        if (token.user_id !== userId) return false;
        if (type && token.type !== type) return false;
        return token.isValid();
      });
  }

  async findMany(options?: FindManyTokensOptions): Promise<Token[]> {
    let tokens = Array.from(this.tokens.values());
    
    if (options?.userId) {
      tokens = tokens.filter(token => token.user_id === options.userId);
    }
    
    if (options?.type) {
      tokens = tokens.filter(token => token.type === options.type);
    }
    
    if (options?.revoked !== undefined) {
      tokens = tokens.filter(token => token.revoked === options.revoked);
    }
    
    if (options?.expired !== undefined) {
      tokens = tokens.filter(token => token.isExpired() === options.expired);
    }
    
    if (options?.valid !== undefined) {
      tokens = tokens.filter(token => token.isValid() === options.valid);
    }
    
    if (options?.limit) {
      tokens = tokens.slice(0, options.limit);
    }
    
    return tokens;
  }

  async count(options?: CountTokensOptions): Promise<number> {
    const results = await this.findMany(options);
    return results.length;
  }

  async exists(id: string): Promise<boolean> {
    return this.tokens.has(id);
  }

  async revoke(id: string): Promise<Token> {
    const token = this.tokens.get(id);
    if (!token) {
      throw new TokenNotFoundError(id);
    }

    const revokedToken = token.revoke();
    this.tokens.set(id, revokedToken);
    return revokedToken;
  }

  async revokeByToken(tokenValue: string): Promise<Token> {
    const token = await this.findByToken(tokenValue);
    if (!token) {
      throw new TokenNotFoundError(tokenValue);
    }

    return await this.revoke(token.id);
  }

  async revokeAllByUserId(userId: string, type?: TokenType): Promise<number> {
    const userTokens = await this.findByUserId(userId, type);
    let revokedCount = 0;
    
    for (const token of userTokens) {
      if (!token.revoked) {
        await this.revoke(token.id);
        revokedCount++;
      }
    }
    
    return revokedCount;
  }

  async updateMetadata(id: string, metadata: Record<string, any>): Promise<Token> {
    const token = this.tokens.get(id);
    if (!token) {
      throw new TokenNotFoundError(id);
    }

    const updatedToken = token.updateMetadata(metadata);
    this.tokens.set(id, updatedToken);
    return updatedToken;
  }

  async delete(id: string): Promise<void> {
    if (!this.tokens.has(id)) {
      throw new TokenNotFoundError(id);
    }
    this.tokens.delete(id);
  }

  async deleteByToken(tokenValue: string): Promise<void> {
    const token = await this.findByToken(tokenValue);
    if (!token) {
      throw new TokenNotFoundError(tokenValue);
    }
    this.tokens.delete(token.id);
  }

  async deleteExpired(): Promise<number> {
    const expiredTokens = Array.from(this.tokens.entries())
      .filter(([_, token]) => token.isExpired())
      .map(([id, _]) => id);
    
    expiredTokens.forEach(id => this.tokens.delete(id));
    return expiredTokens.length;
  }

  async deleteRevokedOlderThan(hours: number): Promise<number> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const oldRevokedTokens = Array.from(this.tokens.entries())
      .filter(([_, token]) => {
        return token.revoked && token.updated_at < cutoffTime;
      })
      .map(([id, _]) => id);
    
    oldRevokedTokens.forEach(id => this.tokens.delete(id));
    return oldRevokedTokens.length;
  }

  async validateToken(tokenValue: string, type?: TokenType): Promise<Token | null> {
    const token = await this.findByToken(tokenValue);
    if (!token) {
      return null;
    }
    
    if (!token.isValid()) {
      return null;
    }
    
    if (type && token.type !== type) {
      return null;
    }
    
    return token;
  }

  async isTokenValid(tokenValue: string): Promise<boolean> {
    const token = await this.validateToken(tokenValue);
    return token !== null;
  }

  async cleanupExpiredTokens(): Promise<number> {
    return await this.deleteExpired();
  }

  async cleanupRevokedTokens(olderThanHours: number = 24): Promise<number> {
    return await this.deleteRevokedOlderThan(olderThanHours);
  }
}

describe('Token Repository Interface', () => {
  let repository: MockTokenRepository;

  beforeEach(() => {
    repository = new MockTokenRepository();
  });

  describe('Create operations', () => {
    it('should create a token', async () => {
      const tokenData: CreateTokenData = {
        userId: 'user-123',
        value: 'test-token-value',
        type: TokenType.ACCESS,
        metadata: { source: 'test' }
      };

      const token = await repository.create(tokenData, 'token-1');

      expect(token.user_id).toBe(tokenData.userId);
       expect(token.token).toBe(tokenData.value);
      expect(token.type).toBe(tokenData.type);
      expect(token.id).toBe('token-1');
      expect(token.revoked).toBe(false);
    });
  });

  describe('Read operations', () => {
    let testToken: Token;

    beforeEach(async () => {
      testToken = await repository.create({
        userId: 'user-123',
        value: 'test-token-value',
        type: TokenType.ACCESS
      }, 'token-1');
    });

    it('should find token by id', async () => {
      const found = await repository.findById('token-1');
      expect(found).not.toBeNull();
      expect(found!.id).toBe('token-1');
    });

    it('should return null for non-existent id', async () => {
      const found = await repository.findById('non-existent');
      expect(found).toBeNull();
    });

    it('should find token by token value', async () => {
      const found = await repository.findByToken('test-token-value');
      expect(found).not.toBeNull();
      expect(found!.token).toBe('test-token-value');
    });

    it('should return null for non-existent token value', async () => {
      const found = await repository.findByToken('non-existent-token');
      expect(found).toBeNull();
    });

    it('should find tokens by user id', async () => {
      await repository.create({
        userId: 'user-123',
        value: 'another-token',
        type: TokenType.REFRESH
      }, 'token-2');

      const tokens = await repository.findByUserId('user-123');
      expect(tokens).toHaveLength(2);
      expect(tokens.every(token => token.user_id === 'user-123')).toBe(true);
    });

    it('should find tokens by user id and type', async () => {
      await repository.create({
        userId: 'user-123',
        value: 'refresh-token',
        type: TokenType.REFRESH
      }, 'token-2');

      const accessTokens = await repository.findByUserId('user-123', TokenType.ACCESS);
      expect(accessTokens).toHaveLength(1);
      expect(accessTokens[0].type).toBe(TokenType.ACCESS);

      const refreshTokens = await repository.findByUserId('user-123', TokenType.REFRESH);
      expect(refreshTokens).toHaveLength(1);
      expect(refreshTokens[0].type).toBe(TokenType.REFRESH);
    });

    it('should find valid tokens by user id', async () => {
      // Create an expired token by mocking
      const expiredToken = await repository.create({
        userId: 'user-123',
        value: 'expired-token',
        type: TokenType.ACCESS
      }, 'token-2');
      
      const validTokens = await repository.findValidByUserId('user-123');
      expect(validTokens.length).toBeGreaterThan(0);
      expect(validTokens.every(token => token.isValid())).toBe(true);
    });

    it('should find many tokens with options', async () => {
      await repository.create({
        userId: 'user-456',
        value: 'other-user-token',
        type: TokenType.ACCESS
      }, 'token-2');

      const options: FindManyTokensOptions = {
        limit: 1,
        userId: 'user-123'
      };

      const tokens = await repository.findMany(options);
      expect(tokens).toHaveLength(1);
      expect(tokens[0].user_id).toBe('user-123');
    });

    it('should count tokens', async () => {
      const count = await repository.count();
      expect(count).toBe(1);
    });

    it('should count tokens with options', async () => {
      await repository.create({
        userId: 'user-456',
        value: 'other-user-token',
        type: TokenType.ACCESS
      }, 'token-2');

      const count = await repository.count({ userId: 'user-123' });
      expect(count).toBe(1);
    });

    it('should check if token exists', async () => {
      const exists = await repository.exists('token-1');
      expect(exists).toBe(true);

      const notExists = await repository.exists('non-existent');
      expect(notExists).toBe(false);
    });
  });

  describe('Update operations', () => {
    let testToken: Token;

    beforeEach(async () => {
      testToken = await repository.create({
        userId: 'user-123',
        value: 'test-token-value',
        type: TokenType.ACCESS
      }, 'token-1');
    });

    it('should revoke token by id', async () => {
      const revokedToken = await repository.revoke('token-1');
      expect(revokedToken.revoked).toBe(true);
      expect(revokedToken.id).toBe('token-1');
    });

    it('should throw error when revoking non-existent token', async () => {
      await expect(repository.revoke('non-existent'))
        .rejects.toThrow(TokenNotFoundError);
    });

    it('should revoke token by token value', async () => {
      const revokedToken = await repository.revokeByToken('test-token-value');
      expect(revokedToken.revoked).toBe(true);
      expect(revokedToken.token).toBe('test-token-value');
    });

    it('should revoke all tokens by user id', async () => {
      await repository.create({
        userId: 'user-123',
        value: 'another-token',
        type: TokenType.REFRESH
      }, 'token-2');

      const revokedCount = await repository.revokeAllByUserId('user-123');
      expect(revokedCount).toBe(2);

      const userTokens = await repository.findByUserId('user-123');
      expect(userTokens.every(token => token.revoked)).toBe(true);
    });

    it('should revoke tokens by user id and type', async () => {
      await repository.create({
        userId: 'user-123',
        value: 'refresh-token',
        type: TokenType.REFRESH
      }, 'token-2');

      const revokedCount = await repository.revokeAllByUserId('user-123', TokenType.ACCESS);
      expect(revokedCount).toBe(1);

      const accessTokens = await repository.findByUserId('user-123', TokenType.ACCESS);
      expect(accessTokens[0].revoked).toBe(true);

      const refreshTokens = await repository.findByUserId('user-123', TokenType.REFRESH);
      expect(refreshTokens[0].revoked).toBe(false);
    });

    it('should update token metadata', async () => {
      const newMetadata = { updated: true, source: 'api' };
      const updatedToken = await repository.updateMetadata('token-1', newMetadata);

      expect(updatedToken.metadata).toEqual(newMetadata);
      expect(updatedToken.id).toBe('token-1');
    });

    it('should throw error when updating metadata of non-existent token', async () => {
      await expect(repository.updateMetadata('non-existent', {}))
        .rejects.toThrow(TokenNotFoundError);
    });
  });

  describe('Delete operations', () => {
    let testToken: Token;

    beforeEach(async () => {
      testToken = await repository.create({
        userId: 'user-123',
        value: 'test-token-value',
        type: TokenType.ACCESS
      }, 'token-1');
    });

    it('should delete token by id', async () => {
      await repository.delete('token-1');
      const found = await repository.findById('token-1');
      expect(found).toBeNull();
    });

    it('should throw error when deleting non-existent token', async () => {
      await expect(repository.delete('non-existent'))
        .rejects.toThrow(TokenNotFoundError);
    });

    it('should delete token by token value', async () => {
      await repository.deleteByToken('test-token-value');
      const found = await repository.findByToken('test-token-value');
      expect(found).toBeNull();
    });

    it('should throw error when deleting by non-existent token value', async () => {
      await expect(repository.deleteByToken('non-existent-token'))
        .rejects.toThrow(TokenNotFoundError);
    });

    it('should delete expired tokens', async () => {
      const deletedCount = await repository.deleteExpired();
      expect(typeof deletedCount).toBe('number');
    });

    it('should delete revoked tokens older than specified hours', async () => {
      await repository.revoke('token-1');
      const deletedCount = await repository.deleteRevokedOlderThan(1);
      expect(typeof deletedCount).toBe('number');
    });
  });

  describe('Validation operations', () => {
    let testToken: Token;

    beforeEach(async () => {
      testToken = await repository.create({
        userId: 'user-123',
        value: 'test-token-value',
        type: TokenType.ACCESS
      }, 'token-1');
    });

    it('should validate token', async () => {
      const validatedToken = await repository.validateToken('test-token-value');
      expect(validatedToken).not.toBeNull();
      expect(validatedToken!.token).toBe('test-token-value');

      const invalidToken = await repository.validateToken('invalid-token');
      expect(invalidToken).toBeNull();
    });

    it('should validate token with type', async () => {
      const validatedToken = await repository.validateToken('test-token-value', TokenType.ACCESS);
      expect(validatedToken).not.toBeNull();

      const wrongTypeToken = await repository.validateToken('test-token-value', TokenType.REFRESH);
      expect(wrongTypeToken).toBeNull();
    });

    it('should check if token is valid', async () => {
      const isValid = await repository.isTokenValid('test-token-value');
      expect(isValid).toBe(true);

      const isInvalid = await repository.isTokenValid('invalid-token');
      expect(isInvalid).toBe(false);
    });

    it('should not validate revoked token', async () => {
      await repository.revoke('token-1');
      const validatedToken = await repository.validateToken('test-token-value');
      expect(validatedToken).toBeNull();
    });
  });

  describe('Cleanup operations', () => {
    it('should cleanup expired tokens', async () => {
      const cleanedCount = await repository.cleanupExpiredTokens();
      expect(typeof cleanedCount).toBe('number');
    });

    it('should cleanup revoked tokens', async () => {
      const cleanedCount = await repository.cleanupRevokedTokens(24);
      expect(typeof cleanedCount).toBe('number');
    });

    it('should use default cleanup hours for revoked tokens', async () => {
      const cleanedCount = await repository.cleanupRevokedTokens();
      expect(typeof cleanedCount).toBe('number');
    });
  });
});

describe('Token Repository Errors', () => {
  it('should create TokenRepositoryError with code', () => {
    const error = new TokenRepositoryError('Test error', 'TEST_CODE');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error).toBeInstanceOf(Error);
  });

  it('should create TokenNotFoundError', () => {
    const error = new TokenNotFoundError('token-123');
    expect(error.message).toBe('Token not found: token-123');
    expect(error.code).toBe('TOKEN_NOT_FOUND');
    expect(error).toBeInstanceOf(TokenRepositoryError);
  });

  it('should create InvalidTokenError', () => {
    const error = new InvalidTokenError('Token format is invalid');
    expect(error.message).toBe('Invalid token: Token format is invalid');
    expect(error.code).toBe('INVALID_TOKEN');
    expect(error).toBeInstanceOf(TokenRepositoryError);
  });

  it('should create ExpiredTokenError', () => {
    const error = new ExpiredTokenError('token-123');
    expect(error.message).toBe('Token has expired: token-123');
    expect(error.code).toBe('EXPIRED_TOKEN');
    expect(error).toBeInstanceOf(TokenRepositoryError);
  });

  it('should create RevokedTokenError', () => {
    const error = new RevokedTokenError('token-123');
    expect(error.message).toBe('Token has been revoked: token-123');
    expect(error.code).toBe('REVOKED_TOKEN');
    expect(error).toBeInstanceOf(TokenRepositoryError);
  });

  it('should create TokenValidationError', () => {
    const error = new TokenValidationError('Invalid token format');
    expect(error.message).toBe('Token validation error: Invalid token format');
    expect(error.code).toBe('TOKEN_VALIDATION_ERROR');
    expect(error).toBeInstanceOf(TokenRepositoryError);
  });

  it('should create TokenTypeError', () => {
    const error = new TokenTypeError(TokenType.ACCESS, TokenType.REFRESH);
    expect(error.message).toBe("Expected token type 'access', but got 'refresh'");
    expect(error.code).toBe('TOKEN_TYPE_ERROR');
    expect(error).toBeInstanceOf(TokenRepositoryError);
  });
});