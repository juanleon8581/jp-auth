import '../../../setup';
import { FailedLogin, CreateFailedLoginData, UpdateFailedLoginData, FAILED_LOGIN_CONSTANTS } from '../failed-login.entity';

describe('FailedLogin Entity', () => {
  const mockFailedLoginData = {
    id: 'failed-login-123',
    userId: 'user-123',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Test Browser)',
    attempts: 3,
    lastAttemptAt: new Date('2024-01-01T10:00:00Z'),
    lockedUntil: undefined,
    metadata: { source: 'web' },
    createdAt: new Date('2024-01-01T09:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z')
  };

  it('should create a failed login from data', () => {
    const failedLogin = FailedLogin.create(mockFailedLoginData);

    expect(failedLogin.id).toBe(mockFailedLoginData.id);
    expect(failedLogin.userId).toBe(mockFailedLoginData.userId);
    expect(failedLogin.ipAddress).toBe(mockFailedLoginData.ipAddress);
    expect(failedLogin.userAgent).toBe(mockFailedLoginData.userAgent);
    expect(failedLogin.attempts).toBe(mockFailedLoginData.attempts);
    expect(failedLogin.lastAttemptAt).toBe(mockFailedLoginData.lastAttemptAt);
    expect(failedLogin.lockedUntil).toBe(mockFailedLoginData.lockedUntil);
    expect(failedLogin.metadata).toEqual(mockFailedLoginData.metadata);
  });

  it('should create failed login from raw data', () => {
    const failedLogin = FailedLogin.fromRaw(mockFailedLoginData);

    expect(failedLogin.userId).toBe(mockFailedLoginData.userId);
    expect(failedLogin.ipAddress).toBe(mockFailedLoginData.ipAddress);
  });

  it('should create new failed login record', () => {
    const createData: CreateFailedLoginData = {
      userId: 'user-456',
      ipAddress: '10.0.0.1',
      userAgent: 'Test Agent',
      attemptedAt: new Date('2024-01-02T12:00:00Z'),
      metadata: { device: 'mobile' }
    };

    const newFailedLogin = FailedLogin.createNew(createData);

    expect(newFailedLogin.userId).toBe(createData.userId);
    expect(newFailedLogin.ipAddress).toBe(createData.ipAddress);
    expect(newFailedLogin.userAgent).toBe(createData.userAgent);
    expect(newFailedLogin.attempts).toBe(1);
    expect(newFailedLogin.lastAttemptAt).toBe(createData.attemptedAt);
    expect(newFailedLogin.lockedUntil).toBeUndefined();
    expect(newFailedLogin.metadata).toEqual(createData.metadata);
    expect(newFailedLogin.createdAt).toBeInstanceOf(Date);
    expect(newFailedLogin.updatedAt).toBeInstanceOf(Date);
  });

  it('should convert to JSON', () => {
    const failedLogin = FailedLogin.create(mockFailedLoginData);
    const json = failedLogin.toJSON();

    expect(json).toEqual(mockFailedLoginData);
  });

  it('should increment attempts', () => {
    const failedLogin = FailedLogin.create(mockFailedLoginData);
    const incrementedFailedLogin = failedLogin.incrementAttempts();

    expect(incrementedFailedLogin.attempts).toBe(mockFailedLoginData.attempts + 1);
    expect(incrementedFailedLogin.lastAttemptAt.getTime()).toBeGreaterThan(mockFailedLoginData.lastAttemptAt.getTime());
    expect(incrementedFailedLogin.updatedAt.getTime()).toBeGreaterThan(mockFailedLoginData.updatedAt.getTime());
    expect(incrementedFailedLogin.id).toBe(failedLogin.id); // ID should remain the same
  });

  it('should determine if account should be locked', () => {
    const failedLoginBelowMax = FailedLogin.create({
      ...mockFailedLoginData,
      attempts: FAILED_LOGIN_CONSTANTS.MAX_ATTEMPTS - 1
    });

    const failedLoginAtMax = FailedLogin.create({
      ...mockFailedLoginData,
      attempts: FAILED_LOGIN_CONSTANTS.MAX_ATTEMPTS
    });

    expect(failedLoginBelowMax.shouldLockAccount()).toBe(false);
    expect(failedLoginAtMax.shouldLockAccount()).toBe(true);
  });

  it('should check if lockout is expired', () => {
    const now = new Date();
    const pastAttempt = new Date(now.getTime() - (FAILED_LOGIN_CONSTANTS.LOCKOUT_DURATION_MINUTES + 1) * 60 * 1000);
    const recentAttempt = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago

    const expiredLockout = FailedLogin.create({
      ...mockFailedLoginData,
      attempts: FAILED_LOGIN_CONSTANTS.MAX_ATTEMPTS,
      lastAttemptAt: pastAttempt
    });

    const activeLockout = FailedLogin.create({
      ...mockFailedLoginData,
      attempts: FAILED_LOGIN_CONSTANTS.MAX_ATTEMPTS,
      lastAttemptAt: recentAttempt
    });

    const noLockout = FailedLogin.create({
      ...mockFailedLoginData,
      attempts: 2, // Below max attempts
      lastAttemptAt: recentAttempt
    });

    expect(expiredLockout.isLockoutExpired()).toBe(true);
    expect(activeLockout.isLockoutExpired()).toBe(false);
    expect(noLockout.isLockoutExpired()).toBe(true); // No lockout means it's "expired"
  });

  it('should get remaining lockout minutes', () => {
    const now = new Date();
    const pastAttempt = new Date(now.getTime() - 15 * 60 * 1000); // 15 minutes ago

    const lockedFailedLogin = FailedLogin.create({
      ...mockFailedLoginData,
      attempts: FAILED_LOGIN_CONSTANTS.MAX_ATTEMPTS, // Must be at max to be locked
      lastAttemptAt: pastAttempt
    });

    const unlockedFailedLogin = FailedLogin.create({
      ...mockFailedLoginData,
      attempts: 2, // Below max attempts
      lastAttemptAt: pastAttempt
    });

    expect(lockedFailedLogin.getRemainingLockoutMinutes()).toBeGreaterThan(0);
    expect(lockedFailedLogin.getRemainingLockoutMinutes()).toBeLessThanOrEqual(FAILED_LOGIN_CONSTANTS.LOCKOUT_DURATION_MINUTES);
    expect(unlockedFailedLogin.getRemainingLockoutMinutes()).toBe(0);
  });

  it('should determine if record should be cleaned up', () => {
    const now = new Date();
    const oldRecord = FailedLogin.create({
      ...mockFailedLoginData,
      lastAttemptAt: new Date(now.getTime() - (FAILED_LOGIN_CONSTANTS.CLEANUP_AFTER_DAYS + 1) * 24 * 60 * 60 * 1000)
    });

    const recentRecord = FailedLogin.create({
      ...mockFailedLoginData,
      lastAttemptAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    });

    expect(oldRecord.shouldCleanup()).toBe(true);
    expect(recentRecord.shouldCleanup()).toBe(false);
  });

  it('should reset failed login attempts', () => {
    const failedLogin = FailedLogin.create({
      ...mockFailedLoginData,
      attempts: 5,
      lockedUntil: new Date()
    });

    const resetFailedLogin = failedLogin.reset();

    expect(resetFailedLogin.attempts).toBe(0);
    expect(resetFailedLogin.lockedUntil).toBeUndefined();
    expect(resetFailedLogin.updatedAt.getTime()).toBeGreaterThan(failedLogin.updatedAt.getTime());
    expect(resetFailedLogin.id).toBe(failedLogin.id); // ID should remain the same
  });

  it('should get attempts remaining', () => {
    const failedLogin = FailedLogin.create({
      ...mockFailedLoginData,
      attempts: 2
    });

    const attemptsRemaining = failedLogin.getAttemptsRemaining();
    expect(attemptsRemaining).toBe(FAILED_LOGIN_CONSTANTS.MAX_ATTEMPTS - 2);
  });

  it('should handle edge case when attempts exceed max', () => {
    const failedLogin = FailedLogin.create({
      ...mockFailedLoginData,
      attempts: FAILED_LOGIN_CONSTANTS.MAX_ATTEMPTS + 2
    });

    const attemptsRemaining = failedLogin.getAttemptsRemaining();
    expect(attemptsRemaining).toBe(0);
  });
});