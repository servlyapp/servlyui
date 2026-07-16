import type { ServlyNumberInputDesignSystem, ServlyNumberInputSuffixOption } from '../types';
import { DEFAULT_TAILWIND_DESIGN_SYSTEM, TAILWIND_KEYWORDS, TAILWIND_PRESET_MAP } from './constants';

export const resolveDesignSystem = (designSystem?: ServlyNumberInputDesignSystem): Required<ServlyNumberInputDesignSystem> => ({
  id: designSystem?.id || DEFAULT_TAILWIND_DESIGN_SYSTEM.id,
  label: designSystem?.label || DEFAULT_TAILWIND_DESIGN_SYSTEM.label,
  presetMap: designSystem?.presetMap || TAILWIND_PRESET_MAP,
  keywords: designSystem?.keywords || [...TAILWIND_KEYWORDS],
  libraries: designSystem?.libraries || [],
  defaultPreset: designSystem?.defaultPreset || DEFAULT_TAILWIND_DESIGN_SYSTEM.defaultPreset,
  marker: designSystem?.marker ?? DEFAULT_TAILWIND_DESIGN_SYSTEM.marker,
  metaLabel: designSystem?.metaLabel || designSystem?.label || DEFAULT_TAILWIND_DESIGN_SYSTEM.metaLabel,
  className: designSystem?.className || '',
  inputClassName: designSystem?.inputClassName || '',
  suffixClassName: designSystem?.suffixClassName || '',
  suggestionClassName: designSystem?.suggestionClassName || '',
});

export const isDesignSystemSuffix = (suffix: string, designSystem: Required<ServlyNumberInputDesignSystem>) =>
  suffix === designSystem.id || suffix === 'tailwind';

export const isDesignSystemOption = (
  option: ServlyNumberInputSuffixOption | undefined,
  designSystem: Required<ServlyNumberInputDesignSystem>
) => option?.type === 'design-system' || (option?.type === 'option' && isDesignSystemSuffix(option.value, designSystem));

export const getPresetMapForSuffix = (
  suffix: string,
  suffixOptionList: ServlyNumberInputSuffixOption[],
  designSystem: Required<ServlyNumberInputDesignSystem>
) => {
  const currentOption = suffixOptionList.find((opt) => opt.value === suffix);
  if (isDesignSystemSuffix(suffix, designSystem)) return designSystem.presetMap;
  return currentOption?.presets || {};
};

export const getKeywordsForSuffix = (
  suffix: string,
  suffixOptionList: ServlyNumberInputSuffixOption[],
  designSystem: Required<ServlyNumberInputDesignSystem>
) => {
  const currentOption = suffixOptionList.find((opt) => opt.value === suffix);
  if (isDesignSystemSuffix(suffix, designSystem)) return designSystem.keywords;
  return currentOption?.keywords || [];
};

export const findTokenInDesignSystem = (value: string, designSystem: Required<ServlyNumberInputDesignSystem>) => {
  for (const library of designSystem.libraries) {
    for (const group of library.groups) {
      const token = group.tokens.find((option) => option.value === value);
      if (token) return token;
    }
  }

  return undefined;
};

export const valueInDesignSystem = (value: string, designSystem: Required<ServlyNumberInputDesignSystem>) =>
  Object.prototype.hasOwnProperty.call(designSystem.presetMap, value) ||
  designSystem.keywords.includes(value) ||
  Boolean(findTokenInDesignSystem(value, designSystem));

export const getDesignSystemTokenDetails = (value: string, designSystem: Required<ServlyNumberInputDesignSystem>) => {
  const token = findTokenInDesignSystem(value, designSystem);

  if (token) {
    const numericValue = token.numericValue ?? designSystem.presetMap[value];
    return {
      value,
      label: token.label ?? value,
      numericValue,
      metaLabel: token.metaLabel ?? (numericValue !== undefined ? String(numericValue) : undefined),
    };
  }

  if (Object.prototype.hasOwnProperty.call(designSystem.presetMap, value)) {
    const numericValue = designSystem.presetMap[value];
    return {
      value,
      label: value,
      numericValue,
      metaLabel: String(numericValue),
    };
  }

  if (designSystem.keywords.includes(value)) {
    return {
      value,
      label: value,
      numericValue: undefined,
      metaLabel: designSystem.metaLabel,
    };
  }

  return undefined;
};
