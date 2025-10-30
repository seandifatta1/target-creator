const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

// Check if we're running in dev server mode (browser) or build mode (Electron)
const isDevServer = process.env.WEBPACK_SERVE || process.argv.includes('serve');

module.exports = {
  mode: 'development',
  entry: './src/renderer.tsx',
  target: isDevServer ? 'web' : 'electron-renderer',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: [/node_modules/, /\.stories\.tsx?$/, /src\/stories\//],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    ...(isDevServer && {
      fallback: {
        "global": false,
        "process": false,
      },
    }),
  },
  output: {
    filename: 'renderer.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    port: 6007,
    hot: true,
    historyApiFallback: true,
    client: {
      overlay: true,
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      filename: 'index.html',
    }),
    ...(isDevServer ? [
      new webpack.DefinePlugin({
        global: 'globalThis',
        process: JSON.stringify({}),
      }),
    ] : []),
  ],
  devtool: 'source-map',
};
