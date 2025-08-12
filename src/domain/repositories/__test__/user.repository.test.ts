import '../../../setup';
import {
  IUserRepository,
  FindManyUsersOptions,
  CountUsersOptions,
  UserRepositoryError,
  UserNotFoundError,
  UserAlreadyExistsError,
  UserValidationError
} from '../user.repository';
import { User, CreateUserData, UpdateUserData } from '../../entities/user.entity';

// Mock implementation for testing interface compliance
class MockUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();
  private nextId = 1;

  async create(userData: CreateUserData): Promise<User> {
    const id = `user-${this.nextId++}`;
    const now = new Date();
    const user = User.create({
      id,
      email: userData.email,
      name: userData.name,
      phone: userData.phone || null,
      avatar_url: null,
      email_verified: false,
      created_at: now,
      updated_at: now
    });
    this.users.set(id, user);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async findMany(options?: FindManyUsersOptions): Promise<User[]> {
    let users = Array.from(this.users.values());
    
    if (options?.limit) {
      users = users.slice(0, options.limit);
    }
    
    return users;
  }

  async count(options?: CountUsersOptions): Promise<number> {
    return this.users.size;
  }

  async exists(id: string): Promise<boolean> {
    return this.users.has(id);
  }

  async existsByEmail(email: string): Promise<boolean> {
    return (await this.findByEmail(email)) !== null;
  }

  async update(id: string, userData: UpdateUserData): Promise<User> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      throw new UserNotFoundError(id);
    }

    const updatedUser = existingUser.update(userData);
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateEmailVerification(id: string, verified: boolean): Promise<User> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      throw new UserNotFoundError(id);
    }

    const updatedUser = User.create({
      ...existingUser.toJSON(),
      email_verified: verified,
      updated_at: new Date()
    });
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async delete(id: string): Promise<void> {
    if (!this.users.has(id)) {
      throw new UserNotFoundError(id);
    }
    this.users.delete(id);
  }

  async softDelete(id: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new UserNotFoundError(id);
    }
    // In a real implementation, this would mark the user as deleted
    return user;
  }

  async createMany(usersData: CreateUserData[]): Promise<User[]> {
    const users: User[] = [];
    for (const userData of usersData) {
      users.push(await this.create(userData));
    }
    return users;
  }

  async updateMany(ids: string[], userData: Partial<UpdateUserData>): Promise<User[]> {
    const users: User[] = [];
    for (const id of ids) {
      users.push(await this.update(id, userData));
    }
    return users;
  }

  async deleteMany(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.delete(id);
    }
  }
}

describe('User Repository Interface', () => {
  let repository: MockUserRepository;

  beforeEach(() => {
    repository = new MockUserRepository();
  });

  describe('Create operations', () => {
    it('should create a user', async () => {
      const userData: CreateUserData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '+1234567890'
      };

      const user = await repository.create(userData);

      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.phone).toBe(userData.phone);
      expect(user.id).toBeDefined();
    });

    it('should create multiple users', async () => {
      const usersData: CreateUserData[] = [
        { email: 'user1@example.com', password: 'pass1', name: 'User 1' },
        { email: 'user2@example.com', password: 'pass2', name: 'User 2' }
      ];

      const users = await repository.createMany(usersData);

      expect(users).toHaveLength(2);
      expect(users[0].email).toBe(usersData[0].email);
      expect(users[1].email).toBe(usersData[1].email);
    });
  });

  describe('Read operations', () => {
    let testUser: User;

    beforeEach(async () => {
      testUser = await repository.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
    });

    it('should find user by id', async () => {
      const foundUser = await repository.findById(testUser.id);
      expect(foundUser).not.toBeNull();
      expect(foundUser!.id).toBe(testUser.id);
    });

    it('should return null for non-existent user id', async () => {
      const foundUser = await repository.findById('non-existent-id');
      expect(foundUser).toBeNull();
    });

    it('should find user by email', async () => {
      const foundUser = await repository.findByEmail(testUser.email);
      expect(foundUser).not.toBeNull();
      expect(foundUser!.email).toBe(testUser.email);
    });

    it('should return null for non-existent email', async () => {
      const foundUser = await repository.findByEmail('nonexistent@example.com');
      expect(foundUser).toBeNull();
    });

    it('should find many users with options', async () => {
      await repository.create({
        email: 'user2@example.com',
        password: 'password123',
        name: 'User 2'
      });

      const options: FindManyUsersOptions = {
        limit: 1,
        sortBy: 'created_at',
        sortOrder: 'desc'
      };

      const users = await repository.findMany(options);
      expect(users).toHaveLength(1);
    });

    it('should count users', async () => {
      const count = await repository.count();
      expect(count).toBe(1);
    });

    it('should check if user exists by id', async () => {
      const exists = await repository.exists(testUser.id);
      expect(exists).toBe(true);

      const notExists = await repository.exists('non-existent-id');
      expect(notExists).toBe(false);
    });

    it('should check if user exists by email', async () => {
      const exists = await repository.existsByEmail(testUser.email);
      expect(exists).toBe(true);

      const notExists = await repository.existsByEmail('nonexistent@example.com');
      expect(notExists).toBe(false);
    });
  });

  describe('Update operations', () => {
    let testUser: User;

    beforeEach(async () => {
      testUser = await repository.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
    });

    it('should update user', async () => {
      const updateData: UpdateUserData = {
        name: 'Updated Name',
        phone: '+9876543210'
      };

      const updatedUser = await repository.update(testUser.id, updateData);

      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.phone).toBe(updateData.phone);
      expect(updatedUser.id).toBe(testUser.id);
    });

    it('should throw error when updating non-existent user', async () => {
      await expect(repository.update('non-existent-id', { name: 'New Name' }))
        .rejects.toThrow(UserNotFoundError);
    });

    it('should update email verification status', async () => {
      const updatedUser = await repository.updateEmailVerification(testUser.id, true);

      expect(updatedUser.email_verified).toBe(true);
      expect(updatedUser.id).toBe(testUser.id);
    });

    it('should update many users', async () => {
      const user2 = await repository.create({
        email: 'user2@example.com',
        password: 'password123',
        name: 'User 2'
      });

      const updateData: Partial<UpdateUserData> = {
        name: 'Updated Name'
      };

      const updatedUsers = await repository.updateMany([testUser.id, user2.id], updateData);

      expect(updatedUsers).toHaveLength(2);
      expect(updatedUsers[0].name).toBe('Updated Name');
      expect(updatedUsers[1].name).toBe('Updated Name');
    });
  });

  describe('Delete operations', () => {
    let testUser: User;

    beforeEach(async () => {
      testUser = await repository.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
    });

    it('should delete user', async () => {
      await repository.delete(testUser.id);

      const foundUser = await repository.findById(testUser.id);
      expect(foundUser).toBeNull();
    });

    it('should throw error when deleting non-existent user', async () => {
      await expect(repository.delete('non-existent-id'))
        .rejects.toThrow(UserNotFoundError);
    });

    it('should soft delete user', async () => {
      const deletedUser = await repository.softDelete(testUser.id);
      expect(deletedUser.id).toBe(testUser.id);
    });

    it('should delete many users', async () => {
      const user2 = await repository.create({
        email: 'user2@example.com',
        password: 'password123',
        name: 'User 2'
      });

      await repository.deleteMany([testUser.id, user2.id]);

      const count = await repository.count();
      expect(count).toBe(0);
    });
  });
});

describe('User Repository Errors', () => {
  it('should create UserRepositoryError with code', () => {
    const error = new UserRepositoryError('Test error', 'TEST_CODE');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error).toBeInstanceOf(Error);
  });

  it('should create UserNotFoundError', () => {
    const error = new UserNotFoundError('user-123');
    expect(error.message).toBe('User not found: user-123');
    expect(error.code).toBe('USER_NOT_FOUND');
    expect(error).toBeInstanceOf(UserRepositoryError);
  });

  it('should create UserAlreadyExistsError', () => {
    const error = new UserAlreadyExistsError('test@example.com');
    expect(error.message).toBe('User already exists with email: test@example.com');
    expect(error.code).toBe('USER_ALREADY_EXISTS');
    expect(error).toBeInstanceOf(UserRepositoryError);
  });

  it('should create UserValidationError', () => {
    const error = new UserValidationError('Invalid email format');
    expect(error.message).toBe('User validation error: Invalid email format');
    expect(error.code).toBe('USER_VALIDATION_ERROR');
    expect(error).toBeInstanceOf(UserRepositoryError);
  });
});