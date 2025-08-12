import { App, CreateAppData, UpdateAppData } from "../entities/app.entity";

// App repository interface
export interface IAppRepository {
  // Create operations
  create(appData: CreateAppData): Promise<App>;

  // Read operations
  findById(id: string): Promise<App | null>;
  findByApiKey(apiKey: string): Promise<App | null>;
  findByName(name: string): Promise<App | null>;
  findMany(options?: FindManyAppsOptions): Promise<App[]>;
  count(options?: CountAppsOptions): Promise<number>;
  exists(id: string): Promise<boolean>;
  existsByApiKey(apiKey: string): Promise<boolean>;
  existsByName(name: string): Promise<boolean>;

  // Update operations
  update(id: string, appData: UpdateAppData): Promise<App>;
  regenerateApiKey(id: string): Promise<App>;
  addAllowedOrigin(id: string, origin: string): Promise<App>;
  removeAllowedOrigin(id: string, origin: string): Promise<App>;

  // Delete operations
  delete(id: string): Promise<void>;

  // Validation operations
  validateApiKey(apiKey: string): Promise<App | null>;
  validateOrigin(apiKey: string, origin: string): Promise<boolean>;
}

// Options for finding multiple apps
export interface FindManyAppsOptions {
  limit?: number;
  offset?: number;
  sortBy?: "created_at" | "updated_at" | "name";
  sortOrder?: "asc" | "desc";
  search?: string; // Search in name
  createdAfter?: Date;
  createdBefore?: Date;
  hasOrigin?: string; // Filter apps that have specific origin
}

// Options for counting apps
export interface CountAppsOptions {
  search?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  hasOrigin?: string;
}

// App repository errors
export class AppRepositoryError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "AppRepositoryError";
  }
}

export class AppNotFoundError extends AppRepositoryError {
  constructor(identifier: string) {
    super(`App not found: ${identifier}`, "APP_NOT_FOUND");
    this.name = "AppNotFoundError";
  }
}

export class AppAlreadyExistsError extends AppRepositoryError {
  constructor(name: string) {
    super(`App already exists with name: ${name}`, "APP_ALREADY_EXISTS");
    this.name = "AppAlreadyExistsError";
  }
}

export class InvalidApiKeyError extends AppRepositoryError {
  constructor() {
    super("Invalid API key provided", "INVALID_API_KEY");
    this.name = "InvalidApiKeyError";
  }
}

export class OriginNotAllowedError extends AppRepositoryError {
  constructor(origin: string, appName: string) {
    super(
      `Origin '${origin}' is not allowed for app '${appName}'`,
      "ORIGIN_NOT_ALLOWED"
    );
    this.name = "OriginNotAllowedError";
  }
}

export class AppValidationError extends AppRepositoryError {
  constructor(message: string) {
    super(`App validation error: ${message}`, "APP_VALIDATION_ERROR");
    this.name = "AppValidationError";
  }
}

export class LastOriginRemovalError extends AppRepositoryError {
  constructor() {
    super(
      "Cannot remove the last allowed origin from an app",
      "LAST_ORIGIN_REMOVAL"
    );
    this.name = "LastOriginRemovalError";
  }
}
