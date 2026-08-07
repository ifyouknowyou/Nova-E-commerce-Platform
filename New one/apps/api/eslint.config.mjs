import { nexusTsConfig } from '@nexus/config/eslint/ts';

export default nexusTsConfig(true, {
  globals: { __dirname: 'readonly', __filename: 'readonly', require: 'readonly' },
});