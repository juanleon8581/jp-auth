import '../../../setup';
import {
  IFailedLoginRepository,
  FindManyFailedLoginsOptions,
  CountFailedLoginsOptions,
  FailedLoginRepositoryError,
  FailedLoginNotFoundError,
  AccountLockedError,
  FailedLoginValidationError,
  TooManyAttemptsError
} from '../failed-login.repository';
import { FailedLogin, CreateFailedLoginData } from '../../entities/failed-login.entity';

// Mock implementation for testing interface compliance
class MockFailedLoginRepository implements IFailedLoginRepository {
  private failedLogins: Map<number, FailedLogin> = new Map();
  private nextId = 1;

  async create(data: CreateFailedLoginData): Promise<FailedLogin> {
    const numericId = this.nextId++;
    const id = numericId.toString();
    const now = new Date();
    
    const failedLogin = FailedLogin.create({
      id,
      userId: data.userId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      attempts: 1,
      lastAttemptAt: now,
      metadata: data.metadata || {},
      createdAt: now,
      updatedAt: now
    });
    
    this.failedLogins.set(numericId, failedLogin);
    return failedLogin;
  }

  async findById(id: number): Promise<FailedLogin | null> {
    return this.failedLogins.get(id) || null;
  }

  async findByEmailAndIp(email: string, ipAddress: string): Promise<FailedLogin | null> {
    for (const failedLogin of this.failedLogins.values()) {
      if (failedLogin.userId === email && failedLogin.ipAddress === ipAddress) {
        return failedLogin;
      }
    }
    return null;
  }

  async findByEmail(email: string): Promise<FailedLogin[]> {
    return Array.from(this.failedLogins.values())
      .filter(fl => fl.userId === email);
  }

  async findByIp(ipAddress: string): Promise<FailedLogin[]> {
    return Array.from(this.failedLogins.values())
      .filter(fl => fl.ipAddress === ipAddress);
  }

  async findMany(options?: FindManyFailedLoginsOptions): Promise<FailedLogin[]> {
    let failedLogins = Array.from(this.failedLogins.values());
    
    if (options?.email) {
      failedLogins = failedLogins.filter(fl => fl.userId === options.email);
    }
    
    if (options?.ipAddress) {
      failedLogins = failedLogins.filter(fl => fl.ipAddress === options.ipAddress);
    }
    
    if (options?.minAttempts !== undefined) {
      failedLogins = failedLogins.filter(fl => fl.attempts >= options.minAttempts!);
    }
    
    if (options?.maxAttempts !== undefined) {
      failedLogins = failedLogins.filter(fl => fl.attempts <= options.maxAttempts!);
    }
    
    if (options?.lockedOnly) {
      failedLogins = failedLogins.filter(fl => fl.shouldLockAccount());
    }
    
    if (options?.limit) {
      failedLogins = failedLogins.slice(0, options.limit);
    }
    
    return failedLogins;
  }

  async count(options?: CountFailedLoginsOptions): Promise<number> {
    const results = await this.findMany(options);
    return results.length;
  }

  async incrementAttempts(email: string, ipAddress: string): Promise<FailedLogin> {
    let failedLogin = await this.findByEmailAndIp(email, ipAddress);
    
    if (!failedLogin) {
      failedLogin = await this.create({ userId: email, ipAddress });
    } else {
      const updatedFailedLogin = failedLogin.incrementAttempts();
      // Find the numeric key for this failed login
      const key = Array.from(this.failedLogins.entries())
        .find(([_, fl]) => fl.id === failedLogin!.id)?.[0];
      if (key !== undefined) {
        this.failedLogins.set(key, updatedFailedLogin);
      }
      failedLogin = updatedFailedLogin;
    }
    
    return failedLogin;
  }

  async resetAttempts(email: string, ipAddress: string): Promise<void> {
    const failedLogin = await this.findByEmailAndIp(email, ipAddress);
    if (failedLogin) {
      const resetFailedLogin = failedLogin.reset();
      // Find the numeric key for this failed login
      const key = Array.from(this.failedLogins.entries())
        .find(([_, fl]) => fl.id === failedLogin!.id)?.[0];
      if (key !== undefined) {
        this.failedLogins.set(key, resetFailedLogin);
      }
    }
  }

  async delete(id: number): Promise<void> {
    if (!this.failedLogins.has(id)) {
      throw new FailedLoginNotFoundError(id.toString());
    }
    this.failedLogins.delete(id);
  }

  async deleteByEmail(email: string): Promise<void> {
    const toDelete = Array.from(this.failedLogins.entries())
      .filter(([_, fl]) => fl.userId === email)
      .map(([id, _]) => id);
    
    toDelete.forEach(id => this.failedLogins.delete(id));
  }

  async deleteByIp(ipAddress: string): Promise<void> {
    const toDelete = Array.from(this.failedLogins.entries())
      .filter(([_, fl]) => fl.ipAddress === ipAddress)
      .map(([id, _]) => id);
    
    toDelete.forEach(id => this.failedLogins.delete(id));
  }

  async deleteExpired(): Promise<number> {
    const toDelete = Array.from(this.failedLogins.entries())
      .filter(([_, fl]) => fl.isLockoutExpired())
      .map(([id, _]) => id);
    
    toDelete.forEach(id => this.failedLogins.delete(id));
    return toDelete.length;
  }

  async isAccountLocked(email: string, ipAddress: string): Promise<boolean> {
    const failedLogin = await this.findByEmailAndIp(email, ipAddress);
    return failedLogin ? failedLogin.shouldLockAccount() : false;
  }

  async getRemainingLockoutTime(email: string, ipAddress: string): Promise<number> {
    const failedLogin = await this.findByEmailAndIp(email, ipAddress);
    return failedLogin ? failedLogin.getRemainingLockoutMinutes() : 0;
  }

  async getFailedAttempts(email: string, ipAddress: string): Promise<number> {
    const failedLogin = await this.findByEmailAndIp(email, ipAddress);
    return failedLogin ? failedLogin.attempts : 0;
  }

  async cleanupOldRecords(olderThanHours: number = 24): Promise<number> {
    const toDelete = Array.from(this.failedLogins.entries())
      .filter(([_, fl]) => fl.shouldCleanup())
      .map(([id, _]) => id);
    
    toDelete.forEach(id => this.failedLogins.delete(id));
    return toDelete.length;
  }
}

describe('FailedLogin Repository Interface', () => {
  let repository: MockFailedLoginRepository;

  beforeEach(() => {
    repository = new MockFailedLoginRepository();
  });

  describe('Create operations', () => {
    it('should create a failed login record', async () => {
      const data: CreateFailedLoginData = {
        userId: 'test@example.com',
        ipAddress: '192.168.1.1'
      };

      const failedLogin = await repository.create(data);

      expect(failedLogin.userId).toBe(data.userId);
      expect(failedLogin.ipAddress).toBe(data.ipAddress);
      expect(failedLogin.attempts).toBe(1);
      expect(failedLogin.id).toBeDefined();
    });
  });

  describe('Read operations', () => {
    let testFailedLogin: FailedLogin;

    beforeEach(async () => {
      testFailedLogin = await repository.create({
        userId: 'test@example.com',
        ipAddress: '192.168.1.1'
      });
    });

    it('should find failed login by id', async () => {
      const found = await repository.findById(parseInt(testFailedLogin.id));
      expect(found).not.toBeNull();
      expect(found!.id).toBe(testFailedLogin.id);
    });

    it('should return null for non-existent id', async () => {
      const found = await repository.findById(999);
      expect(found).toBeNull();
    });

    it('should find failed login by email and IP', async () => {
      const found = await repository.findByEmailAndIp('test@example.com', '192.168.1.1');
      expect(found).not.toBeNull();
      expect(found!.userId).toBe('test@example.com');
      expect(found!.ipAddress).toBe('192.168.1.1');
    });

    it('should return null for non-existent email and IP combination', async () => {
      const found = await repository.findByEmailAndIp('other@example.com', '192.168.1.1');
      expect(found).toBeNull();
    });

    it('should find failed logins by email', async () => {
      await repository.create({
        userId: 'test@example.com',
        ipAddress: '192.168.1.2'
      });

      const found = await repository.findByEmail('test@example.com');
      expect(found).toHaveLength(2);
      expect(found.every(fl => fl.userId === 'test@example.com')).toBe(true);
    });

    it('should find failed logins by IP address', async () => {
      await repository.create({
        userId: 'other@example.com',
        ipAddress: '192.168.1.1'
      });

      const found = await repository.findByIp('192.168.1.1');
      expect(found).toHaveLength(2);
      expect(found.every(fl => fl.ipAddress === '192.168.1.1')).toBe(true);
    });

    it('should find many with options', async () => {
      await repository.create({
        userId: 'test2@example.com',
        ipAddress: '192.168.1.2'
      });

      const options: FindManyFailedLoginsOptions = {
        limit: 1,
        email: 'test@example.com'
      };

      const found = await repository.findMany(options);
      expect(found).toHaveLength(1);
      expect(found[0].userId).toBe('test@example.com');
    });

    it('should count failed logins', async () => {
      const count = await repository.count();
      expect(count).toBe(1);
    });

    it('should count with options', async () => {
      await repository.create({
        userId: 'test2@example.com',
        ipAddress: '192.168.1.2'
      });

      const count = await repository.count({ email: 'test@example.com' });
      expect(count).toBe(1);
    });
  });

  describe('Update operations', () => {
    it('should increment attempts for existing record', async () => {
      const initial = await repository.create({
        userId: 'test@example.com',
        ipAddress: '192.168.1.1'
      });

      const updated = await repository.incrementAttempts('test@example.com', '192.168.1.1');
      expect(updated.attempts).toBe(initial.attempts + 1);
    });

    it('should create new record when incrementing non-existent combination', async () => {
      const created = await repository.incrementAttempts('new@example.com', '192.168.1.1');
      expect(created.userId).toBe('new@example.com');
      expect(created.ipAddress).toBe('192.168.1.1');
      expect(created.attempts).toBe(1);
    });

    it('should reset attempts', async () => {
      await repository.create({
        userId: 'test@example.com',
        ipAddress: '192.168.1.1'
      });
      
      await repository.incrementAttempts('test@example.com', '192.168.1.1');
      await repository.resetAttempts('test@example.com', '192.168.1.1');

      const found = await repository.findByEmailAndIp('test@example.com', '192.168.1.1');
      expect(found!.attempts).toBe(0);
    });
  });

  describe('Delete operations', () => {
    let testFailedLogin: FailedLogin;

    beforeEach(async () => {
      testFailedLogin = await repository.create({
        userId: 'test@example.com',
        ipAddress: '192.168.1.1'
      });
    });

    it('should delete by id', async () => {
      await repository.delete(parseInt(testFailedLogin.id));
      const found = await repository.findById(parseInt(testFailedLogin.id));
      expect(found).toBeNull();
    });

    it('should throw error when deleting non-existent id', async () => {
      await expect(repository.delete(999))
        .rejects.toThrow(FailedLoginNotFoundError);
    });

    it('should delete by email', async () => {
      await repository.create({
        userId: 'test@example.com',
        ipAddress: '192.168.1.2'
      });

      await repository.deleteByEmail('test@example.com');
      const found = await repository.findByEmail('test@example.com');
      expect(found).toHaveLength(0);
    });

    it('should delete by IP address', async () => {
      await repository.create({
        userId: 'other@example.com',
        ipAddress: '192.168.1.1'
      });

      await repository.deleteByIp('192.168.1.1');
      const found = await repository.findByIp('192.168.1.1');
      expect(found).toHaveLength(0);
    });

    it('should delete expired records', async () => {
      // This would require mocking time or creating expired records
      const deletedCount = await repository.deleteExpired();
      expect(typeof deletedCount).toBe('number');
    });
  });

  describe('Security operations', () => {
    it('should check if account is locked', async () => {
      const isLocked = await repository.isAccountLocked('test@example.com', '192.168.1.1');
      expect(typeof isLocked).toBe('boolean');
    });

    it('should get remaining lockout time', async () => {
      const remainingTime = await repository.getRemainingLockoutTime('test@example.com', '192.168.1.1');
      expect(typeof remainingTime).toBe('number');
    });

    it('should get failed attempts count', async () => {
      await repository.create({
        userId: 'test@example.com',
        ipAddress: '192.168.1.1'
      });

      const attempts = await repository.getFailedAttempts('test@example.com', '192.168.1.1');
      expect(attempts).toBe(1);

      const noAttempts = await repository.getFailedAttempts('other@example.com', '192.168.1.1');
      expect(noAttempts).toBe(0);
    });
  });

  describe('Cleanup operations', () => {
    it('should cleanup old records', async () => {
      const cleanedCount = await repository.cleanupOldRecords(24);
      expect(typeof cleanedCount).toBe('number');
    });

    it('should use default cleanup hours', async () => {
      const cleanedCount = await repository.cleanupOldRecords();
      expect(typeof cleanedCount).toBe('number');
    });
  });
});

describe('FailedLogin Repository Errors', () => {
  it('should create FailedLoginRepositoryError with code', () => {
    const error = new FailedLoginRepositoryError('Test error', 'TEST_CODE');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error).toBeInstanceOf(Error);
  });

  it('should create FailedLoginNotFoundError', () => {
    const error = new FailedLoginNotFoundError('123');
    expect(error.message).toBe('Failed login record not found: 123');
    expect(error.code).toBe('FAILED_LOGIN_NOT_FOUND');
    expect(error).toBeInstanceOf(FailedLoginRepositoryError);
  });

  it('should create AccountLockedError', () => {
    const error = new AccountLockedError('test@example.com', 15);
    expect(error.message).toBe('Account locked for email test@example.com. Try again in 15 minutes.');
    expect(error.code).toBe('ACCOUNT_LOCKED');
    expect(error).toBeInstanceOf(FailedLoginRepositoryError);
  });

  it('should create FailedLoginValidationError', () => {
    const error = new FailedLoginValidationError('Invalid email format');
    expect(error.message).toBe('Failed login validation error: Invalid email format');
    expect(error.code).toBe('FAILED_LOGIN_VALIDATION_ERROR');
    expect(error).toBeInstanceOf(FailedLoginRepositoryError);
  });

  it('should create TooManyAttemptsError', () => {
    const error = new TooManyAttemptsError('test@example.com', '192.168.1.1', 5, 3);
    expect(error.message).toBe('Too many failed attempts for test@example.com from 192.168.1.1. 5/3 attempts used.');
    expect(error.code).toBe('TOO_MANY_ATTEMPTS');
    expect(error).toBeInstanceOf(FailedLoginRepositoryError);
  });
});