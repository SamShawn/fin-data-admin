// .eslintrc.js（根目录）
module.exports = {
  root: true, // 关键：阻止向上查找，避免误用祖先配置
  extends: ['@fin/eslint-config'], // 引用共享配置包
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    // 根目录的 ts 文件（如 scripts/）通常不在 tsconfig 的 include 中
    // 若开启类型相关规则，需要 project 配置；先不配，避免"文件不在 tsconfig"报错
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'coverage/',
    '.turbo/',
    '*.js', // 根目录的 .eslintrc.js 自身不被 lint
    'packages/eslint-config/**', // 共享配置包本身不 lint
  ],
};
