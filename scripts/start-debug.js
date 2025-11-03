#!/usr/bin/env node

/**
 * One-click debug script for Storybook
 * This script:
 * 1. Starts Storybook
 * 2. Waits for it to be ready
 * 3. Instructs user to press F5 in VS Code
 * 
 * Or run: npm run storybook:debug for automatic Chrome launch
 */

const { spawn } = require('child_process');
const http = require('http');

const STORYBOOK_PORT = 6006;
const STORYBOOK_URL = `http://localhost:${STORYBOOK_PORT}`;

console.log('🚀 Starting Storybook for debugging...\n');

// Start Storybook
const storybook = spawn('npm', ['run', 'storybook'], {
  stdio: 'inherit',
  shell: true
});

storybook.on('error', (err) => {
  console.error('❌ Failed to start Storybook:', err.message);
  process.exit(1);
});

// Wait for Storybook to be ready
let attempts = 0;
const maxAttempts = 60;

const checkReady = () => {
  attempts++;
  
  const req = http.get(STORYBOOK_URL, (res) => {
    if (res.statusCode === 200 || res.statusCode === 304) {
      console.log('\n✅ Storybook is ready!');
      console.log('\n📌 Next step:');
      console.log('   Press F5 in VS Code and select "🔧 Storybook Debug (One-Click)"');
      console.log(`   Or open: ${STORYBOOK_URL}\n`);
    } else {
      if (attempts < maxAttempts) {
        setTimeout(checkReady, 1000);
      }
    }
  });
  
  req.on('error', () => {
    if (attempts < maxAttempts) {
      setTimeout(checkReady, 1000);
    }
  });
  
  req.end();
};

// Start checking after a short delay
setTimeout(checkReady, 3000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Storybook...');
  storybook.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  storybook.kill();
  process.exit(0);
});

