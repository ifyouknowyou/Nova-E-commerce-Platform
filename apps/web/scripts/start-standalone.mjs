import { spawn } from 'node:child_process';
import { cp, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = fileURLToPath(new URL('..', import.meta.url));
const standaloneRoot = join(appRoot, '.next', 'standalone', 'apps', 'web');
const serverPath = join(standaloneRoot, 'server.js');

async function start() {
  await mkdir(join(standaloneRoot, '.next', 'static'), { recursive: true });
  await mkdir(join(standaloneRoot, 'public'), { recursive: true });
  await cp(join(appRoot, '.next', 'static'), join(standaloneRoot, '.next', 'static'), {
    recursive: true,
    force: true,
  });
  await cp(join(appRoot, 'public'), join(standaloneRoot, 'public'), {
    recursive: true,
    force: true,
  });

  const server = spawn(process.execPath, [serverPath], {
    cwd: standaloneRoot,
    env: {
      ...process.env,
      HOSTNAME: process.env.HOSTNAME ?? '0.0.0.0',
      PORT: process.env.PORT ?? '3000',
    },
    stdio: 'inherit',
  });

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => server.kill(signal));
  }

  server.once('error', (error) => {
    console.error('Could not start the standalone storefront:', error);
    process.exitCode = 1;
  });
  server.once('exit', (code, signal) => {
    process.exitCode = code ?? (signal ? 1 : 0);
  });
}

start().catch((error) => {
  console.error('Could not prepare the standalone storefront:', error);
  process.exitCode = 1;
});
