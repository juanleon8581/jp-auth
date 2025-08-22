import {
  ICreateUserData,
  IUpdateUserData,
  IUserData,
} from "../interfaces/user.interface";

// Type aliases for backward compatibility
export type CreateUserData = ICreateUserData;
export type UpdateUserData = IUpdateUserData;
export type UserData = IUserData;

// User entity class
export class UserEntity {
  private constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly email_verified: boolean,
    public readonly phone?: string,
    public readonly avatar_url?: string
  ) {}

  // Factory method to create User from data
  static create(data: UserData): UserEntity {
    return new UserEntity(
      data.id,
      data.email,
      data.name,
      data.email_verified,
      data.phone,
      data.avatar_url
    );
  }

  // Factory method to create User from raw data
  static fromRaw(data: UserData): UserEntity {
    return UserEntity.create(data);
  }

  // Convert to plain object
  toJSON(): UserData {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      email_verified: this.email_verified,
      phone: this.phone,
      avatar_url: this.avatar_url,
    };
  }

  // Get public user data (without sensitive information)
  toPublic(): Omit<UserData, "email_verified"> {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      phone: this.phone,
      avatar_url: this.avatar_url,
    };
  }

  // Check if user can be updated with given data
  canUpdate(data: UpdateUserData): boolean {
    return true; // Assume data is valid at domain level
  }

  // Create updated version of user
  update(data: UpdateUserData): UserEntity {
    return new UserEntity(
      this.id,
      this.email,
      data.name ?? this.name,
      this.email_verified,
      data.phone ?? this.phone,
      data.avatar_url ?? this.avatar_url
    );
  }

  // Check if email is verified
  isEmailVerified(): boolean {
    return this.email_verified;
  }

  // Check if user has complete profile
  hasCompleteProfile(): boolean {
    return !!(this.name && this.email && this.email_verified);
  }
}
