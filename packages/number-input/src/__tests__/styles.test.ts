import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

const styles = readFileSync(`${process.cwd()}/src/styles.css`, 'utf8');

describe('ServlyNumberInput styles', () => {
  it('keeps manual token triggers hover/focus revealed and drag hidden', () => {
    expect(styles).toContain('.servly-number-input__token-trigger.is-manual {');
    expect(styles).toContain('width: 0;');
    expect(styles).toContain('.servly-number-input:hover .servly-number-input__token-trigger.is-manual');
    expect(styles).toContain('.servly-number-input--hovered .servly-number-input__token-trigger.is-manual');
    expect(styles).toContain('.servly-number-input:focus-within .servly-number-input__token-trigger.is-manual');
    expect(styles).toContain('.servly-number-input--dragging .servly-number-input__token-trigger.is-manual');
  });

  it('keeps linked token unlink revealed by root hover only and drag hidden', () => {
    expect(styles).toContain('.servly-number-input__token-trigger.is-linked {');
    expect(styles).toContain('color: var(--servly-number-input-token-icon-hover);');
    expect(styles).toContain('.servly-number-input:hover .servly-number-input__token-trigger.is-linked');
    expect(styles).toContain('.servly-number-input--hovered .servly-number-input__token-trigger.is-linked');
    expect(styles).not.toContain('.servly-number-input:focus-within .servly-number-input__token-trigger.is-linked');
    expect(styles).not.toContain('.servly-number-input--active .servly-number-input__token-trigger.is-linked');
    expect(styles).toContain('.servly-number-input--dragging .servly-number-input__token-trigger.is-linked');
  });

  it('keeps token and unlink icon buttons backgroundless', () => {
    expect(styles).toContain('.servly-number-input__token-trigger:hover,\n.servly-number-input__token-trigger.is-open {\n  background: transparent;');
    expect(styles).toContain(
      '.servly-number-input--theme-dark .servly-number-input__token-trigger:hover,\n.servly-number-input--theme-dark .servly-number-input__token-trigger.is-open {\n  background: transparent;'
    );
  });

  it('renders linked token previews as a stable pill instead of a native input surface', () => {
    expect(styles).toContain('.servly-number-input__token-value {');
    expect(styles).not.toContain('.servly-number-input__input--token-picker-hidden');
  });

  it('keeps the editable and overlaid native input flat while token previews stay rounded', () => {
    expect(styles).toContain('.servly-number-input__input {\n  width: 100%;');
    expect(styles).toContain('border-radius: 0;');
    expect(styles).toContain('.servly-number-input__token-value {\n  display: inline-flex;');
    expect(styles).toContain('border-radius: calc(var(--servly-number-input-radius) - 2px);');
    expect(styles).toContain('.servly-number-input__token-value.is-open {');
    expect(styles).toContain(
      '.servly-number-input__input.servly-number-input__input--display-overlaid {\n  width: 100%;\n  height: auto;\n  margin: 0;\n  padding: 0;\n  border-radius: 0;\n  background: transparent;\n  box-shadow: none;'
    );
  });

  it('aligns design-system drag overlays to the token preview pill geometry', () => {
    expect(styles).toContain(
      '.servly-number-input__input-wrap--design-system.servly-number-input__input-wrap--has-display-value\n  .servly-number-input__display-value {'
    );
    expect(styles).toContain('top: 50%;');
    expect(styles).toContain('left: calc(var(--servly-number-input-input-padding-x) - 1px);');
    expect(styles).toContain('left: calc(var(--servly-number-input-input-prefix-padding-x) - 1px);');
    expect(styles).toContain('margin: 0;');
    expect(styles).toContain('transform: translateY(-50%);');
    expect(styles).toContain('padding: 0 5px;');
    expect(styles).toContain('background: var(--servly-number-input-value-pill-bg);');
    expect(styles).toContain('.servly-number-input__display-value\n  > * {');
    expect(styles).not.toContain('.servly-number-input__input--design-system,\n.servly-number-input__input--tailwind,\n.servly-number-input__token-value');
    expect(styles).not.toContain('inset: 3px auto 3px -1px;');
  });

  it('keeps linked token suffix triggers accent tinted without tinting suffix menus', () => {
    expect(styles).toContain(
      '.servly-number-input__suffix--design-system,\n.servly-number-input__suffix--tailwind {\n  background: color-mix(in srgb, var(--servly-number-input-design-system) 16%, var(--servly-number-input-bg));'
    );
    expect(styles).toContain(
      '.servly-number-input__suffix--design-system:hover,\n.servly-number-input__suffix--design-system.servly-number-input__suffix--hovered'
    );
    expect(styles).toContain('background: var(--servly-number-input-option-bg-hover) !important;');
  });

  it('keeps suffix dropdown hover and selected states theme-neutral', () => {
    expect(styles).toContain('.servly-number-input__dropdown-popup .ant-dropdown-menu-item:hover');
    expect(styles).toContain('.servly-number-input__dropdown-popup .ant-dropdown-menu-item-selected');
    expect(styles).toContain('background: var(--servly-number-input-option-bg-hover) !important;');
    expect(styles).toContain(
      '.servly-number-input__dropdown-popup .ant-dropdown-menu-title-content {\n  color: inherit;\n  font-size: inherit;'
    );
    expect(styles).not.toContain('.servly-number-input__dropdown-popup.servly-number-input__overlay--theme-dark .ant-dropdown-menu-item:hover');
  });

  it('uses proportional compact suffix spacing and separates the token action', () => {
    expect(styles).toContain('gap: var(--servly-number-input-suffix-gap);');
    expect(styles).toContain(
      'padding: 0 var(--servly-number-input-suffix-padding-right) 0 var(--servly-number-input-suffix-padding-left);'
    );
    expect(styles).toContain('.servly-number-input__suffix-option--token-action {');
    expect(styles).toContain('.servly-number-input__dropdown-divider {');
    expect(styles).toContain('.servly-number-input__suffix-dropdown-popup .ant-dropdown-menu-item-divider {');
    expect(styles).toContain('font-size: var(--servly-number-input-suffix-font-size) !important;');
    expect(styles).toContain('min-height: var(--servly-number-input-option-row-height);');
    expect(styles).toContain('.servly-number-input__compact-token-anchor {');
  });

  it('keeps token picker density size-aware with inset selected rows', () => {
    expect(styles).toContain('width: min(var(--servly-number-input-suggestion-width), calc(100vw - 16px));');
    expect(styles).toContain('--servly-number-input-picker-icon-box-size: var(--servly-number-input-height);');
    expect(styles).toContain('--servly-number-input-picker-icon-size: var(--servly-number-input-caret-size);');
    expect(styles).toContain('.servly-number-input__token-picker-library-trigger-caret {');
    expect(styles).toContain('.servly-number-input__token-picker-search .servly-number-input__suggestions-close,');
    expect(styles).toContain('font-size: var(--servly-number-input-font-size);');
    expect(styles).toContain('.servly-number-input__token-picker-library-heading {');
    expect(styles).toContain('gap: 4px;');
    expect(styles).toContain('border: 1px solid var(--servly-number-input-overlay-border);');
    expect(styles).toContain('--servly-number-input-picker-inline-padding: 10px;');
    expect(styles).toContain('--servly-number-input-picker-search-gap: 6px;');
    expect(styles).toContain(
      'grid-template-columns: var(--servly-number-input-picker-icon-size) minmax(0, 1fr) var(--servly-number-input-picker-icon-box-size);'
    );
    expect(styles).toContain('--servly-number-input-picker-action-icon-size: calc(var(--servly-number-input-caret-size) + 2px);');
    expect(styles).toContain('.servly-number-input__token-picker-library-heading:hover {');
    expect(styles).toContain('background: transparent;\n  color: var(--servly-number-input-text);');
    expect(styles).toContain('.servly-number-input__token-picker-library-caret.is-open {');
    expect(styles).toContain('margin-left: 2px;');
    expect(styles).toContain('width: calc(100% - 16px);');
    expect(styles).toContain('margin: 1px 8px;');
    expect(styles).toContain('.servly-number-input__token-picker-row.is-selected {');
    expect(styles).toContain('background: var(--servly-number-input-picker-row-hover-bg);');
    expect(styles).toContain('color: var(--servly-number-input-token-value-text);');
    expect(styles).toContain('.servly-number-input__create-variable-select-trigger {');
    expect(styles).toContain(
      '.servly-number-input__create-variable-select-trigger {\n  font-size: var(--servly-number-input-font-size);'
    );
    expect(styles).toContain(
      '.servly-number-input__create-variable-dropdown .servly-number-input__fallback-menu button {'
    );
    expect(styles).toContain('.servly-number-input__create-variable-number-input {');
    expect(styles).not.toContain('.servly-number-input__create-variable-value-control {');
    expect(styles).toContain('.servly-number-input__overlay--theme-dark .servly-number-input__create-variable-footer button {');
  });
});
