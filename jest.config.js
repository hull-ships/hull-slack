module.exports = {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ["server/**/*.{js,jsx}"],
  coverageDirectory: "coverage",
  coveragePathIgnorePatterns: ["/node_modules/", "/test/"],
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/unit/**/*-test.js"],
  testPathIgnorePatterns: [
    "<rootDir>/(dist|docs|dll|config|flow-typed|node_modules)/",
  ],
};
