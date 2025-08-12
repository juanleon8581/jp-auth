import '../../../setup';
import { App, CreateAppData, UpdateAppData } from '../app.entity';

describe('App Entity', () => {
  const mockAppData = {
    id: 'app-123',
    name: 'Test App',
    api_key: 'test-api-key-123',
    allowed_origins: ['http://localhost:3000', 'https://example.com'],
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  };

  it('should create an app from data', () => {
    const app = App.create(mockAppData);

    expect(app.id).toBe(mockAppData.id);
    expect(app.name).toBe(mockAppData.name);
    expect(app.api_key).toBe(mockAppData.api_key);
    expect(app.allowed_origins).toEqual(mockAppData.allowed_origins);
    expect(app.created_at).toBe(mockAppData.created_at);
    expect(app.updated_at).toBe(mockAppData.updated_at);
  });

  it('should create app from raw data', () => {
    const app = App.fromRaw(mockAppData);

    expect(app.id).toBe(mockAppData.id);
    expect(app.name).toBe(mockAppData.name);
    expect(app.api_key).toBe(mockAppData.api_key);
    expect(app.allowed_origins).toEqual(mockAppData.allowed_origins);
  });

  it('should convert to JSON', () => {
    const app = App.create(mockAppData);
    const json = app.toJSON();

    expect(json).toEqual(mockAppData);
  });

  it('should update app data', () => {
    const app = App.create(mockAppData);
    const updateData: UpdateAppData = {
      name: 'Updated App Name',
      allowed_origins: ['https://updated.com']
    };

    const updatedApp = app.update(updateData);

    expect(updatedApp.name).toBe(updateData.name);
    expect(updatedApp.allowed_origins).toEqual(updateData.allowed_origins);
    expect(updatedApp.id).toBe(app.id); // ID should remain the same
    expect(updatedApp.api_key).toBe(app.api_key); // API key should remain the same
    expect(updatedApp.updated_at.getTime()).toBeGreaterThan(app.updated_at.getTime());
  });

  it('should check if origin is allowed', () => {
    const app = App.create(mockAppData);

    expect(app.isOriginAllowed('http://localhost:3000')).toBe(true);
    expect(app.isOriginAllowed('https://example.com')).toBe(true);
    expect(app.isOriginAllowed('https://notallowed.com')).toBe(false);
  });

  it('should get public app data without API key', () => {
    const app = App.create(mockAppData);
    const publicData = app.toPublic();

    expect(publicData.id).toBe(mockAppData.id);
    expect(publicData.name).toBe(mockAppData.name);
    expect(publicData.allowed_origins).toEqual(mockAppData.allowed_origins);
    expect(publicData).not.toHaveProperty('api_key');
  });

  it('should validate API key', () => {
    const app = App.create(mockAppData);

    expect(app.validateApiKey(mockAppData.api_key)).toBe(true);
    expect(app.validateApiKey('wrong-api-key')).toBe(false);
  });

  it('should check if can update with valid data', () => {
    const app = App.create(mockAppData);
    const validUpdateData: UpdateAppData = { name: 'New Name' };
    const invalidUpdateData = null;

    expect(app.canUpdate(validUpdateData)).toBe(true);
    expect(app.canUpdate(invalidUpdateData as any)).toBe(false);
  });

  it('should add allowed origin', () => {
    const app = App.create(mockAppData);
    const newOrigin = 'https://neworigin.com';

    const updatedApp = app.addAllowedOrigin(newOrigin);

    expect(updatedApp.allowed_origins).toContain(newOrigin);
    expect(updatedApp.allowed_origins.length).toBe(mockAppData.allowed_origins.length + 1);
  });

  it('should not add duplicate allowed origin', () => {
    const app = App.create(mockAppData);
    const existingOrigin = mockAppData.allowed_origins[0];

    const updatedApp = app.addAllowedOrigin(existingOrigin);

    expect(updatedApp.allowed_origins.length).toBe(mockAppData.allowed_origins.length);
  });

  it('should remove allowed origin', () => {
    const app = App.create(mockAppData);
    const originToRemove = mockAppData.allowed_origins[0];

    const updatedApp = app.removeAllowedOrigin(originToRemove);

    expect(updatedApp.allowed_origins).not.toContain(originToRemove);
    expect(updatedApp.allowed_origins.length).toBe(mockAppData.allowed_origins.length - 1);
  });
});