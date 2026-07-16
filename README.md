# Servly UI

Servly UI is a workspace for small, atomic Servly components that can be published as individual npm packages.

Source, issues, and release history live at [github.com/servlyapp/servlyui](https://github.com/servlyapp/servlyui).

The first package is `@servlyui/number-input`, extracted from the portal `ServlyInput` and focused on integer/decimal numeric values, CSS units, injectable design-system presets, suggestions, and draggable value editing. Tailwind is the default preset system, not a hard dependency of the core behavior.

## Workspace

```text
packages/
  number-input/  @servlyui/number-input
```

## Commands

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
npm run pack:dry-run
```

## Playground

The docs-style local playground lives in `playground/number-input-docs`. It aliases `@servlyui/number-input` to the package source so you can test changes without publishing or packing.

Its 120px and 130px compact examples exercise the number input's container-aware token action, including moving `Apply variable` into the suffix menu when larger control sizes would crowd the value.

```bash
npm run playground:install
npm run playground:dev
npm run playground:build
```

## Package Shape

`@servlyui/number-input` exposes:

- `@servlyui/number-input` for the default styled React component.
- `@servlyui/number-input/core` for adapter-driven usage without static Ant Design imports.
- `@servlyui/number-input/adapters/antd` for the default Ant Design, react-icons, and draggable-number-input primitives.
- `@servlyui/number-input/haptics` for optional Web Audio haptic feedback wiring.
- `@servlyui/number-input/styles.css` for the packaged Servly styles.

The existing portal source is treated as an upstream reference. This repository does not modify or rewire the portal unless that is requested separately.

## Design-System Policy

Servly UI packages should expose styling hooks instead of assuming one downstream design system. For `@servlyui/number-input`, consumers can import the packaged Servly styles, inject a Tailwind-compatible or custom preset scale, and layer slot-level `classNames` / `styles` without forking the component.
