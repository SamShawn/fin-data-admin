module.exports = {
  root: true,
  // 继承根目录共享配置包中的 React 规则
  extends: ['@fin/eslint-config/react'],
  parserOptions: {
    // 显式指定 TypeScript 配置文件，防止解析报错
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  // 忽略无需 Lint 的文件
  ignorePatterns: ['dist/', 'node_modules/', 'vite.config.ts'],
};
