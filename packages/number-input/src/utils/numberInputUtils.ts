import type { ServlyNumberInputDesignSystem, ServlyNumberInputSuffixOption } from '../types';
import { TAILWIND_PRESET_MAP } from './constants';
import {
  isDesignSystemSuffix,
  resolveDesignSystem,
  valueInDesignSystem,
} from './designSystem';
import { parseValueWithUnit } from './valueParser';

const getTailwindPresetKey = (parsed: ReturnType<typeof parseValueWithUnit>) => {
  if (parsed.tailwindPreset) return parsed.tailwindPreset;
  return typeof parsed.value === 'string' ? parsed.value : undefined;
};

/**
 * Determines which suffix mode should be selected for a value.
 */
export const determineSuffixFromValue = (
  value: unknown,
  suffixOptionList: ServlyNumberInputSuffixOption[],
  unitOfMeasurement?: string,
  designSystemConfig?: ServlyNumberInputDesignSystem
): string => {
  if (unitOfMeasurement) return unitOfMeasurement;

  const designSystem = resolveDesignSystem(designSystemConfig);
  const parsed = parseValueWithUnit(value, designSystem);

  if (parsed.unit && suffixOptionList.find((opt) => opt.value === parsed.unit)) {
    return parsed.unit;
  }

  if (parsed.unit && typeof parsed.value === 'number') {
    const hasUnitInPresets = suffixOptionList.some((opt) => opt.presets && Object.keys(opt.presets).includes(parsed.unit));
    if (hasUnitInPresets) return parsed.unit;
    const firstMetric = suffixOptionList.find((opt) => opt.type === 'metric');
    return firstMetric?.value || parsed.unit;
  }

  if (typeof parsed.value === 'number' && !parsed.unit) {
    const firstMetric = suffixOptionList.find((opt) => opt.type === 'metric');
    return firstMetric?.value || 'px';
  }

  if ((designSystem.id === 'tailwind' && parsed.isTailwind) || valueInDesignSystem(String(parsed.value), designSystem)) {
    const isPlainNumber = /^-?\d+(?:\.\d+)?$/.test(String(parsed.value));
    if (isPlainNumber) {
      const firstMetric = suffixOptionList.find((opt) => opt.type === 'metric');
      return firstMetric?.value || 'px';
    }
    return designSystem.id;
  }

  if (parsed.isText || parsed.isKeyword) {
    if (parsed.isKeyword || (parsed.isText && valueInDesignSystem(String(parsed.value), designSystem))) {
      return designSystem.id;
    }
  }

  const firstMetric = suffixOptionList.find((opt) => opt.type === 'metric');
  return firstMetric?.value || 'px';
};

export const shouldAutoSwitchToTailwind = (inputValue: string, currentSuffix: string): boolean => {
  return shouldAutoSwitchToDesignSystem(inputValue, currentSuffix);
};

export const shouldAutoSwitchToDesignSystem = (
  inputValue: string,
  currentSuffix: string,
  designSystemConfig?: ServlyNumberInputDesignSystem
): boolean => {
  const designSystem = resolveDesignSystem(designSystemConfig);
  if (isDesignSystemSuffix(currentSuffix, designSystem)) return false;
  return valueInDesignSystem(inputValue, designSystem);
};

export const getDefaultValueForSuffix = (
  suffix: string,
  suffixOptionList: ServlyNumberInputSuffixOption[],
  designSystemConfig?: ServlyNumberInputDesignSystem
): string | number => {
  const suffixOption = suffixOptionList.find((opt) => opt.value === suffix);
  const designSystem = resolveDesignSystem(designSystemConfig);

  if (isDesignSystemSuffix(suffix, designSystem)) return designSystem.defaultPreset;
  if (suffix === 'number' || suffix === '#') return 0;

  if (suffixOption?.type === 'metric') {
    const defaults: Record<string, number> = {
      '%': 100,
      rem: 1,
      em: 1,
      vh: 50,
      vw: 50,
      px: 16,
    };
    return defaults[suffix] || 0;
  }

  return 0;
};

/**
 * Clamps a numeric value to optional min/max boundaries.
 */
export const validateNumericInput = (value: number, min?: number, max?: number): number => {
  let validatedValue = value;
  if (min !== undefined && validatedValue < min) validatedValue = min;
  if (max !== undefined && validatedValue > max) validatedValue = max;
  return validatedValue;
};

export const isPartialNumericInput = (inputValue: string): boolean =>
  /^-?$|^-?\d*\.$|^-?\d*\.?\d*$/.test(inputValue) && !/^-?\d+\.?\d*$/.test(inputValue);

/**
 * Finds the closest Tailwind spacing preset for a pixel value.
 */
export const getClosestTailwindPreset = (pixelValue: number): string => {
  return getClosestDesignSystemPreset(pixelValue);
};

/**
 * Finds the closest preset in an injected design-system scale.
 */
export const getClosestDesignSystemPreset = (
  pixelValue: number,
  designSystemConfig?: ServlyNumberInputDesignSystem
): string => {
  const designSystem = resolveDesignSystem(designSystemConfig);
  const presetEntries = Object.entries(designSystem.presetMap);
  let closestPreset = designSystem.defaultPreset;
  let closestDistance = Infinity;

  for (const [preset, pixels] of presetEntries) {
    const distance = Math.abs(pixels - pixelValue);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestPreset = preset;
    }
  }

  return closestPreset;
};

/**
 * Formats the change payload value for metric, preset, and integer modes.
 */
export const formatOutputValue = (
  value: unknown,
  suffix: string,
  isActivelyTyping = false,
  designSystemConfig?: ServlyNumberInputDesignSystem,
  numberMode: 'any' | 'integer' | 'decimal' = 'any'
): { outputValue: string | number | ''; unit: string } => {
  if (value === '' || value === null || value === undefined) {
    return { outputValue: '', unit: suffix };
  }

  const designSystem = resolveDesignSystem(designSystemConfig);
  const parsed = parseValueWithUnit(value, designSystem);

  if (isDesignSystemSuffix(suffix, designSystem)) {
    const tailwindValue = parsed.tailwindPreset ?? (typeof parsed.value === 'string' ? parsed.value : String(parsed.value ?? ''));
    return { outputValue: tailwindValue, unit: '' };
  }

  if (suffix === 'number' || suffix === '#') {
    if (isActivelyTyping) return { outputValue: String(value), unit: suffix };
    const numericValue =
      typeof parsed.value === 'number'
        ? parsed.value
        : typeof parsed.numericValue === 'number'
          ? parsed.numericValue
          : Number.parseFloat(String(parsed.value));

    return {
      outputValue: Number.isNaN(numericValue) ? 0 : numberMode === 'integer' ? Math.round(numericValue) : numericValue,
      unit: suffix,
    };
  }

  if (isActivelyTyping) return { outputValue: String(value), unit: suffix };

  if (typeof parsed.value === 'number' || parsed.isPlainNumber || /^-?\d*\.?\d*$/.test(String(value))) {
    return {
      outputValue:
        typeof parsed.value === 'number'
          ? parsed.value
          : typeof parsed.numericValue === 'number'
            ? parsed.numericValue
            : String(value),
      unit: suffix,
    };
  }

  return { outputValue: parsed.value, unit: suffix };
};

/**
 * Returns numeric presets ordered by their pixel equivalent for drag traversal.
 */
export const getOrderedPresetList = (presetMap: Record<string, number> = TAILWIND_PRESET_MAP): Array<{ preset: string; pixels: number }> =>
  Object.entries(presetMap)
    .filter(([preset, pixels]) => preset !== 'px' && Number.isFinite(pixels))
    .map(([preset, pixels]) => ({ preset, pixels }))
    .sort((a, b) => a.pixels - b.pixels);

export const getNextPresetValue = (
  currentValue: string | number,
  direction: 'up' | 'down',
  steps = 1,
  presetMap: Record<string, number> = TAILWIND_PRESET_MAP,
  fallbackPreset = '4'
): string => {
  const orderedPresets = getOrderedPresetList(presetMap);
  const currentValueStr = String(currentValue);
  let currentIndex = orderedPresets.findIndex((p) => p.preset === currentValueStr);

  if (currentIndex === -1) {
    const parsed = parseValueWithUnit(currentValue);
    let numericValue = 0;

    if (typeof parsed.value === 'number') {
      numericValue = parsed.value;
    } else {
      const tailwindKey = getTailwindPresetKey(parsed);
      if (tailwindKey && TAILWIND_PRESET_MAP[tailwindKey as keyof typeof TAILWIND_PRESET_MAP] !== undefined) {
        numericValue = TAILWIND_PRESET_MAP[tailwindKey as keyof typeof TAILWIND_PRESET_MAP];
      } else {
        currentIndex = direction === 'up' ? 0 : orderedPresets.length - 1;
      }
    }

    if (currentIndex === -1) {
      let closestIndex = 0;
      let closestDistance = Infinity;
      orderedPresets.forEach((preset, index) => {
        const distance = Math.abs(preset.pixels - numericValue);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      currentIndex = closestIndex;
    }
  }

  const nextIndex =
    direction === 'up'
      ? Math.min(currentIndex + steps, orderedPresets.length - 1)
      : Math.max(currentIndex - steps, 0);

  return orderedPresets[nextIndex]?.preset || fallbackPreset;
};

export const shouldUsePresetMode = (
  currentSuffix: string,
  suffixOptionList: ServlyNumberInputSuffixOption[],
  designSystemConfig?: ServlyNumberInputDesignSystem
): boolean => {
  const designSystem = resolveDesignSystem(designSystemConfig);
  if (isDesignSystemSuffix(currentSuffix, designSystem)) return true;
  const currentOption = suffixOptionList.find((opt) => opt.value === currentSuffix);
  return currentOption?.type === 'preset';
};

export const findPresetIndex = (currentValue: string | number, presetList: Array<{ preset: string; pixels: number }>): number => {
  const currentValueStr = String(currentValue);
  const index = presetList.findIndex((p) => p.preset === currentValueStr);
  if (index !== -1) return index;

  const parsed = parseValueWithUnit(currentValue);
  let numericValue = 0;

  if (typeof parsed.value === 'number') {
    numericValue = parsed.value;
  } else {
    const tailwindKey = getTailwindPresetKey(parsed);
    if (tailwindKey && TAILWIND_PRESET_MAP[tailwindKey as keyof typeof TAILWIND_PRESET_MAP] !== undefined) {
      numericValue = TAILWIND_PRESET_MAP[tailwindKey as keyof typeof TAILWIND_PRESET_MAP];
    }
  }

  let closestIndex = 0;
  let closestDistance = Infinity;
  presetList.forEach((preset, presetIndex) => {
    const distance = Math.abs(preset.pixels - numericValue);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = presetIndex;
    }
  });

  return closestIndex;
};

export const getPresetByIndex = (index: number, presetList: Array<{ preset: string; pixels: number }>): string => {
  const boundedIndex = Math.max(0, Math.min(index, presetList.length - 1));
  return presetList[boundedIndex]?.preset || '4';
};

export const isValidNumericInput = (inputValue: string): boolean => /^-?\d*\.?\d*$/.test(inputValue);

export const isPartialNumber = (inputValue: string): boolean => /^-?$|^-?\d*\.$/.test(inputValue);

export const isCompleteNumber = (inputValue: string): boolean => /^-?\d*\.?\d+$/.test(inputValue);

export const isValidCompleteValue = (
  inputValue: string,
  currentSuffix: string,
  suffixOptionList: ServlyNumberInputSuffixOption[],
  allowCustomValue: boolean,
  designSystemConfig?: ServlyNumberInputDesignSystem
): boolean => {
  if (inputValue === '' || inputValue === '0') return true;
  const designSystem = resolveDesignSystem(designSystemConfig);

  if (isDesignSystemSuffix(currentSuffix, designSystem)) {
    return valueInDesignSystem(inputValue, designSystem);
  }

  const currentSuffixOption = suffixOptionList.find((opt) => opt.value === currentSuffix);
  if (currentSuffixOption?.type === 'metric') {
    if (isPartialNumber(inputValue)) return false;
    return isCompleteNumber(inputValue);
  }

  return allowCustomValue;
};
