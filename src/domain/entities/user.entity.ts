import {
  ICreateUserData,
  IUpdateUserData,
  IUserData,
} from '../interfaces/user.interface';

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
    public readonly phone: string | null,
    public readonly avatar_url: string | null,
    public readonly email_verified: boolean,
    public readonly created_at: Date,
    public readonly updated_at: Date
  ) {}

  // Factory method to create User from data
  static create(data: UserData): UserEntity {
    return new UserEntity(
      data.id,
      data.email,
      data.name,
      data.phone,
      data.avatar_url,
      data.email_verified,
      data.created_at,
      data.updated_at
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
      phone: this.phone,
      avatar_url: this.avatar_url,
      email_verified: this.email_verified,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  // Get public user data (without sensitive information)
  toPublic(): Omit<UserData, 'email_verified'> {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      phone: this.phone,
      avatar_url: this.avatar_url,
      created_at: this.created_at,
      updated_at: this.updated_at,
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
      data.phone ?? this.phone,
      data.avatar_url ?? this.avatar_url,
      this.email_verified,
      this.created_at,
      new Date() // updated_at
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