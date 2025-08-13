import '../../../setup';
import {
  ITokenRepository,
  FindManyTokensOptions,
  CountTokensOptions,
  TokenNotFoundError,
  ExpiredTokenError,
  RevokedTokenError,
  InvalidTokenError,
  TokenValidationError,
} from '../token.repository';
import { TokenEntity, CreateTokenData, TokenType } from '../../entities/token.entity';

// Mock implementation for testing interface compliance
class MockTokenRepository implements ITokenRepository {
  private tokens: Map<string, TokenEntity> = new Map();
  private nextId = 1;

  async create(tokenData: CreateTokenData, id: string): Promise<TokenEntity> {
    const now = new Date();
    const tokenValue = `tok_${Math.random().toString(36).substring(2, 15)}`;
    
    const token = TokenEntity.create({
      id,
      userId: tokenData.userId,
      type: tokenData.type,
      value: tokenData.value,
      expiresAt: tokenData.expiresAt || TokenEntity.calculateExpiration(tokenData.type),
      isRevoked: false,
      metadata: tokenData.metadata || {},
      createdAt: now,
      updatedAt: now
    });
    this.tokens.set(id, token);
    return token;
  }

  async findById(id: string): Promise<TokenEntity | null> {
    return this.tokens.get(id) || null;
  }

  async findByToken(tokenValue: string): Promise<TokenEntity | null> {
    for (const token of this.tokens.values()) {
      if (token.token === tokenValue) {
        return token;
      }
    }
    return null;
  }

  async findByUserId(userId: string, type?: TokenType): Promise<TokenEntity[]> {
    const userTokens = Array.from(this.tokens.values()).filter(token => {
      if (token.user_id !== userId) return false;
      if (type && token.type !== type) return false;
      return true;
    });
    return userTokens;
  }

  async findValidByUserId(userId: string, type?: TokenType): Promise<TokenEntity[]> {
    const userTokens = await this.findByUserId(userId, type);
    return userTokens.filter(token => token.isValid());
  }

  async findMany(options?: FindManyTokensOptions): Promise<TokenEntity[]> {
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
    
    if (options?.limit) {
      tokens = tokens.slice(0, options.limit);
    }
    
    return tokens;
  }

  async count(options?: CountTokensOptions): Promise<number> {
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
    
    return tokens.length;
  }

  async exists(id: string): Promise<boolean> {
    return this.tokens.has(id);
  }

  async revoke(id: string): Promise<TokenEntity> {
    const token = this.tokens.get(id);
    if (!token) {
      throw new TokenNotFoundError(id);
    }
    const revokedToken = token.revoke();
    this.tokens.set(id, revokedToken);
    return revokedToken;
  }

  async revokeByToken(tokenValue: string): Promise<TokenEntity> {
    const tokenEntity = await this.findByToken(tokenValue);
    if (!tokenEntity) {
      throw new TokenNotFoundError(tokenValue);
    }
    const revokedToken = tokenEntity.revoke();
    this.tokens.set(tokenEntity.id, revokedToken);
    return revokedToken;
  }

  async revokeAllByUserId(userId: string, type?: TokenType): Promise<number> {
    let count = 0;
    for (const [id, token] of this.tokens.entries()) {
      if (token.user_id === userId && (!type || token.type === type)) {
        const revokedToken = token.revoke();
        this.tokens.set(id, revokedToken);
        count++;
      }
    }
    return count;
  }

  async updateMetadata(id: string, metadata: Record<string, any>): Promise<TokenEntity> {
    const token = this.tokens.get(id);
    if (!token) {
      throw new TokenNotFoundError(id);
    }
    const updatedToken = token.updateMetadata(metadata);
    this.tokens.set(id, updatedToken);
    return updatedToken;
  }

  async delete(id: string): Promise<void> {
    this.tokens.delete(id);
  }

  async deleteByToken(tokenValue: string): Promise<void> {
    for (const [id, tokenEntity] of this.tokens.entries()) {
      if (tokenEntity.token === tokenValue) {
        this.tokens.delete(id);
        break;
      }
    }
  }

  async deleteExpired(): Promise<number> {
    let count = 0;
    const now = new Date();
    for (const [id, token] of this.tokens.entries()) {
      if (token.expires_at < now) {
        this.tokens.delete(id);
        count++;
      }
    }
    return count;
  }

  async deleteRevokedOlderThan(hours: number): Promise<number> {
    let count = 0;
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    for (const [id, token] of this.tokens.entries()) {
      if (token.revoked && token.updated_at < cutoff) {
        this.tokens.delete(id);
        count++;
      }
    }
    return count;
  }

  async validateToken(tokenValue: string, type?: TokenType): Promise<TokenEntity | null> {
    const token = await this.findByToken(tokenValue);
    if (!token || token.revoked || token.expires_at <= new Date()) {
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
    return this.deleteExpired();
  }

  async cleanupRevokedTokens(olderThanHours: number = 24): Promise<number> {
    return this.deleteRevokedOlderThan(olderThanHours);
  }
}

describe('Token Repository Interface', () => {
  let repository: MockTokenRepository;

  beforeEach(() => {
    repository = new MockTokenRepository();
  });

  describe('create', () => {
    it('should create a token', async () => {
      const tokenData: CreateTokenData = {
        userId: 'user-123',
        type: TokenType.ACCESS,
        value: 'test-token-value',
        metadata: { device: 'mobile' }
      };

      const token = await repository.create(tokenData, 'token-1');

      expect(token.user_id).toBe(tokenData.userId);
      expect(token.type).toBe(tokenData.type);
      expect(token.metadata).toEqual(tokenData.metadata);
      expect(token.id).toBe('token-1');
    });
  });

  describe('findById', () => {
    let testToken: TokenEntity;

    beforeEach(async () => {
      testToken = await repository.create({
        userId: 'user-123',
        type: TokenType.ACCESS,
        value: 'test-token-value',
        metadata: { device: 'web' }
      }, 'token-1');
    });

    it('should find token by id', async () => {
      const found = await repository.findById(testToken.id);
      expect(found).toBeTruthy();
      expect(found?.id).toBe(testToken.id);
    });

    it('should return null for non-existent token', async () => {
      const found = await repository.findById('non-existent');
      expect(found).toBeNull();
    });
  });

  describe('findByUserId', () => {
    beforeEach(async () => {
      await repository.create({
        userId: 'user-123',
        type: TokenType.ACCESS,
        value: 'access-token',
        metadata: {}
      }, 'token-1');
    });

    it('should find tokens by user id', async () => {
      await repository.create({
        userId: 'user-123',
        type: TokenType.REFRESH,
        value: 'refresh-token',
        metadata: {}
      }, 'token-2');

      const userTokens = await repository.findByUserId('user-123');
      expect(userTokens).toHaveLength(2);
      expect(userTokens.every(token => token.user_id === 'user-123')).toBe(true);
    });

    it('should find tokens by user id and type', async () => {
      await repository.create({
        userId: 'user-123',
        type: TokenType.REFRESH,
        value: 'refresh-token-2',
        metadata: {}
      }, 'token-3');

      const accessTokens = await repository.findByUserId('user-123', TokenType.ACCESS);
      expect(accessTokens).toHaveLength(1);
      expect(accessTokens[0].type).toBe(TokenType.ACCESS);
    });

    it('should find valid tokens by user id', async () => {
      // Create an expired token
      const expiredTokenData: CreateTokenData = {
        userId: 'user-123',
        type: TokenType.ACCESS,
        value: 'expired-token',
        metadata: {}
      };
      const expiredToken = await repository.create(expiredTokenData, 'expired-token');
      
      // Manually set expiration to past date
      const pastDate = new Date(Date.now() - 1000);
      const expiredTokenWithPastDate = TokenEntity.create({
        ...expiredToken.toJSON(),
        expiresAt: pastDate
      });
      repository['tokens'].set(expiredToken.id, expiredTokenWithPastDate);

      const validTokens = await repository.findValidByUserId('user-123');
      expect(validTokens).toHaveLength(1); // Only the non-expired token
    });

    it('should find many tokens with options', async () => {
      await repository.create({
        userId: 'user-456',
        type: TokenType.ACCESS,
        value: 'user-456-token',
        metadata: {}
      }, 'token-4');

      const options: FindManyTokensOptions = {
        userId: 'user-123',
        limit: 1
      };
      
      const tokens = await repository.findMany(options);
      expect(tokens).toHaveLength(1);
      expect(tokens[0].user_id).toBe('user-123');
    });

    it('should count tokens', async () => {
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

  describe('revoke operations', () => {
    let testToken: TokenEntity;

    beforeEach(async () => {
      testToken = await repository.create({
        userId: 'user-123',
        type: TokenType.ACCESS,
        value: 'revoke-test-token',
        metadata: { device: 'web' }
      }, 'token-1');
    });

    it('should revoke token by id', async () => {
      const revokedToken = await repository.revoke(testToken.id);

      expect(revokedToken.revoked).toBe(true);
      expect(revokedToken.id).toBe(testToken.id);
    });

    it('should throw error when revoking non-existent token', async () => {
      await expect(repository.revoke('non-existent')).rejects.toThrow(TokenNotFoundError);
    });

    it('should revoke token by token value', async () => {
      const revokedToken = await repository.revokeByToken(testToken.token);

      expect(revokedToken.revoked).toBe(true);
      expect(revokedToken.token).toBe(testToken.token);
    });

    it('should revoke all tokens by user id', async () => {
      await repository.create({
        userId: 'user-123',
        type: TokenType.REFRESH,
        value: 'refresh-token',
        metadata: {}
      }, 'token-2');

      const revokedCount = await repository.revokeAllByUserId('user-123');
      expect(revokedCount).toBe(2);
    });
  });

  describe('update operations', () => {
    let testToken: TokenEntity;

    beforeEach(async () => {
      testToken = await repository.create({
        userId: 'user-123',
        type: TokenType.ACCESS,
        value: 'update-metadata-token',
        metadata: {}
      }, 'token-1');
    });

    it('should update token metadata', async () => {
      const newMetadata = { device: 'mobile', version: '1.0' };
      const updatedToken = await repository.updateMetadata(testToken.id, newMetadata);

      expect(updatedToken.metadata).toEqual(newMetadata);
      expect(updatedToken.id).toBe(testToken.id);
    });

    it('should throw error when updating non-existent token', async () => {
      await expect(repository.updateMetadata('non-existent', {})).rejects.toThrow(TokenNotFoundError);
    });
  });

  describe('validation operations', () => {
    let testToken: TokenEntity;

    beforeEach(async () => {
      testToken = await repository.create({
        userId: 'user-123',
        type: TokenType.ACCESS,
        value: 'validate-token-value',
        metadata: {}
      }, 'token-1');
    });

    it('should validate token', async () => {
      const validatedToken = await repository.validateToken(testToken.token);
      expect(validatedToken).toBeTruthy();
      expect(validatedToken?.id).toBe(testToken.id);
    });

    it('should return null for invalid token', async () => {
      const validatedToken = await repository.validateToken('invalid-token');
      expect(validatedToken).toBeNull();
    });

    it('should check if token is valid', async () => {
      const isValid = await repository.isTokenValid(testToken.token);
      expect(isValid).toBe(true);
      
      const isInvalid = await repository.isTokenValid('invalid-token');
      expect(isInvalid).toBe(false);
    });
  });

  describe('cleanup operations', () => {
    it('should cleanup expired tokens', async () => {
      // Create a token that should be cleaned up
      const oldTokenData: CreateTokenData = {
        userId: 'user-123',
        type: TokenType.ACCESS,
        value: 'cleanup-token-value',
        metadata: {}
      };
      const oldToken = await repository.create(oldTokenData, 'old-token');
      
      // Manually set dates to past
      const pastDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      const oldTokenWithPastDate = TokenEntity.create({
        ...oldToken.toJSON(),
        createdAt: pastDate,
        expiresAt: pastDate
      });
      repository['tokens'].set(oldToken.id, oldTokenWithPastDate);

      const cleanedCount = await repository.cleanupExpiredTokens();
      expect(cleanedCount).toBe(1);
    });

    it('should cleanup revoked tokens', async () => {
      const token = await repository.create({
        userId: 'user-123',
        type: TokenType.ACCESS,
        value: 'revoked-token',
        metadata: {}
      }, 'revoked-token');
      
      await repository.revoke(token.id);
      
      const cleanedCount = await repository.cleanupRevokedTokens(0);
      expect(cleanedCount).toBe(1);
    });
  });

  describe('delete operations', () => {
    let testToken: TokenEntity;

    beforeEach(async () => {
      testToken = await repository.create({
        userId: 'user-123',
        type: TokenType.ACCESS,
        value: 'delete-token',
        metadata: {}
      }, 'token-1');
    });

    it('should delete token by id', async () => {
      await repository.delete(testToken.id);
      const found = await repository.findById(testToken.id);
      expect(found).toBeNull();
    });

    it('should delete token by token value', async () => {
      await repository.deleteByToken(testToken.token);
      const found = await repository.findByToken(testToken.token);
      expect(found).toBeNull();
    });
  });
});

describe('Token Repository Errors', () => {
  it('should create TokenNotFoundError with correct message', () => {
    expect(() => new TokenNotFoundError('token123')).toThrow('Token with identifier token123 not found');
  });

  it('should create ExpiredTokenError with correct message', () => {
    expect(() => new ExpiredTokenError('token123')).toThrow('Token token123 has expired');
  });

  it('should create RevokedTokenError with correct message', () => {
    expect(() => new RevokedTokenError('token123')).toThrow('Token token123 has been revoked');
  });
});