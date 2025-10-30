# Target Creator

A browser-based 3D visualization application built with TypeScript, React, and Three.js.

## What's Included

- **React Application** - Modern React app with TypeScript support
- **3D Canvas** - Interactive 3D grid visualization using Three.js and react-three-fiber
- **Component Library** - Reusable UI components with Storybook integration
- **Build System** - Webpack-based bundling with hot module replacement
- **Development Setup** - Hot reload development server on port 6007

## Project Structure

```
target-creator/
├── src/
│   ├── components/      # React components (PascalCase)
│   ├── hooks/           # Custom React hooks (use*)
│   ├── utils/           # Utility functions (camelCase)
│   └── renderer.tsx     # Application entry point
├── dist/                # Build output (generated)
├── index.html           # HTML template
├── package.json         # Project configuration
├── tsconfig.json        # TypeScript configuration
├── webpack.config.js    # Webpack bundling configuration
└── README.md           # This file
```

## Dependencies

- **react** - React UI library
- **react-dom** - React DOM renderer
- **three** - 3D graphics library
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for react-three-fiber
- **typescript** - TypeScript compiler
- **webpack** - Module bundler
- **storybook** - Component development environment

## Scripts

- `npm run dev` - Start development server on port 6007
- `npm run build` - Build production bundle
- `npm run storybook` - Start Storybook on port 6006
- `npm run build-storybook` - Build static Storybook site

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:6007`

## Features

- ✅ TypeScript compilation
- ✅ React component architecture
- ✅ 3D interactive canvas
- ✅ Hot module replacement
- ✅ Storybook integration
- ✅ Modern build pipeline
- ✅ Type safety throughout

This application provides a foundation for 3D visualization and interaction in the browser.