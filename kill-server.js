#!/usr/bin/env node

import { spawn } from 'child_process';
const dotenv = require('dotenv');
dotenv.config();
const PORT = process.env.PORT || 3001;

console.log('🔄 Killing server processes...');

// Kill any tsx processes running the server
const killTsx = spawn('pkill', ['-f', 'tsx server/index.ts'], { stdio: 'inherit' });

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
    
    console.log('✅ Server processes killed successfully!');
    console.log('💡 Run "npm run dev:server" to start the server again');
  });
}); 