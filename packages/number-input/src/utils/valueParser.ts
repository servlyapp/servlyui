import type { ParsedValue, ServlyNumberInputDesignSystem } from '../types';
import { TAILWIND_KEYWORDS, TAILWIND_PRESET_MAP } from './constants';
import { findTokenInDesignSystem, resolveDesignSystem, valueInDesignSystem } from './designSystem';

const NUMERIC_PATTERN = /^-?\d+(?:\.\d+)?$/;

/**
 * Extracts the numeric value, unit, and design-system preset metadata from a value.
 */
export const parseValueWithUnit = (value: unknown, designSystemConfig?: ServlyNumberInputDesignSystem): ParsedValue => {
  if (value == null || value === '') {
    return { value: 0, unit: '', isPlainNumber: true, numericValue: 0 };
  }

  if (typeof value === 'number' && !Number.isNaN(value)) {
    return { value, unit: '', isPlainNumber: true, numericValue: value };
  }

  const strValue = String(value).trim();
  if (strValue === '') {
    return { value: 0, unit: '', isPlainNumber: true, numericValue: 0 };
  }

  const isNumeric = NUMERIC_PATTERN.test(strValue);
  const numericValue = isNumeric ? Number.parseFloat(strValue) : undefined;
  const designSystem = designSystemConfig ? resolveDesignSystem(designSystemConfig) : undefined;
  const isTailwindPreset = Object.prototype.hasOwnProperty.call(TAILWIND_PRESET_MAP, strValue);
  const isInjectedDesignSystemPreset = designSystem ? Object.prototype.hasOwnProperty.call(designSystem.presetMap, strValue) : false;
  const isInjectedDesignSystemKeyword = designSystem ? designSystem.keywords.includes(strValue) : false;
  const injectedToken = designSystem ? findTokenInDesignSystem(strValue, designSystem) : undefined;

  if (isNumeric) {
    return {
      value: numericValue as number,
      unit: '',
      isPlainNumber: true,
      numericValue,
      ...(isTailwindPreset ? { isTailwind: true, tailwindPreset: strValue } : {}),
      ...(isInjectedDesignSystemPreset
        ? { isDesignSystem: true, designSystemPreset: strValue, numericValue: designSystem?.presetMap[strValue] }
        : {}),
    };
  }

  if (designSystem && valueInDesignSystem(strValue, designSystem)) {
    return {
      value: strValue,
      unit: designSystem.id,
      isKeyword: isInjectedDesignSystemKeyword,
      isDesignSystem: true,
      designSystemPreset: isInjectedDesignSystemPreset || injectedToken ? strValue : undefined,
      numericValue: isInjectedDesignSystemPreset ? designSystem.presetMap[strValue] : injectedToken?.numericValue,
    };
  }

  if ((TAILWIND_KEYWORDS as readonly string[]).includes(strValue)) {
    return {
      value: strValue,
      unit: 'tailwind',
      isKeyword: true,
    };
  }

  if (isTailwindPreset) {
    return {
      value: strValue,
      unit: '',
      isTailwind: true,
      tailwindPreset: strValue,
      numericValue: TAILWIND_PRESET_MAP[strValue as keyof typeof TAILWIND_PRESET_MAP],
    };
  }

  const match = strValue.match(/^(-?\d+(?:\.\d+)?)\s*(.*)$/);
  if (!match) {
    return {
      value: strValue,
      unit: '',
      isText: true,
    };
  }

  const parsedNumericValue = Number.parseFloat(match[1]);
  const unitPart = match[2].trim();

  if (!unitPart) {
    return {
      value: parsedNumericValue,
      unit: '',
      isPlainNumber: true,
      numericValue: parsedNumericValue,
    };
  }

  return {
    value: parsedNumericValue,
    unit: unitPart,
    numericValue: parsedNumericValue,
  };
};
