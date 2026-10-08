module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'chore', 'refactor', 'perf', 'test', 'docs', 'style', 'ci', 'revert'],
    ],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-case': [0], // 中文 subject 不校验大小写
    'subject-empty': [2, 'never'],
    'subject-max-length': [2, 'always', 72],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 120],
  },
};
