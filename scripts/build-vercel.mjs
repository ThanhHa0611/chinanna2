import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const result = spawnSync(
  process.execPath,
  [join(root, 'scripts', 'build-all-frontends.mjs'), 'vercel'],
  { stdio: 'inherit', cwd: root },
);

process.exit(result.status ?? 1);
