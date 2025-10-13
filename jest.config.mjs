/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: 'tsconfig.jest.json' }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  moduleFileExtensions: ['ts', 'js'],
  testMatch: ['**/tests/**/*.test.ts'],
  verbose: true,
};

export default config;
