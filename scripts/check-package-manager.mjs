import { rmSync } from 'fs';

for (const f of ['package-lock.json', 'yarn.lock']) {
  try { rmSync(f); } catch {}
}

const agent = process.env.npm_config_user_agent ?? '';
if (agent && !agent.startsWith('pnpm/')) {
  console.error('Error: use pnpm to install dependencies (not npm or yarn).');
  process.exit(1);
}
