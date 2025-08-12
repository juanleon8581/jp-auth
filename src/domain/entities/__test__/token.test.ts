import '../../../setup';
import { Token, CreateTokenData, TokenType, TOKEN_EXPIRATION } from '../token.entity';

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
    const token = Token.create(mockTokenData);

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
    const token = Token.fromRaw(mockTokenData);

    expect(token.user_id).toBe(mockTokenData.userId);
    expect(token.type).toBe(mockTokenData.type);
  });

  it('should create new token with default expiration', () => {
    const createData: CreateTokenData = {
      userId: 'user-456',
      type: TokenType.REFRESH,
      value: 'new-token-value'
    };

    const newToken = Token.createNew(createData, 'new-token-id');

    expect(newToken.id).toBe('new-token-id');
    expect(newToken.userId).toBe(createData.userId);
    expect(newToken.type).toBe(createData.type);
    expect(newToken.value).toBe(createData.value);
    expect(newToken.expiresAt).toBeInstanceOf(Date);
    expect(newToken.metadata).toEqual({});
  });

  it('should create new token with custom expiration', () => {
    const customExpiration = new Date('2024-12-31T23:59:59Z');
    const createData: CreateTokenData = {
      userId: 'user-789',
      type: TokenType.EMAIL_VERIFICATION,
      value: 'verification-token',
      expiresAt: customExpiration,
      metadata: { purpose: 'email_verification' }
    };

    const newToken = Token.createNew(createData, 'verification-token-id');

    expect(newToken.expiresAt).toBe(customExpiration);
    expect(newToken.metadata).toEqual(createData.metadata);
  });

  it('should calculate expiration for different token types', () => {
    const now = new Date();
    
    const accessExpiration = Token.calculateExpiration(TokenType.ACCESS);
    const refreshExpiration = Token.calculateExpiration(TokenType.REFRESH);
    const resetExpiration = Token.calculateExpiration(TokenType.RESET_PASSWORD);
    const verificationExpiration = Token.calculateExpiration(TokenType.EMAIL_VERIFICATION);

    expect(accessExpiration.getTime()).toBeGreaterThan(now.getTime());
    expect(refreshExpiration.getTime()).toBeGreaterThan(accessExpiration.getTime());
    expect(resetExpiration.getTime()).toBeGreaterThan(now.getTime());
    expect(verificationExpiration.getTime()).toBeGreaterThan(now.getTime());

    // Check approximate durations (allowing for small timing differences)
    const accessDuration = accessExpiration.getTime() - now.getTime();
    const refreshDuration = refreshExpiration.getTime() - now.getTime();
    
    expect(accessDuration).toBeCloseTo(TOKEN_EXPIRATION.ACCESS, -2); // Within 100ms
    expect(refreshDuration).toBeCloseTo(TOKEN_EXPIRATION.REFRESH, -2);
  });

  it('should convert to JSON', () => {
    const token = Token.create(mockTokenData);
    const json = token.toJSON();

    expect(json).toEqual(mockTokenData);
  });

  it('should check if token is valid', () => {
    const validToken = Token.create({
      ...mockTokenData,
      expiresAt: new Date(Date.now() + 60000), // 1 minute from now
      isRevoked: false
    });

    const expiredToken = Token.create({
      ...mockTokenData,
      expiresAt: new Date(Date.now() - 60000), // 1 minute ago
      isRevoked: false
    });

    const revokedToken = Token.create({
      ...mockTokenData,
      expiresAt: new Date(Date.now() + 60000),
      isRevoked: true
    });

    expect(validToken.isValid()).toBe(true);
    expect(expiredToken.isValid()).toBe(false);
    expect(revokedToken.isValid()).toBe(false);
  });

  it('should check if token is expired', () => {
    const futureDate = new Date(Date.now() + 60000);
    const pastDate = new Date(Date.now() - 60000);

    const validToken = Token.create({ ...mockTokenData, expiresAt: futureDate });
    const expiredToken = Token.create({ ...mockTokenData, expiresAt: pastDate });

    expect(validToken.isExpired()).toBe(false);
    expect(expiredToken.isExpired()).toBe(true);
  });

  it('should check if token is revoked', () => {
    const activeToken = Token.create({ ...mockTokenData, isRevoked: false });
    const revokedToken = Token.create({ ...mockTokenData, isRevoked: true });

    expect(activeToken.isRevoked()).toBe(false);
    expect(revokedToken.isRevoked()).toBe(true);
  });

  it('should revoke token', () => {
    const token = Token.create({ ...mockTokenData, isRevoked: false });
    const revokedToken = token.revoke();

    expect(revokedToken.revoked).toBe(true);
    expect(revokedToken.updated_at.getTime()).toBeGreaterThan(token.updated_at.getTime());
    expect(revokedToken.id).toBe(token.id); // ID should remain the same
  });

  it('should get time until expiration in minutes', () => {
    const futureDate = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
    const token = Token.create({ ...mockTokenData, expiresAt: futureDate });

    const minutesUntilExpiration = token.getTimeUntilExpirationMinutes();
    expect(minutesUntilExpiration).toBeGreaterThan(29);
    expect(minutesUntilExpiration).toBeLessThanOrEqual(30);
  });

  it('should return 0 minutes for expired token', () => {
    const pastDate = new Date(Date.now() - 60000);
    const expiredToken = Token.create({ ...mockTokenData, expiresAt: pastDate });

    expect(expiredToken.getTimeUntilExpirationMinutes()).toBe(0);
  });

  it('should check if token belongs to user', () => {
    const token = Token.create(mockTokenData);

    expect(token.belongsToUser(mockTokenData.userId)).toBe(true);
    expect(token.belongsToUser('different-user-id')).toBe(false);
  });

  it('should check if token is of specific type', () => {
    const accessToken = Token.create({ ...mockTokenData, type: TokenType.ACCESS });
    const refreshToken = Token.create({ ...mockTokenData, type: TokenType.REFRESH });

    expect(accessToken.isOfType(TokenType.ACCESS)).toBe(true);
    expect(accessToken.isOfType(TokenType.REFRESH)).toBe(false);
    expect(refreshToken.isOfType(TokenType.REFRESH)).toBe(true);
    expect(refreshToken.isOfType(TokenType.ACCESS)).toBe(false);
  });

  it('should update metadata', () => {
    const token = Token.create(mockTokenData);
    const newMetadata = { updated: true, version: 2 };
    const updatedToken = token.updateMetadata(newMetadata);

    expect(updatedToken.metadata).toEqual({ ...mockTokenData.metadata, ...newMetadata });
    expect(updatedToken.updated_at.getTime()).toBeGreaterThan(token.updated_at.getTime());
    expect(updatedToken.id).toBe(token.id); // ID should remain the same
  });

  it('should determine if token should be cleaned up', () => {
    const now = new Date();
    const oldToken = Token.create({
      ...mockTokenData,
      createdAt: new Date(now.getTime() - 26 * 60 * 60 * 1000), // 26 hours ago
      expiresAt: new Date(now.getTime() - 25 * 60 * 60 * 1000) // 25 hours ago (expired)
    });

    const recentToken = Token.create({
      ...mockTokenData,
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
      expiresAt: new Date(now.getTime() + 1 * 60 * 60 * 1000) // 1 hour from now
    });

    expect(oldToken.shouldCleanup()).toBe(true);
    expect(recentToken.shouldCleanup()).toBe(false);
  });

  it('should use custom cleanup hours', () => {
    const now = new Date();
    const token = Token.create({
      ...mockTokenData,
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
      expiresAt: new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2 hours ago (expired)
    });

    expect(token.shouldCleanup(1)).toBe(true); // Should cleanup after 1 hour
    expect(token.shouldCleanup(3)).toBe(false); // Should not cleanup after 3 hours
  });
});