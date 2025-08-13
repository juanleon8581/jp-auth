import '../../../setup';
import {
  IAppRepository,
  FindManyAppsOptions,
  CountAppsOptions,
  AppRepositoryError,
  AppNotFoundError,
  AppAlreadyExistsError,
  AppValidationError,
  OriginNotAllowedError,
  LastOriginRemovalError
} from '../app.repository';
import { AppEntity, CreateAppData, UpdateAppData } from '../../entities/app.entity';

// Mock implementation for testing interface compliance
class MockAppRepository implements IAppRepository {
  private apps: Map<string, AppEntity> = new Map();
  private nextId = 1;

  async create(appData: CreateAppData): Promise<AppEntity> {
    const id = `app-${this.nextId++}`;
    const now = new Date();
    const apiKey = `ak_${Math.random().toString(36).substring(2, 15)}`;
    
    const app = AppEntity.create({
      id,
      name: appData.name,
      api_key: apiKey,
      allowed_origins: appData.allowed_origins || ['http://localhost:3000'],
      created_at: now,
      updated_at: now
    });
    this.apps.set(id, app);
    return app;
  }

  async findById(id: string): Promise<AppEntity | null> {
    return this.apps.get(id) || null;
  }

  async findByApiKey(apiKey: string): Promise<AppEntity | null> {
    for (const app of this.apps.values()) {
      if (app.api_key === apiKey) {
        return app;
      }
    }
    return null;
  }

  async findByName(name: string): Promise<AppEntity | null> {
    for (const app of this.apps.values()) {
      if (app.name === name) {
        return app;
      }
    }
    return null;
  }

  async findMany(options?: FindManyAppsOptions): Promise<AppEntity[]> {
    let apps = Array.from(this.apps.values());
    
    if (options?.limit) {
      apps = apps.slice(0, options.limit);
    }
    
    return apps;
  }

  async count(options?: CountAppsOptions): Promise<number> {
    return this.apps.size;
  }

  async exists(id: string): Promise<boolean> {
    return this.apps.has(id);
  }

  async existsByApiKey(apiKey: string): Promise<boolean> {
    return (await this.findByApiKey(apiKey)) !== null;
  }

  async existsByName(name: string): Promise<boolean> {
    return (await this.findByName(name)) !== null;
  }

  async update(id: string, appData: UpdateAppData): Promise<AppEntity> {
    const app = this.apps.get(id);
    if (!app) {
      throw new AppNotFoundError(id);
    }
    
    const updatedApp = app.update(appData);
    this.apps.set(id, updatedApp);
    return updatedApp;
  }

  async regenerateApiKey(id: string): Promise<AppEntity> {
    const app = this.apps.get(id);
    if (!app) {
      throw new AppNotFoundError(id);
    }
    
    const newApiKey = `ak_${Math.random().toString(36).substring(2, 15)}`;
    const updatedApp = AppEntity.create({
      ...app.toJSON(),
      api_key: newApiKey,
      updated_at: new Date()
    });
    this.apps.set(id, updatedApp);
    return updatedApp;
  }

  async addAllowedOrigin(id: string, origin: string): Promise<AppEntity> {
    const app = this.apps.get(id);
    if (!app) {
      throw new AppNotFoundError(id);
    }
    
    const updatedApp = app.addAllowedOrigin(origin);
    this.apps.set(id, updatedApp);
    return updatedApp;
  }

  async removeAllowedOrigin(id: string, origin: string): Promise<AppEntity> {
    const app = this.apps.get(id);
    if (!app) {
      throw new AppNotFoundError(id);
    }
    
    const updatedApp = app.removeAllowedOrigin(origin);
    this.apps.set(id, updatedApp);
    return updatedApp;
  }

  async delete(id: string): Promise<void> {
    if (!this.apps.has(id)) {
      throw new AppNotFoundError(id);
    }
    this.apps.delete(id);
  }

  async validateApiKey(apiKey: string): Promise<AppEntity | null> {
    return this.findByApiKey(apiKey);
  }

  async validateOrigin(apiKey: string, origin: string): Promise<boolean> {
    const app = await this.findByApiKey(apiKey);
    if (!app) {
      return false;
    }
    return app.isOriginAllowed(origin);
  }
}

describe('App Repository Interface', () => {
  let repository: MockAppRepository;
  
  beforeEach(() => {
    repository = new MockAppRepository();
  });

  describe('Create operations', () => {
    it('should create an app', async () => {
      const appData: CreateAppData = {
        name: 'Test App',
        allowed_origins: ['https://example.com']
      };

      const app = await repository.create(appData);

      expect(app.name).toBe(appData.name);
      expect(app.allowed_origins).toEqual(appData.allowed_origins);
      expect(app.id).toBeDefined();
      expect(app.api_key).toBeDefined();
    });
  });

  describe('Read operations', () => {
    let testApp: AppEntity;

    beforeEach(async () => {
      testApp = await repository.create({
        name: 'Test App',
        allowed_origins: ['https://example.com']
      });
    });

    it('should find app by id', async () => {
      const foundApp = await repository.findById(testApp.id);
      expect(foundApp).not.toBeNull();
      expect(foundApp!.id).toBe(testApp.id);
    });

    it('should return null for non-existent app id', async () => {
      const foundApp = await repository.findById('non-existent-id');
      expect(foundApp).toBeNull();
    });

    it('should find app by API key', async () => {
      const foundApp = await repository.findByApiKey(testApp.api_key);
      expect(foundApp).not.toBeNull();
      expect(foundApp!.api_key).toBe(testApp.api_key);
    });

    it('should return null for non-existent API key', async () => {
      const foundApp = await repository.findByApiKey('non-existent-key');
      expect(foundApp).toBeNull();
    });

    it('should find app by name', async () => {
      const foundApp = await repository.findByName(testApp.name);
      expect(foundApp).not.toBeNull();
      expect(foundApp!.name).toBe(testApp.name);
    });

    it('should return null for non-existent name', async () => {
      const foundApp = await repository.findByName('Non-existent App');
      expect(foundApp).toBeNull();
    });

    it('should find many apps with options', async () => {
      await repository.create({
        name: 'App 2',
        allowed_origins: ['https://app2.com']
      });

      const options: FindManyAppsOptions = {
        limit: 1
      };

      const apps = await repository.findMany(options);
      expect(apps).toHaveLength(1);
    });

    it('should count apps', async () => {
      const count = await repository.count();
      expect(count).toBe(1);
    });

    it('should check if app exists by id', async () => {
      const exists = await repository.exists(testApp.id);
      expect(exists).toBe(true);

      const notExists = await repository.exists('non-existent-id');
      expect(notExists).toBe(false);
    });

    it('should check if app exists by API key', async () => {
      const exists = await repository.existsByApiKey(testApp.api_key);
      expect(exists).toBe(true);

      const notExists = await repository.existsByApiKey('non-existent-key');
      expect(notExists).toBe(false);
    });

    it('should check if app exists by name', async () => {
      const exists = await repository.existsByName(testApp.name);
      expect(exists).toBe(true);

      const notExists = await repository.existsByName('Non-existent App');
      expect(notExists).toBe(false);
    });
  });

  describe('Update operations', () => {
    let testApp: AppEntity;

    beforeEach(async () => {
      testApp = await repository.create({
        name: 'Test App',
        allowed_origins: ['https://example.com']
      });
    });

    it('should update app', async () => {
      const updateData: UpdateAppData = {
        name: 'Updated App Name',
        allowed_origins: ['https://updated.com']
      };

      const updatedApp = await repository.update(testApp.id, updateData);

      expect(updatedApp.name).toBe(updateData.name);
      expect(updatedApp.allowed_origins).toEqual(updateData.allowed_origins);
      expect(updatedApp.id).toBe(testApp.id);
    });

    it('should throw error when updating non-existent app', async () => {
      await expect(repository.update('non-existent-id', { name: 'New Name' }))
        .rejects.toThrow(AppNotFoundError);
    });

    it('should regenerate API key', async () => {
      const originalApiKey = testApp.api_key;
      const updatedApp = await repository.regenerateApiKey(testApp.id);

      expect(updatedApp.api_key).not.toBe(originalApiKey);
      expect(updatedApp.id).toBe(testApp.id);
    });

    it('should add allowed origin', async () => {
      const newOrigin = 'https://neworigin.com';
      const updatedApp = await repository.addAllowedOrigin(testApp.id, newOrigin);

      expect(updatedApp.allowed_origins).toContain(newOrigin);
      expect(updatedApp.allowed_origins).toContain('https://example.com');
    });

    it('should remove allowed origin', async () => {
      // First add another origin so we don't remove the last one
      await repository.addAllowedOrigin(testApp.id, 'https://another.com');
      
      const updatedApp = await repository.removeAllowedOrigin(testApp.id, 'https://example.com');
      expect(updatedApp.allowed_origins).not.toContain('https://example.com');
      expect(updatedApp.allowed_origins).toContain('https://another.com');
    });
  });

  describe('Delete operations', () => {
    let testApp: AppEntity;

    beforeEach(async () => {
      testApp = await repository.create({
        name: 'Test App',
        allowed_origins: ['https://example.com']
      });
    });

    it('should delete app', async () => {
      await repository.delete(testApp.id);

      const foundApp = await repository.findById(testApp.id);
      expect(foundApp).toBeNull();
    });

    it('should throw error when deleting non-existent app', async () => {
      await expect(repository.delete('non-existent-id'))
        .rejects.toThrow(AppNotFoundError);
    });
  });

  describe('Validation operations', () => {
    let testApp: AppEntity;

    beforeEach(async () => {
      testApp = await repository.create({
        name: 'Test App',
        allowed_origins: ['https://example.com']
      });
    });

    it('should validate API key', async () => {
      const validatedApp = await repository.validateApiKey(testApp.api_key);
      expect(validatedApp).not.toBeNull();
      expect(validatedApp!.id).toBe(testApp.id);
    });

    it('should return null for invalid API key', async () => {
      const validatedApp = await repository.validateApiKey('invalid-key');
      expect(validatedApp).toBeNull();
    });

    it('should validate origin', async () => {
      const isValid = await repository.validateOrigin(testApp.api_key, 'https://example.com');
      expect(isValid).toBe(true);

      const isInvalid = await repository.validateOrigin(testApp.api_key, 'https://notallowed.com');
      expect(isInvalid).toBe(false);
    });
  });
});

describe('App Repository Errors', () => {
  it('should create AppRepositoryError with code', () => {
    const error = new AppRepositoryError('Test error', 'TEST_CODE');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error).toBeInstanceOf(Error);
  });

  it('should create AppNotFoundError', () => {
    const error = new AppNotFoundError('app-123');
    expect(error.message).toBe('App not found: app-123');
    expect(error.code).toBe('APP_NOT_FOUND');
    expect(error).toBeInstanceOf(AppRepositoryError);
  });

  it('should create AppAlreadyExistsError', () => {
    const error = new AppAlreadyExistsError('Test App');
    expect(error.message).toBe('App already exists with name: Test App');
    expect(error.code).toBe('APP_ALREADY_EXISTS');
    expect(error).toBeInstanceOf(AppRepositoryError);
  });

  it('should create AppValidationError', () => {
    const error = new AppValidationError('Invalid app name');
    expect(error.message).toBe('App validation error: Invalid app name');
    expect(error.code).toBe('APP_VALIDATION_ERROR');
    expect(error).toBeInstanceOf(AppRepositoryError);
  });

  it('should create OriginNotAllowedError', () => {
    const error = new OriginNotAllowedError('https://example.com', 'Test App');
    expect(error.message).toBe("Origin 'https://example.com' is not allowed for app 'Test App'");
    expect(error.code).toBe('ORIGIN_NOT_ALLOWED');
    expect(error).toBeInstanceOf(AppRepositoryError);
  });

  it('should create AppValidationError', () => {
    const error = new AppValidationError('Invalid app name');
    expect(error.message).toBe('App validation error: Invalid app name');
    expect(error.code).toBe('APP_VALIDATION_ERROR');
    expect(error).toBeInstanceOf(AppRepositoryError);
  });

  it('should create LastOriginRemovalError', () => {
    const error = new LastOriginRemovalError();
    expect(error.message).toBe('Cannot remove the last allowed origin from an app');
    expect(error.code).toBe('LAST_ORIGIN_REMOVAL');
    expect(error).toBeInstanceOf(AppRepositoryError);
  });
});