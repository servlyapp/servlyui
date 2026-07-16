import { defineConfig } from 'tsup';

const external = ['react', 'react-dom', 'antd', 'react-icons', 'react-icons/rx', 'react-icons/hi', 'react-icons/io5', 'draggable-number-input'];

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      core: 'src/core.ts',
      'adapters/antd': 'src/adapters/antd.tsx',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: false,
    splitting: false,
    loader: { '.mp3': 'dataurl' },
    external,
  },
  {
    entry: {
      haptics: 'src/haptics.ts',
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: false,
    splitting: false,
    loader: { '.mp3': 'dataurl' },
    external,
  },
]);
