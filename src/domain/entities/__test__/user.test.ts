import '../../../setup';
import { User, CreateUserData } from '../user.entity';

describe('User Entity', () => {
  it('should create a user without Zod validation', () => {
    const userData: CreateUserData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      phone: '+1234567890'
    };

    // This should work without any validation since we removed Zod
    expect(() => {
      const user = User.create({
        id: 'test-id',
        email: userData.email,
        name: userData.name,
        phone: userData.phone ?? null,
        avatar_url: null,
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date()
      });
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
    }).not.toThrow();
  });

  it('should update user data without validation', () => {
    const user = User.create({
      id: 'test-id',
      email: 'test@example.com',
      name: 'Test User',
      phone: null,
      avatar_url: null,
      email_verified: false,
      created_at: new Date(),
      updated_at: new Date()
    });

    const updatedUser = user.update({
      name: 'Updated Name',
      phone: '+9876543210'
    });

    expect(updatedUser.name).toBe('Updated Name');
    expect(updatedUser.phone).toBe('+9876543210');
    expect(updatedUser.email).toBe('test@example.com'); // Should remain unchanged
  });
});