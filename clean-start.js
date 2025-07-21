#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
const dotenv = require('dotenv');
dotenv.config();
const PORT = process.env.PORT || 3001;
const FRONTEND_PORT = process.env.VITE_FRONTEND_PORT || 5173;

console.log('🧹 Complete system cleanup and restart...');

// Function to kill all development processes
function killAllDevProcesses() {
  return new Promise((resolve) => {
    console.log('📋 Killing all development processes...');
    
    const processes = [
      { name: 'tsx server', command: 'pkill', args: ['-f', 'tsx server/index.ts'] },
      { name: 'vite', command: 'pkill', args: ['-f', 'vite'] },
      { name: 'node dev', command: 'pkill', args: ['-f', 'node.*dev'] },
      { name: 'port 3001', command: 'lsof', args: ['-ti:3001'] },
      { name: 'port 5173', command: 'lsof', args: ['-ti:5173'] }
    ];
    
    let completed = 0;
    
    processes.forEach(({ name, command, args }) => {
      const killProcess = spawn(command, args, { stdio: 'pipe' });
      
      killProcess.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Killed ${name} processes`);
        } else {
          console.log(`ℹ️  No ${name} processes found`);
        }
        
        completed++;
        if (completed === processes.length) {
          resolve();
        }
      });
    });
  });
}

// Function to clear log files
function clearLogFiles() {
  console.log('🗑️  Clearing log files...');
  
  const logFiles = [
    'server.log',
    'error.log',
    'access.log',
    'combined.log',
    'npm-debug.log*',
    'yarn-debug.log*',
    'yarn-error.log*'
  ];
  
  logFiles.forEach(logFile => {
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
      console.log(`✅ Deleted ${logFile}`);
    }
  });
}

// Function to clear node_modules cache (optional)
function clearCache() {
  console.log('🗑️  Clearing cache...');
  
  const cacheDirs = [
    'node_modules/.cache',
    '.vite',
    '.next',
    'dist'
  ];
  
  cacheDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      const rmCache = spawn('rm', ['-rf', dir], { stdio: 'pipe' });
      rmCache.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Cleared ${dir}`);
        }
      });
    }
  });
}

// Function to start both frontend and backend
function startServices() {
  console.log('🚀 Starting services...');
  
  // Start backend
  const server = spawn('npm', ['run', 'dev:server'], {
    stdio: 'inherit',
    shell: true,
    detached: true
  });
  
  // Wait a moment then start frontend
  setTimeout(() => {
    const frontend = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true,
      detached: true
    });
    
    console.log('✅ Both services started!');
    console.log('🌐 Frontend: http://localhost:' + FRONTEND_PORT);
    console.log('🔧 Backend: http://localhost:' + PORT);
  }, 2000);
  
  return { server, frontend: null };
}

// Main cleanup and restart function
async function cleanStart() {
  try {
    // Clear log files
    clearLogFiles();
    
    // Clear cache (optional)
    clearCache();
    
    // Kill all processes
    await killAllDevProcesses();
    
    // Wait for processes to fully terminate
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Start services
    const services = startServices();
    
    console.log('✅ Complete system restart complete!');
    console.log('📊 All services running with fresh state');
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down all services...');
      if (services.server) services.server.kill('SIGINT');
      if (services.frontend) services.frontend.kill('SIGINT');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error during clean start:', error);
    process.exit(1);
  }
}

// Run the clean start
cleanStart(); 