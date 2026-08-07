import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import { nexusTsConfig } from '@nexus/config/eslint/ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  ...nexusTsConfig(false, {
    globals: { window: 'readonly', document: 'readonly', navigator: 'readonly' },
  }),
  ...compat.extends('next/core-web-vitals'),
  { ignores: ['.next/**'] },
];
