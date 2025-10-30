# Target Creator

A basic TypeScript Electron application.

## What's Included

- **TypeScript Electron App** - Basic desktop application with TypeScript support
- **Simple UI** - "Hello World!" HTML interface
- **Build System** - TypeScript compilation with `tsc`
- **Development Setup** - All necessary dependencies and configurations

## Project Structure

```
target-creator/
├── src/
│   └── main.ts          # TypeScript main process
├── dist/
│   └── main.js          # Compiled JavaScript (generated)
├── index.html           # Simple HTML interface
├── package.json         # Project configuration
├── tsconfig.json        # TypeScript configuration
└── README.md           # This file
```

## Dependencies

- **electron** - Desktop app framework
- **typescript** - TypeScript compiler
- **@types/electron** - TypeScript definitions for Electron
- **@types/node** - TypeScript definitions for Node.js

## Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Build and run the Electron app

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the application:
   ```bash
   npm start
   ```

## Features

- ✅ TypeScript compilation
- ✅ Electron window creation
- ✅ Basic HTML interface
- ✅ Proper build pipeline
- ✅ Type safety throughout

This is the foundation for building a more complex desktop application with TypeScript and Electron.