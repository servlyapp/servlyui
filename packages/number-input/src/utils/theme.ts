import type React from 'react';
import type {
  ServlyNumberInputSize,
  ServlyNumberInputTheme,
  ServlyNumberInputThemeMode,
  ServlyNumberInputThemeTokens,
} from '../types';

export const SERVLY_NUMBER_INPUT_DARK_THEME: Required<ServlyNumberInputThemeTokens> = {
  background: '#202020',
  backgroundHover: '#262626',
  filterBackground: '#1f2937',
  text: '#e5e5e5',
  mutedText: '#a3a3a3',
  fieldBorder: '#2f2f2f',
  valuePillBackground: '#303030',
  valuePillBorder: '#3f3f46',
  selectedTextBackground: '#1d4ed8',
  activeBorder: '#60a5fa',
  invalidBorder: '#ef4444',
  accent: '#60a5fa',
  tokenValueText: '#93c5fd',
  tokenIcon: '#a3a3a3',
  tokenIconHover: '#e5e5e5',
  overlayBackground: '#0a0a0a',
  overlayBorder: '#262626',
  overlayShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
  optionBackground: '#262626',
  optionHoverBackground: '#404040',
  pickerRowHoverBackground: '#262626',
  pickerSectionText: '#d4d4d4',
  pickerMutedValueText: '#a3a3a3',
  selectedRing: '#3b82f6',
  dangerText: '#f87171',
};

export const SERVLY_NUMBER_INPUT_LIGHT_THEME: Required<ServlyNumberInputThemeTokens> = {
  background: '#f5f5f5',
  backgroundHover: '#eeeeee',
  filterBackground: '#eaf3ff',
  text: '#1f1f1f',
  mutedText: '#757575',
  fieldBorder: '#d9d9d9',
  valuePillBackground: '#ffffff',
  valuePillBorder: '#d9d9d9',
  selectedTextBackground: '#9fc9ff',
  activeBorder: '#0d99ff',
  invalidBorder: '#dc2626',
  accent: '#0d99ff',
  tokenValueText: '#2563eb',
  tokenIcon: '#7c7c7c',
  tokenIconHover: '#333333',
  overlayBackground: '#ffffff',
  overlayBorder: '#e5e5e5',
  overlayShadow: '0 12px 32px rgba(0, 0, 0, 0.16)',
  optionBackground: '#ffffff',
  optionHoverBackground: '#f3f3f3',
  pickerRowHoverBackground: '#f3f3f3',
  pickerSectionText: '#1f1f1f',
  pickerMutedValueText: '#a6a6a6',
  selectedRing: '#0d99ff',
  dangerText: '#dc2626',
};

const THEME_VARIABLES: Record<keyof Required<ServlyNumberInputThemeTokens>, `--servly-number-input-${string}`> = {
  background: '--servly-number-input-bg',
  backgroundHover: '--servly-number-input-bg-hover',
  filterBackground: '--servly-number-input-filter-bg',
  text: '--servly-number-input-text',
  mutedText: '--servly-number-input-muted',
  fieldBorder: '--servly-number-input-field-border',
  valuePillBackground: '--servly-number-input-value-pill-bg',
  valuePillBorder: '--servly-number-input-value-pill-border',
  selectedTextBackground: '--servly-number-input-selected-text-bg',
  activeBorder: '--servly-number-input-border-active',
  invalidBorder: '--servly-number-input-border-invalid',
  accent: '--servly-number-input-accent',
  tokenValueText: '--servly-number-input-token-value-text',
  tokenIcon: '--servly-number-input-token-icon',
  tokenIconHover: '--servly-number-input-token-icon-hover',
  overlayBackground: '--servly-number-input-overlay-bg',
  overlayBorder: '--servly-number-input-overlay-border',
  overlayShadow: '--servly-number-input-overlay-shadow',
  optionBackground: '--servly-number-input-option-bg',
  optionHoverBackground: '--servly-number-input-option-bg-hover',
  pickerRowHoverBackground: '--servly-number-input-picker-row-hover-bg',
  pickerSectionText: '--servly-number-input-picker-section-text',
  pickerMutedValueText: '--servly-number-input-picker-muted-value-text',
  selectedRing: '--servly-number-input-selected-ring',
  dangerText: '--servly-number-input-danger-text',
};

const SIZE_VARIABLES = {
  xs: {
    height: '22px',
    prefixWidth: '20px',
    hiddenDragWidth: '7px',
    inputWidth: '84px',
    inputWithSuffixWidth: '56px',
    inputPaddingX: '6px',
    inputPrefixPaddingX: '3px',
    suffixWidth: '24px',
    suffixHoverWidth: '32px',
    suffixPaddingLeft: '3px',
    suffixPaddingRight: '1px',
    suffixGap: '1px',
    rootRadius: '5px',
    fontSize: '11px',
    inputFontSize: '10px',
    suffixFontSize: '8px',
    optionFontSize: '10px',
    optionRowHeight: '22px',
    caretSize: '11px',
    optionMinWidth: '128px',
    optionPaddingY: '3px',
    optionPaddingX: '4px',
    suggestionWidth: '248px',
    suggestionPaddingY: '5px',
    suggestionPaddingX: '10px',
  },
  sm: {
    height: '26px',
    prefixWidth: '24px',
    hiddenDragWidth: '8px',
    inputWidth: '100px',
    inputWithSuffixWidth: '68px',
    inputPaddingX: '8px',
    inputPrefixPaddingX: '3px',
    suffixWidth: '28px',
    suffixHoverWidth: '36px',
    suffixPaddingLeft: '4px',
    suffixPaddingRight: '2px',
    suffixGap: '1px',
    rootRadius: '6px',
    fontSize: '12px',
    inputFontSize: '11px',
    suffixFontSize: '8px',
    optionFontSize: '10px',
    optionRowHeight: '22px',
    caretSize: '12px',
    optionMinWidth: '140px',
    optionPaddingY: '4px',
    optionPaddingX: '4px',
    suggestionWidth: '280px',
    suggestionPaddingY: '6px',
    suggestionPaddingX: '12px',
  },
  md: {
    height: '32px',
    prefixWidth: '30px',
    hiddenDragWidth: '10px',
    inputWidth: '124px',
    inputWithSuffixWidth: '86px',
    inputPaddingX: '10px',
    inputPrefixPaddingX: '4px',
    suffixWidth: '36px',
    suffixHoverWidth: '46px',
    suffixPaddingLeft: '5px',
    suffixPaddingRight: '2px',
    suffixGap: '2px',
    rootRadius: '7px',
    fontSize: '13px',
    inputFontSize: '12px',
    suffixFontSize: '9px',
    optionFontSize: '11px',
    optionRowHeight: '24px',
    caretSize: '14px',
    optionMinWidth: '156px',
    optionPaddingY: '6px',
    optionPaddingX: '6px',
    suggestionWidth: '320px',
    suggestionPaddingY: '8px',
    suggestionPaddingX: '14px',
  },
  lg: {
    height: '40px',
    prefixWidth: '38px',
    hiddenDragWidth: '12px',
    inputWidth: '156px',
    inputWithSuffixWidth: '112px',
    inputPaddingX: '12px',
    inputPrefixPaddingX: '5px',
    suffixWidth: '44px',
    suffixHoverWidth: '56px',
    suffixPaddingLeft: '6px',
    suffixPaddingRight: '3px',
    suffixGap: '2px',
    rootRadius: '8px',
    fontSize: '15px',
    inputFontSize: '14px',
    suffixFontSize: '10px',
    optionFontSize: '12px',
    optionRowHeight: '26px',
    caretSize: '16px',
    optionMinWidth: '176px',
    optionPaddingY: '8px',
    optionPaddingX: '8px',
    suggestionWidth: '360px',
    suggestionPaddingY: '10px',
    suggestionPaddingX: '16px',
  },
} satisfies Record<ServlyNumberInputSize, Record<string, string>>;

const SIZE_VAR_NAMES: Record<keyof (typeof SIZE_VARIABLES)['sm'], `--servly-number-input-${string}`> = {
  height: '--servly-number-input-height',
  prefixWidth: '--servly-number-input-prefix-width',
  hiddenDragWidth: '--servly-number-input-hidden-drag-width',
  inputWidth: '--servly-number-input-input-width',
  inputWithSuffixWidth: '--servly-number-input-input-with-suffix-width',
  inputPaddingX: '--servly-number-input-input-padding-x',
  inputPrefixPaddingX: '--servly-number-input-input-prefix-padding-x',
  suffixWidth: '--servly-number-input-suffix-width',
  suffixHoverWidth: '--servly-number-input-suffix-hover-width',
  suffixPaddingLeft: '--servly-number-input-suffix-padding-left',
  suffixPaddingRight: '--servly-number-input-suffix-padding-right',
  suffixGap: '--servly-number-input-suffix-gap',
  rootRadius: '--servly-number-input-radius',
  fontSize: '--servly-number-input-font-size',
  inputFontSize: '--servly-number-input-input-font-size',
  suffixFontSize: '--servly-number-input-suffix-font-size',
  optionFontSize: '--servly-number-input-option-font-size',
  optionRowHeight: '--servly-number-input-option-row-height',
  caretSize: '--servly-number-input-caret-size',
  optionMinWidth: '--servly-number-input-option-min-width',
  optionPaddingY: '--servly-number-input-option-padding-y',
  optionPaddingX: '--servly-number-input-option-padding-x',
  suggestionWidth: '--servly-number-input-suggestion-width',
  suggestionPaddingY: '--servly-number-input-suggestion-padding-y',
  suggestionPaddingX: '--servly-number-input-suggestion-padding-x',
};

export interface ResolvedServlyNumberInputTheme {
  mode: ServlyNumberInputThemeMode;
  tokens: Required<ServlyNumberInputThemeTokens>;
  className?: string;
}

export type ServlyNumberInputCssVariables = React.CSSProperties & Record<`--servly-number-input-${string}`, string>;

export const resolveServlyNumberInputTheme = (
  theme?: ServlyNumberInputThemeMode | ServlyNumberInputTheme
): ResolvedServlyNumberInputTheme => {
  const mode = typeof theme === 'string' ? theme : theme?.mode ?? 'dark';
  const baseTokens = mode === 'light' ? SERVLY_NUMBER_INPUT_LIGHT_THEME : SERVLY_NUMBER_INPUT_DARK_THEME;
  const customTokens = typeof theme === 'string' ? undefined : theme?.tokens;

  return {
    mode,
    tokens: { ...baseTokens, ...customTokens },
    className: typeof theme === 'string' ? undefined : theme?.className,
  };
};

export const getServlyNumberInputCssVariables = (
  resolvedTheme: ResolvedServlyNumberInputTheme,
  size: ServlyNumberInputSize
): ServlyNumberInputCssVariables => {
  const variables = {} as ServlyNumberInputCssVariables;

  for (const [tokenName, variableName] of Object.entries(THEME_VARIABLES) as Array<
    [keyof Required<ServlyNumberInputThemeTokens>, `--servly-number-input-${string}`]
  >) {
    variables[variableName] = resolvedTheme.tokens[tokenName];
  }

  for (const [sizeName, variableName] of Object.entries(SIZE_VAR_NAMES) as Array<
    [keyof (typeof SIZE_VARIABLES)['sm'], `--servly-number-input-${string}`]
  >) {
    variables[variableName] = SIZE_VARIABLES[size][sizeName];
  }

  variables['--servly-number-input-design-system'] = resolvedTheme.tokens.accent;
  variables['--servly-number-input-tailwind'] = resolvedTheme.tokens.accent;

  return variables;
};
