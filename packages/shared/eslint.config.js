import base from '@nova/config/eslint';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...base,
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
);
