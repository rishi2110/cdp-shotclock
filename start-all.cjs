#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd, args, opts = {}) {
  return spawn(cmd, args, { stdio: 'inherit', ...opts });
}

function killProcess(pattern, cb) {
  const proc = spawn('pkill', ['-f', pattern]);
  proc.on('close', () => cb && cb());
}

function clearLogs() {
  const logDir = path.join(__dirname, 'logs');
  if (fs.existsSync(logDir)) {
    fs.readdirSync(logDir).forEach(f => fs.unlinkSync(path.join(logDir, f)));
    console.log('🗑️  Cleared logs in logs/');
  }
  // Optionally clear other state files here
}

function startBackend() {
  console.log('🚀 Starting backend server...');
  run('npm', ['run', 'dev:server']);
}

function startFrontend() {
  console.log('🚀 Starting frontend dev server...');
  run('npm', ['run', 'dev']);
}

console.log('🧹 Killing old dev servers...');
killProcess('tsx server/index.ts', () => {
  killProcess('vite', () => {
    clearLogs();
    // Start backend and frontend in parallel
    startBackend();
    startFrontend();
  });
}); 