#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
const dotenv = require('dotenv');
dotenv.config();
const PORT = process.env.PORT || 3001;

console.log('🧹 Pre-server cleanup...');

// Function to kill any existing server processes
function killServerProcesses() {
  return new Promise((resolve) => {
    console.log('📋 Checking for existing server processes...');
    
    // Kill any tsx processes running the server
    const killTsx = spawn('pkill', ['-f', 'tsx server/index.ts'], { stdio: 'pipe' });
    
    killTsx.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Killed existing tsx server processes');
      } else {
        console.log('ℹ️  No existing tsx server processes found');
      }
      
      // Also try to kill any processes on port 3001
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

// Main cleanup function
async function preServerCleanup() {
  try {
    // Clear log files
    clearLogFiles();
    
    // Kill existing processes
    await killServerProcesses();
    
    // Wait a moment for processes to fully terminate
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('✅ Pre-server cleanup complete!');
    console.log('🚀 Server can now start with clean state');
    
  } catch (error) {
    console.error('❌ Error during pre-server cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
preServerCleanup(); 