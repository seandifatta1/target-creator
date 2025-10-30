# Basic Electron + React App

This is the most basic possible Electron + React app with browser hot reload.

## Features

- ✅ Electron app
- ✅ React frontend
- ✅ Browser hot reload at `http://localhost:3000`
- ✅ Electron loads from dev server
- ✅ TypeScript support
- ✅ Webpack bundling

## Usage

1. **Install dependencies:**
   ```bash
   cd example
   npm install
   ```

2. **Start development:**
   ```bash
   # Terminal 1: Start webpack dev server
   npm run dev
   
   # Terminal 2: Start Electron (loads from dev server)
   npm run electron
   ```

3. **Access in browser:**
   - Open `http://localhost:3000` in your browser
   - Both browser and Electron will hot reload when you make changes

4. **Production build:**
   ```bash
   npm start
   ```

## Key Files

- `src/main.ts` - Electron main process
- `src/renderer.tsx` - React app entry point
- `src/App.tsx` - Main React component
- `webpack.config.js` - Webpack configuration (always `target: 'web'`)
- `package.json` - Dependencies and scripts

## How It Works

1. **Webpack dev server** runs on port 3000 with hot reload
2. **Electron main process** loads from `http://localhost:3000` in development
3. **Browser** can access the same dev server at `http://localhost:3000`
4. **Both** get hot reload when you save files

This is the simplest possible setup for Electron + React with browser hot reload!
