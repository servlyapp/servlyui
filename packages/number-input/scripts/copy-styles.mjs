import { cp, copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const styleSource = resolve('src/styles.css');
const styleTarget = resolve('dist/styles.css');
const hapticsSource = resolve('assets/haptics');
const hapticsTarget = resolve('dist/assets/haptics');

await mkdir(dirname(styleTarget), { recursive: true });
await copyFile(styleSource, styleTarget);
await mkdir(dirname(hapticsTarget), { recursive: true });
await cp(hapticsSource, hapticsTarget, { recursive: true });
