export default {
  testEnvironment: "node",
  transform: {},
  extensionsToTreatAsEsm: [],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.mjs$": "$1.mjs",
  },
  collectCoverageFrom: [
    "src/**/*.mjs",
    "!src/__tests__/**",
  ],
  coverageThreshold: {
    global: {
      lines: 90,
      branches: 85,
      functions: 90,
      statements: 90,
    },
  },
  testMatch: ["**/__tests__/**/*.test.mjs", "**/tests/jest/**/*.test.mjs"],
};
