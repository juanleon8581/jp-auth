import "../../../setup";
import { UserEntity, CreateUserData } from "../user.entity";

describe("User Entity", () => {
  it("should create a user without Zod validation", () => {
    const userData: CreateUserData = {
      email: "test@example.com",
      password: "password123",
      name: "Test User",
      phone: "+1234567890",
    };

    // This should work without any validation since we removed Zod
    expect(() => {
      const user = UserEntity.create({
        id: "test-id",
        email: userData.email,
        name: userData.name,
        email_verified: false,
      });
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
    }).not.toThrow();
  });

  it("should update user data without validation", () => {
    const user = UserEntity.create({
      id: "test-id",
      email: "test@example.com",
      name: "Test User",
      email_verified: false,
      phone: undefined,
      avatar_url: undefined,
    });

    const updatedUser = user.update({
      name: "Updated Name",
      phone: "+9876543210",
    });

    expect(updatedUser.name).toBe("Updated Name");
    expect(updatedUser.phone).toBe("+9876543210");
    expect(updatedUser.email).toBe("test@example.com"); // Should remain unchanged
  });
});
