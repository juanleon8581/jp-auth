module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__test__/**/*.ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/setup.ts",
    "!src/**/__test__/**"
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  setupFilesAfterEnv: ["<rootDir>/src/setup.ts"]
};
