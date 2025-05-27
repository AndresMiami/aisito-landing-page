module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  coverageDirectory: 'coverage',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js', // Exclude entry point
    '!src/**/index.js', // Exclude index files
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};