import { spawn, execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir, platform } from 'os';

// Resolve Electron userData path (same logic as electron app.getPath('userData'))
function getUserDataPath() {
  const appName = 'pixel-agents';
  if (platform() === 'win32') {
    return join(process.env.APPDATA || join(homedir(), 'AppData', 'Roaming'), appName);
  } else if (platform() === 'darwin') {
    return join(homedir(), 'Library', 'Application Support', appName);
  }
  return join(homedir(), '.config', appName);
}

function loadDevPort() {
  const settingsPath = join(getUserDataPath(), 'settings.json');
  if (existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
      if (typeof settings.devPort === 'number') return settings.devPort;
    } catch { /* use default */ }
  }
  return 5173;
}

const port = loadDevPort();
console.log(`[dev] Starting with port ${port}`);

// Spawn Vite dev server
const vite = spawn('pnpm', ['-C', 'src/renderer', 'exec', 'vite', '--port', String(port), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true,
});

// Spawn TypeScript compile + Electron
const electron = spawn('pnpm', ['run', 'build:main', '&&', 'pnpm', 'run', 'build:preload', '&&', 'electron', 'dist/main/index.js', `--dev-port=${port}`], {
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true,
});

function prefix(proc, tag) {
  proc.stdout?.on('data', (data) => {
    for (const line of data.toString().split('\n')) {
      if (line.trim()) process.stdout.write(`[${tag}] ${line}\n`);
    }
  });
  proc.stderr?.on('data', (data) => {
    for (const line of data.toString().split('\n')) {
      if (line.trim()) process.stderr.write(`[${tag}] ${line}\n`);
    }
  });
}

prefix(vite, 'vite');
prefix(electron, 'electron');

function killProc(proc) {
  if (proc.killed) return;
  if (platform() === 'win32' && proc.pid) {
    try {
      execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
    } catch { /* process may already be gone */ }
  } else {
    proc.kill();
  }
}

function cleanup(exitCode) {
  killProc(vite);
  killProc(electron);
  process.exit(exitCode ?? 0);
}

vite.on('exit', (code) => {
  console.log(`[dev] Vite exited with code ${code}`);
  cleanup(code);
});

vite.on('error', (err) => {
  console.error(`[dev] Vite spawn error:`, err.message);
  cleanup(1);
});

electron.on('exit', (code) => {
  console.log(`[dev] Electron exited with code ${code}`);
  cleanup(code);
});

electron.on('error', (err) => {
  console.error(`[dev] Electron spawn error:`, err.message);
  cleanup(1);
});

process.on('SIGINT', () => cleanup(0));
process.on('SIGTERM', () => cleanup(0));
