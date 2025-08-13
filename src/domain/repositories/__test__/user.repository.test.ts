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
import { UserEntity, CreateUserData, UpdateUserData } from '../../entities/user.entity';

// Mock implementation for testing interface compliance
class MockUserRepository implements IUserRepository {
  private users: Map<string, UserEntity> = new Map();
  private nextId = 1;

  async create(userData: CreateUserData): Promise<UserEntity> {
    const id = `user-${this.nextId++}`;
    const now = new Date();
    const user = UserEntity.create({
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

  async findById(id: string): Promise<UserEntity | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async findMany(options?: FindManyUsersOptions): Promise<UserEntity[]> {
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

  async update(id: string, userData: UpdateUserData): Promise<UserEntity> {
    const user = this.users.get(id);
    if (!user) {
      throw new UserNotFoundError(`UserEntity with id ${id} not found`);
    }
    
    const updatedUser = user.update(userData);
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateEmailVerification(id: string, verified: boolean): Promise<UserEntity> {
    const user = this.users.get(id);
    if (!user) {
      throw new UserNotFoundError(`UserEntity with id ${id} not found`);
    }
    
    const updatedUser = UserEntity.create({
      ...user.toJSON(),
      email_verified: verified,
      updated_at: new Date()
    });
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async delete(id: string): Promise<void> {
    if (!this.users.has(id)) {
      throw new UserNotFoundError(`UserEntity with id ${id} not found`);
    }
    this.users.delete(id);
  }

  async softDelete(id: string): Promise<UserEntity> {
    const user = this.users.get(id);
    if (!user) {
      throw new UserNotFoundError(`UserEntity with id ${id} not found`);
    }
    
    const deletedUser = UserEntity.create({
       ...user.toJSON(),
       updated_at: new Date()
     });
    this.users.set(id, deletedUser);
    return deletedUser;
  }

  async createMany(usersData: CreateUserData[]): Promise<UserEntity[]> {
    const users: UserEntity[] = [];
    for (const userData of usersData) {
      users.push(await this.create(userData));
    }
    return users;
  }

  async updateMany(ids: string[], userData: Partial<UpdateUserData>): Promise<UserEntity[]> {
    const users: UserEntity[] = [];
    for (const id of ids) {
      users.push(await this.update(id, userData as UpdateUserData));
    }
    return users;
  }

  async deleteMany(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.delete(id);
    }
  }
}

describe('UserEntity Repository Interface', () => {
  let repository: MockUserRepository;
  
  beforeEach(() => {
    repository = new MockUserRepository();
  });

  describe('create', () => {
    it('should create a new user', async () => {
       const userData: CreateUserData = {
         email: 'test@example.com',
         password: 'password123',
         name: 'Test UserEntity',
         phone: '+1234567890'
       };

      const user = await repository.create(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.phone).toBe(userData.phone);
      expect(user.id).toBeDefined();
      expect(user.created_at).toBeInstanceOf(Date);
      expect(user.updated_at).toBeInstanceOf(Date);
    });

    it('should create user with minimal data', async () => {
       const userData: CreateUserData = {
         email: 'minimal@example.com',
         password: 'password123',
         name: 'Minimal UserEntity'
       };

      const user = await repository.create(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.phone).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
       const userData: CreateUserData = {
         email: 'find@example.com',
         password: 'password123',
         name: 'Find UserEntity'
       };

      const createdUser = await repository.create(userData);
      const foundUser = await repository.findById(createdUser.id);

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.email).toBe(userData.email);
    });

    it('should return null for non-existent id', async () => {
      const foundUser = await repository.findById('non-existent-id');
      expect(foundUser).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
       const userData: CreateUserData = {
         email: 'email@example.com',
         password: 'password123',
         name: 'Email UserEntity'
       };

      await repository.create(userData);
      const foundUser = await repository.findByEmail(userData.email);

      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe(userData.email);
    });

    it('should return null for non-existent email', async () => {
      const foundUser = await repository.findByEmail('nonexistent@example.com');
      expect(foundUser).toBeNull();
    });
  });

  describe('findMany', () => {
    it('should return all users when no options provided', async () => {
      const userData1: CreateUserData = {
         email: 'user1@example.com',
         password: 'password123',
         name: 'UserEntity 1'
       };
       const userData2: CreateUserData = {
         email: 'user2@example.com',
         password: 'password123',
         name: 'UserEntity 2'
       };

      await repository.create(userData1);
      await repository.create(userData2);

      const users = await repository.findMany();
      expect(users).toHaveLength(2);
    });

    it('should respect limit option', async () => {
      const userData1: CreateUserData = {
         email: 'user1@example.com',
         password: 'password123',
         name: 'UserEntity 1'
       };
       const userData2: CreateUserData = {
         email: 'user2@example.com',
         password: 'password123',
         name: 'UserEntity 2'
       };

      await repository.create(userData1);
      await repository.create(userData2);

      const users = await repository.findMany({ limit: 1 });
      expect(users).toHaveLength(1);
    });
  });

  describe('count', () => {
    it('should return correct count', async () => {
      expect(await repository.count()).toBe(0);

      await repository.create({
         email: 'count1@example.com',
         password: 'password123',
         name: 'Count UserEntity 1'
       });
      expect(await repository.count()).toBe(1);

      await repository.create({
         email: 'count2@example.com',
         password: 'password123',
         name: 'Count UserEntity 2'
       });
      expect(await repository.count()).toBe(2);
    });
  });

  describe('exists', () => {
    it('should return true for existing user', async () => {
      const user = await repository.create({
         email: 'exists@example.com',
         password: 'password123',
         name: 'Exists UserEntity'
       });

      expect(await repository.exists(user.id)).toBe(true);
    });

    it('should return false for non-existing user', async () => {
      expect(await repository.exists('non-existent-id')).toBe(false);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const user = await repository.create({
         email: 'update@example.com',
         password: 'password123',
         name: 'Original Name'
       });

      const updateData: UpdateUserData = {
        name: 'Updated Name',
        phone: '+9876543210'
      };

      const updatedUser = await repository.update(user.id, updateData);

      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.phone).toBe(updateData.phone);
      expect(updatedUser.email).toBe(user.email); // Should remain unchanged
    });

    it('should throw error for non-existent user', async () => {
      const updateData: UpdateUserData = {
        name: 'Updated Name'
      };

      await expect(repository.update('non-existent-id', updateData))
        .rejects.toThrow(UserNotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const user = await repository.create({
         email: 'delete@example.com',
         password: 'password123',
         name: 'Delete UserEntity'
       });

      await repository.delete(user.id);
      const foundUser = await repository.findById(user.id);
      expect(foundUser).toBeNull();
    });

    it('should throw error for non-existent user', async () => {
      await expect(repository.delete('non-existent-id'))
        .rejects.toThrow(UserNotFoundError);
    });
  });
});

describe('UserEntity Repository Errors', () => {
  it('should have proper error hierarchy', () => {
    const baseError = new UserRepositoryError('Base error', 'BASE_ERROR');
     const notFoundError = new UserNotFoundError('user-123');
     const alreadyExistsError = new UserAlreadyExistsError('test@example.com');
     const validationError = new UserValidationError('Validation failed');

    expect(baseError).toBeInstanceOf(Error);
    expect(notFoundError).toBeInstanceOf(UserRepositoryError);
    expect(alreadyExistsError).toBeInstanceOf(UserRepositoryError);
    expect(validationError).toBeInstanceOf(UserRepositoryError);

    expect(baseError.name).toBe('UserRepositoryError');
    expect(notFoundError.name).toBe('UserNotFoundError');
    expect(alreadyExistsError.name).toBe('UserAlreadyExistsError');
    expect(validationError.name).toBe('UserValidationError');
  });
});