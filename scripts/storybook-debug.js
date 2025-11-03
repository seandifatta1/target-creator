#!/usr/bin/env node

const { spawn } = require('child_process');
const { platform } = require('os');
const http = require('http');

const STORYBOOK_PORT = 6006;
const DEBUG_PORT = 9222;
const STORYBOOK_URL = `http://localhost:${STORYBOOK_PORT}`;

// Find Chrome executable based on platform
function getChromeExecutable() {
  const os = platform();
  
  if (os === 'darwin') {
    // macOS
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  } else if (os === 'win32') {
    // Windows
    return [
      process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
      process.env.PROGRAMFILES + '\\Google\\Chrome\\Application\\chrome.exe',
      process.env['PROGRAMFILES(X86)'] + '\\Google\\Chrome\\Application\\chrome.exe'
    ].find(path => {
      try {
        require('fs').accessSync(path);
        return true;
      } catch {
        return false;
      }
    });
  } else {
    // Linux
    return 'google-chrome';
  }
}

// Wait for Storybook server to be ready
function waitForStorybook(maxAttempts = 60) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const check = () => {
      attempts++;
      
      const req = http.get(STORYBOOK_URL, (res) => {
        if (res.statusCode === 200 || res.statusCode === 304) {
          console.log('✅ Storybook is ready!');
          resolve();
        } else {
          if (attempts >= maxAttempts) {
            reject(new Error('Storybook failed to start'));
          } else {
            setTimeout(check, 1000);
          }
        }
      });
      
      req.on('error', () => {
        if (attempts >= maxAttempts) {
          reject(new Error('Storybook failed to start'));
        } else {
          setTimeout(check, 1000);
        }
      });
    };
    
    check();
  });
}

// Launch Chrome with remote debugging
function launchChromeDebug() {
  const chromePath = getChromeExecutable();
  
  if (!chromePath) {
    console.warn('⚠️  Chrome not found. Please open Chrome manually with:');
    console.warn(`   chrome --remote-debugging-port=${DEBUG_PORT}`);
    console.warn(`   Then navigate to: ${STORYBOOK_URL}`);
    return;
  }
  
  const chromeArgs = [
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    STORYBOOK_URL
  ];
  
  console.log('🚀 Launching Chrome with remote debugging...');
  const chrome = spawn(chromePath, chromeArgs, {
    detached: true,
    stdio: 'ignore'
  });
  
  chrome.on('error', (err) => {
    console.error('❌ Failed to launch Chrome:', err.message);
    console.warn('Please launch Chrome manually with:');
    console.warn(`   chrome --remote-debugging-port=${DEBUG_PORT}`);
  });
  
  chrome.unref();
}

// Start Storybook
function startStorybook() {
  console.log('📚 Starting Storybook...');
  const storybook = spawn('npm', ['run', 'storybook'], {
    stdio: 'inherit',
    shell: true
  });
  
  storybook.on('error', (err) => {
    console.error('❌ Failed to start Storybook:', err.message);
    process.exit(1);
  });
  
  // Wait a bit for Storybook to start, then check if it's ready
  setTimeout(() => {
    waitForStorybook()
      .then(() => {
        launchChromeDebug();
      })
      .catch((err) => {
        console.error('❌', err.message);
        console.log('💡 Storybook may still be starting. You can manually open:');
        console.log(`   ${STORYBOOK_URL}`);
      });
  }, 3000);
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    storybook.kill();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    storybook.kill();
    process.exit(0);
  });
}

// Main execution
console.log('🔧 Starting Storybook in debug mode...');
console.log(`   Debug port: ${DEBUG_PORT}`);
console.log(`   Storybook URL: ${STORYBOOK_URL}`);
console.log('');
startStorybook();

