import {
  ICreateAppData,
  IUpdateAppData,
  IAppData,
} from '../interfaces/app.interface';

// Type aliases for backward compatibility
export type CreateAppData = ICreateAppData;
export type UpdateAppData = IUpdateAppData;
export type AppData = IAppData;

// App entity class
export class AppEntity {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly api_key: string,
    public readonly allowed_origins: string[],
    public readonly created_at: Date,
    public readonly updated_at: Date
  ) {}

  // Factory method to create App from data
  static create(data: AppData): AppEntity {
    return new AppEntity(
      data.id,
      data.name,
      data.api_key,
      data.allowed_origins,
      data.created_at,
      data.updated_at
    );
  }

  // Factory method to create App from raw data
  static fromRaw(data: AppData): AppEntity {
    return AppEntity.create(data);
  }

  // Convert to plain object
  toJSON(): AppData {
    return {
      id: this.id,
      name: this.name,
      api_key: this.api_key,
      allowed_origins: this.allowed_origins,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  // Get public app data (without API key)
  toPublic(): Omit<AppData, "api_key"> {
    return {
      id: this.id,
      name: this.name,
      allowed_origins: this.allowed_origins,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  // Check if app can be updated with given data
  canUpdate(data: UpdateAppData): boolean {
    // Basic validation - ensure data is an object
    return typeof data === 'object' && data !== null;
  }

  // Create updated version of app
  update(data: UpdateAppData): AppEntity {
    return new AppEntity(
      this.id,
      data.name ?? this.name,
      this.api_key,
      data.allowed_origins ?? this.allowed_origins,
      this.created_at,
      new Date() // updated_at
    );
  }

  // Check if origin is allowed for this app
  isOriginAllowed(origin: string): boolean {
    return this.allowed_origins.includes(origin);
  }

  // Check if API key matches
  validateApiKey(apiKey: string): boolean {
    return this.api_key === apiKey;
  }

  // Add new allowed origin
  addAllowedOrigin(origin: string): AppEntity {
    if (this.allowed_origins.includes(origin)) {
      return this; // Origin already exists
    }

    const newOrigins = [...this.allowed_origins, origin];
    return new AppEntity(
      this.id,
      this.name,
      this.api_key,
      newOrigins,
      this.created_at,
      new Date()
    );
  }

  // Remove allowed origin
  removeAllowedOrigin(origin: string): AppEntity {
    const newOrigins = this.allowed_origins.filter((o) => o !== origin);

    // Ensure at least one origin remains
    if (newOrigins.length === 0) {
      throw new Error("Cannot remove last allowed origin");
    }

    return new AppEntity(
      this.id,
      this.name,
      this.api_key,
      newOrigins,
      this.created_at,
      new Date()
    );
  }
}
