import { nexusTsConfig } from '@nexus/config/eslint/ts';

export default nexusTsConfig(true, {
  globals: { console: 'readonly', process: 'readonly' },
});