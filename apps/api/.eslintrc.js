module.exports = {
  root: true,
  extends: ['@fin/eslint-config'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['dist/', 'node_modules/', 'test/', '*.spec.ts', 'vitest.config.ts'],
};
