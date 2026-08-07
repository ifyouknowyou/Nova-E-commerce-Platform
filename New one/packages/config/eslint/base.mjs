/**
 * @nexus/config — shared ESLint flat config base for NEXUS OS packages.
 * Package-level configs import this and add their language-specific rules.
 */
import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';

export function nexusBase(overrides = {}) {
  return [
    {
      ignores: ['dist/**', 'node_modules/**', '.next/**', 'coverage/**'],
    },
    js.configs.recommended,
    eslintConfigPrettier,
    {
      languageOptions: {
        globals: {
          ...{ console: 'readonly', process: 'readonly' },
          ...(overrides.globals ?? {}),
        },
      },
    },
    ...(overrides.extraRules ? [{ rules: overrides.extraRules }] : []),
  ];
}

export default nexusBase;