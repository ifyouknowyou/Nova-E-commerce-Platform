import base from '@nova/config/eslint';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...base,
  {
    files: ['**/*.ts'],
    rules: {
      // NestJS DI relies on emitted design:paramtypes metadata, so injectable
      // classes must stay value imports even when only referenced as types.
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'test/**'],
  },
);
