/**
 * @nexus/config — TypeScript ESLint base for NEXUS OS packages.
 * Uses typescript-eslint's recommended preset composed with the base config.
 */
import tseslint from 'typescript-eslint';
import { nexusBase } from './base.mjs';

export function nexusTsConfig(_projectService = false, overrides = {}) {
  return tseslint.config(
    ...nexusBase(overrides),
    ...tseslint.configs.recommended,
    {
      rules: {
        // TypeScript already flags undefined identifiers; core no-undef is a
        // false-positive factory for TSX/DOM/Request types.
        'no-undef': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
    },
  );
}

export default nexusTsConfig;