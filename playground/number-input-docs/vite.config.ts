import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '../..');
const numberInputSource = path.resolve(workspaceRoot, 'packages/number-input/src');
const appNodeModules = path.resolve(__dirname, 'node_modules');

export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: [
      {
        find: /^react$/,
        replacement: path.resolve(appNodeModules, 'react/index.js'),
      },
      {
        find: /^react\/jsx-runtime$/,
        replacement: path.resolve(appNodeModules, 'react/jsx-runtime.js'),
      },
      {
        find: /^react\/jsx-dev-runtime$/,
        replacement: path.resolve(appNodeModules, 'react/jsx-dev-runtime.js'),
      },
      {
        find: /^react-dom$/,
        replacement: path.resolve(appNodeModules, 'react-dom/index.js'),
      },
      {
        find: /^react-dom\/client$/,
        replacement: path.resolve(appNodeModules, 'react-dom/client.js'),
      },
      {
        find: '@servlyui/number-input/styles.css',
        replacement: path.resolve(numberInputSource, 'styles.css'),
      },
      {
        find: '@servlyui/number-input/haptics',
        replacement: path.resolve(numberInputSource, 'haptics.ts'),
      },
      {
        find: '@servlyui/number-input',
        replacement: path.resolve(numberInputSource, 'index.ts'),
      },
    ],
  },
  server: {
    fs: {
      allow: [workspaceRoot],
    },
  },
});
