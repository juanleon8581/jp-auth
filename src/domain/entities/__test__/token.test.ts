import '../../../setup';
import { TokenEntity, CreateTokenData, TokenType, TOKEN_EXPIRATION } from '../token.entity';

describe('Token Entity', () => {
  const mockTokenData = {
    id: 'token-123',
    userId: 'user-123',
    type: TokenType.ACCESS,
    value: 'test-token-value-123',
    expiresAt: new Date('2024-01-01T12:00:00Z'),
    isRevoked: false,
    metadata: { source: 'login' },
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z')
  };

  it('should create a token from data', () => {
    const token = TokenEntity.create(mockTokenData);

    expect(token.id).toBe(mockTokenData.id);
    expect(token.user_id).toBe(mockTokenData.userId);
    expect(token.type).toBe(mockTokenData.type);
    expect(token.token).toBe(mockTokenData.value);
    expect(token.expires_at).toBe(mockTokenData.expiresAt);
    expect(token.revoked).toBe(mockTokenData.isRevoked);
    expect(token.metadata).toEqual(mockTokenData.metadata);
    expect(token.created_at).toBe(mockTokenData.createdAt);
    expect(token.updated_at).toBe(mockTokenData.updatedAt);
  });

  it('should create token from raw data', () => {
    const token = TokenEntity.fromRaw(mockTokenData);

    expect(token.user_id).toBe(mockTokenData.userId);
    expect(token.type).toBe(mockTokenData.type);
  });

  it('should create new token with default expiration', () => {
    const createData: CreateTokenData = {
      userId: 'user-456',
      type: TokenType.REFRESH,
      value: 'new-token-value'
    };

    const newToken = TokenEntity.createNew(createData, 'new-token-id');

    expect(newToken.id).toBe('new-token-id');
    expect(newToken.userId).toBe(createData.userId);
    expect(newToken.type).toBe(createData.type);
    expect(newToken.value).toBe(createData.value);
    expect(newToken.metadata).toEqual({});
    expect(newToken.expiresAt).toBeInstanceOf(Date);
  });

  it('should create new token with custom expiration', () => {
    const createData: CreateTokenData = {
      userId: 'user-789',
      type: TokenType.ACCESS,
      value: 'access-token-value',
      expiresAt: new Date('2024-12-31T23:59:59Z')
    };

    const newToken = TokenEntity.createNew(createData, 'access-token-id');

    expect(newToken.expiresAt).toEqual(createData.expiresAt);
  });

  it('should create new token with metadata', () => {
    const createData: CreateTokenData = {
      userId: 'user-101',
      type: TokenType.REFRESH,
      value: 'refresh-token-value',
      metadata: { device: 'mobile', ip: '192.168.1.1' }
    };

    const newToken = TokenEntity.createNew(createData, 'refresh-token-id');

    expect(newToken.metadata).toEqual(createData.metadata);
  });

  it('should check if token is expired', () => {
    const expiredToken = TokenEntity.create({
      ...mockTokenData,
      expiresAt: new Date('2020-01-01T00:00:00Z') // Past date
    });

    const validToken = TokenEntity.create({
      ...mockTokenData,
      expiresAt: new Date('2030-01-01T00:00:00Z') // Future date
    });

    expect(expiredToken.isExpired()).toBe(true);
    expect(validToken.isExpired()).toBe(false);
  });

  it('should check if token is valid (not expired and not revoked)', () => {
    const validToken = TokenEntity.create({
      ...mockTokenData,
      expiresAt: new Date('2030-01-01T00:00:00Z'),
      isRevoked: false
    });

    const expiredToken = TokenEntity.create({
      ...mockTokenData,
      expiresAt: new Date('2020-01-01T00:00:00Z'),
      isRevoked: false
    });

    const revokedToken = TokenEntity.create({
      ...mockTokenData,
      expiresAt: new Date('2030-01-01T00:00:00Z'),
      isRevoked: true
    });

    expect(validToken.isValid()).toBe(true);
    expect(expiredToken.isValid()).toBe(false);
    expect(revokedToken.isValid()).toBe(false);
  });

  it('should revoke token', () => {
    const token = TokenEntity.create(mockTokenData);
    
    expect(token.revoked).toBe(false);
    
    const revokedToken = token.revoke();
    
    expect(revokedToken.revoked).toBe(true);
    expect(revokedToken.updated_at).toBeInstanceOf(Date);
  });

  it('should update token metadata', () => {
    const token = TokenEntity.create(mockTokenData);
    const newMetadata = { device: 'desktop', location: 'office' };
    
    const updatedToken = token.updateMetadata(newMetadata);
    
    expect(updatedToken.metadata).toEqual({ ...mockTokenData.metadata, ...newMetadata });
    expect(updatedToken.updated_at).toBeInstanceOf(Date);
  });

  it('should get token data for serialization', () => {
    const token = TokenEntity.create(mockTokenData);
    const tokenData = token.toJSON();

    expect(tokenData).toEqual({
      id: mockTokenData.id,
      userId: mockTokenData.userId,
      type: mockTokenData.type,
      value: mockTokenData.value,
      expiresAt: mockTokenData.expiresAt,
      isRevoked: mockTokenData.isRevoked,
      metadata: mockTokenData.metadata,
      createdAt: mockTokenData.createdAt,
      updatedAt: mockTokenData.updatedAt
    });
  });

  it('should get token data in domain format', () => {
     const token = TokenEntity.create(mockTokenData);
     const domainData = token.toJSON();

     expect(domainData).toEqual({
       id: mockTokenData.id,
       userId: mockTokenData.userId,
       type: mockTokenData.type,
       value: mockTokenData.value,
       expiresAt: mockTokenData.expiresAt,
       isRevoked: mockTokenData.isRevoked,
       metadata: mockTokenData.metadata,
       createdAt: mockTokenData.createdAt,
       updatedAt: mockTokenData.updatedAt
     });
   });

  describe('Token Expiration Constants', () => {
    it('should have correct expiration times', () => {
      expect(TOKEN_EXPIRATION.ACCESS).toBe(15 * 60 * 1000); // 15 minutes
      expect(TOKEN_EXPIRATION.REFRESH).toBe(7 * 24 * 60 * 60 * 1000); // 7 days
      expect(TOKEN_EXPIRATION.RESET_PASSWORD).toBe(60 * 60 * 1000); // 1 hour
      expect(TOKEN_EXPIRATION.EMAIL_VERIFICATION).toBe(24 * 60 * 60 * 1000); // 24 hours
    });
  });

  describe('Token Types', () => {
    it('should have correct token types', () => {
      expect(TokenType.ACCESS).toBe('access');
      expect(TokenType.REFRESH).toBe('refresh');
      expect(TokenType.RESET_PASSWORD).toBe('reset_password');
      expect(TokenType.EMAIL_VERIFICATION).toBe('email_verification');
    });
  });

  describe('Edge Cases', () => {
    it('should handle token with minimal data', () => {
      const minimalData = {
        id: 'minimal-token',
        userId: 'user-minimal',
        type: TokenType.ACCESS,
        value: 'minimal-value',
        expiresAt: new Date(),
        isRevoked: false,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const token = TokenEntity.create(minimalData);
      
      expect(token.id).toBe(minimalData.id);
      expect(token.metadata).toEqual({});
    });

    it('should handle token creation with null metadata', () => {
      const createData: CreateTokenData = {
        userId: 'user-null-meta',
        type: TokenType.REFRESH,
        value: 'token-with-null-meta'
      };

      const token = TokenEntity.createNew(createData, 'null-meta-token');
      
      expect(token.metadata).toEqual({});
    });
  });
});