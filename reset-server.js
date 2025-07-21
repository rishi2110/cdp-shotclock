#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
const dotenv = require('dotenv');
dotenv.config();
const PORT = process.env.PORT || 3001;

console.log('🔄 Resetting server state and logs...');

// Function to kill any existing server processes
function killServerProcesses() {
  return new Promise((resolve) => {
    console.log('📋 Killing existing server processes...');
    
    // Kill any tsx processes running the server
    const killTsx = spawn('pkill', ['-f', 'tsx server/index.ts'], { stdio: 'inherit' });
    
    killTsx.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Killed existing tsx server processes');
      } else {
        console.log('ℹ️  No existing tsx server processes found');
      }
      
      // Also try to kill any node processes on port 3001
      const killPort = spawn('lsof', ['-ti:' + PORT], { stdio: 'pipe' });
      
      killPort.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Killed processes on port ' + PORT);
        } else {
          console.log('ℹ️  No processes found on port ' + PORT);
        }
        resolve();
      });
    });
  });
}

// Function to clear console
function clearConsole() {
  console.clear();
  console.log('🧹 Console cleared');
}

// Function to clear any log files
function clearLogFiles() {
  console.log('🗑️  Clearing log files...');
  
  const logFiles = [
    'server.log',
    'error.log',
    'access.log',
    'combined.log'
  ];
  
  logFiles.forEach(logFile => {
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
      console.log(`✅ Deleted ${logFile}`);
    }
  });
}

// Function to start the server
function startServer() {
  console.log('🚀 Starting server...');
  
  const server = spawn('npm', ['run', 'dev:server'], {
    stdio: 'inherit',
    shell: true
  });
  
  server.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
  });
  
  server.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
  
  return server;
}

// Main reset function
async function resetServer() {
  try {
    // Clear console first
    clearConsole();
    
    // Clear log files
    clearLogFiles();
    
    // Kill existing processes
    await killServerProcesses();
    
    // Wait a moment for processes to fully terminate
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Start the server
    const server = startServer();
    
    console.log('✅ Server reset complete!');
    console.log('📊 Server should now be running with fresh state');
    console.log('🌐 Access the application at: http://localhost:5173');
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down server...');
      server.kill('SIGINT');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error during server reset:', error);
    process.exit(1);
  }
}

// Run the reset
resetServer(); 