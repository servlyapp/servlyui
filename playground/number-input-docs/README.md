# ServlyNumberInput Docs Playground

Local Vite app for testing `@servlyui/number-input` without publishing it.

The Vite config aliases `@servlyui/number-input`, `@servlyui/number-input/haptics`, and `@servlyui/number-input/styles.css` directly to the package source files, so code changes in `packages/number-input/src` can be tested immediately.

It also pins `react` and `react-dom` resolution to this app's `node_modules` folder. That avoids invalid hook calls when Vite imports package source files from outside the playground directory.

This playground installs `slot-text` to demonstrate `renderDisplayValue` as an optional Text Motion extension. It also has a Haptics toggle wired through `useServlyNumberInputHaptics`. The package itself does not depend on `slot-text`, and the haptics extension is opt-in.

## Commands

From the workspace root:

```bash
npm run playground:install
npm run playground:dev
npm run playground:build
```

Or from this folder:

```bash
npm install
npm run dev
npm run build
```
