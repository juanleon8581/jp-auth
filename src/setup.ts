import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Configure NODE_ENV for testing
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Configure global timeout for tests
jest.setTimeout(10000);

// Clear mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Setup before all tests
beforeAll(async () => {
  // Global configurations can be added here
});

// Cleanup after all tests
afterAll(async () => {
  // Global cleanup can be added here
});