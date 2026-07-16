# Servly UI

Servly UI is the umbrella repository for Servly's independently owned UI components and the future aggregation layer that will compose them.

This repository is not published to npm yet. Each component owns its implementation, tests, documentation playground, and npm release from its own repository until the shared composition layer is ready.

## Components

| Component | Source | Package | Status |
| --- | --- | --- | --- |
| Servly Number Input | [servlyapp/servly-number-input](https://github.com/servlyapp/servly-number-input) | [@servlyui/number-input](https://www.npmjs.com/package/@servlyui/number-input) | Public |

## Repository Model

- Component repositories own their source, tests, build, playground, and release history.
- npm packages use the shared `@servlyui` namespace without requiring this umbrella repository to be an npm package.
- This repository will own shared documentation, composition, and cross-component infrastructure when those capabilities exist.
- Component implementations are linked here rather than duplicated or managed as Git submodules.

## Adding A Component

Add the component to the table once its standalone repository defines:

- a typed public API;
- package-local tests and documentation;
- a reproducible build and package dry run;
- repository, issue, and npm metadata;
- an explicit owner and release process.
