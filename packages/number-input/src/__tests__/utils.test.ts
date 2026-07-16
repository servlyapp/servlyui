import { describe, expect, it } from 'vitest';
import { TAILWIND_PRESET_MAP } from '../utils/constants';
import { convertUnit } from '../utils/unitConverter';
import { parseValueWithUnit } from '../utils/valueParser';
import {
  createServlyNumberInputLayoutContext,
  resolveServlyNumberInputTokenActionPlacement,
} from '../utils/layoutPolicy';
import {
  determineSuffixFromValue,
  formatOutputValue,
  getClosestDesignSystemPreset,
  getNextPresetValue,
  getOrderedPresetList,
  isValidCompleteValue,
  shouldAutoSwitchToDesignSystem,
  validateNumericInput,
} from '../utils/numberInputUtils';
import type { ServlyNumberInputDesignSystem, ServlyNumberInputSuffixOption } from '../types';

const suffixes: ServlyNumberInputSuffixOption[] = [
  { value: 'px', type: 'metric' },
  { value: 'rem', type: 'metric' },
  { value: '%', type: 'metric' },
  { value: 'tailwind', type: 'option' },
  { value: 'auto', type: 'keyword' },
];

const acmeSystem: ServlyNumberInputDesignSystem = {
  id: 'acme',
  label: 'Acme',
  presetMap: { xs: 4, sm: 8, md: 16, lg: 32, '2': 8 },
  keywords: ['fluid', 'content'],
  libraries: [
    {
      id: 'ios',
      label: 'iOS',
      groups: [{ id: 'edge', label: 'Edge', tokens: [{ value: 'bottom', label: 'Bottom', numericValue: 62 }] }],
    },
  ],
  defaultPreset: 'md',
  marker: 'A',
  metaLabel: 'Acme token',
};

const acmeSuffixes: ServlyNumberInputSuffixOption[] = [
  { value: 'px', type: 'metric' },
  { value: 'acme', type: 'design-system', label: 'Acme' },
  { value: 'fluid', type: 'keyword', label: 'Fluid' },
];

describe('parseValueWithUnit', () => {
  it('parses plain numbers', () => {
    expect(parseValueWithUnit(12)).toMatchObject({ value: 12, unit: '', isPlainNumber: true, numericValue: 12 });
    expect(parseValueWithUnit('12')).toMatchObject({ value: 12, unit: '', isPlainNumber: true, numericValue: 12 });
  });

  it('parses numbers with CSS units', () => {
    expect(parseValueWithUnit('1.5rem')).toMatchObject({ value: 1.5, unit: 'rem', numericValue: 1.5 });
    expect(parseValueWithUnit('-12 px')).toMatchObject({ value: -12, unit: 'px', numericValue: -12 });
  });

  it('identifies Tailwind presets and keywords', () => {
    expect(parseValueWithUnit('4')).toMatchObject({ value: 4, isTailwind: true, tailwindPreset: '4' });
    expect(parseValueWithUnit('auto')).toMatchObject({ value: 'auto', unit: 'tailwind', isKeyword: true });
    expect(TAILWIND_PRESET_MAP['4']).toBe(16);
  });

  it('identifies injected design-system presets and keywords', () => {
    expect(parseValueWithUnit('sm', acmeSystem)).toMatchObject({
      value: 'sm',
      unit: 'acme',
      isDesignSystem: true,
      designSystemPreset: 'sm',
      numericValue: 8,
    });
    expect(parseValueWithUnit('fluid', acmeSystem)).toMatchObject({
      value: 'fluid',
      unit: 'acme',
      isKeyword: true,
      isDesignSystem: true,
    });
    expect(parseValueWithUnit('2', acmeSystem)).toMatchObject({
      value: 2,
      isDesignSystem: true,
      designSystemPreset: '2',
      numericValue: 8,
    });
    expect(parseValueWithUnit('bottom', acmeSystem)).toMatchObject({
      value: 'bottom',
      unit: 'acme',
      isDesignSystem: true,
      designSystemPreset: 'bottom',
      numericValue: 62,
    });
  });
});

describe('unit and suffix utilities', () => {
  it('converts px/rem/em with a base pixel size', () => {
    expect(convertUnit(16, 'px', 'rem', 16)).toBe(1);
    expect(convertUnit(2, 'rem', 'px', 16)).toBe(32);
    expect(convertUnit(50, '%', 'px', 16)).toBe(50);
  });

  it('detects suffixes conservatively', () => {
    expect(determineSuffixFromValue('12rem', suffixes)).toBe('rem');
    expect(determineSuffixFromValue('4', suffixes)).toBe('px');
    expect(determineSuffixFromValue('auto', suffixes)).toBe('tailwind');
    expect(determineSuffixFromValue('20', suffixes, '%')).toBe('%');
  });

  it('formats output by suffix mode', () => {
    expect(formatOutputValue('12', 'px', true)).toEqual({ outputValue: '12', unit: 'px' });
    expect(formatOutputValue('12', 'px', false)).toEqual({ outputValue: 12, unit: 'px' });
    expect(formatOutputValue('4', 'tailwind', false)).toEqual({ outputValue: '4', unit: '' });
    expect(formatOutputValue('12.8', '#', false)).toEqual({ outputValue: 12.8, unit: '#' });
    expect(formatOutputValue('12.8', '#', false, undefined, 'integer')).toEqual({ outputValue: 13, unit: '#' });
  });

  it('clamps values and traverses presets', () => {
    expect(validateNumericInput(120, 0, 100)).toBe(100);
    expect(validateNumericInput(-5, 0, 100)).toBe(0);
    expect(getNextPresetValue('4', 'up', 1)).toBe('5');
    expect(getNextPresetValue('4', 'down', 2)).toBe('3');
    expect(getOrderedPresetList(acmeSystem.presetMap).map((item) => item.preset)).toEqual(['xs', '2', 'sm', 'md', 'lg']);
    expect(getNextPresetValue('sm', 'up', 1, acmeSystem.presetMap, acmeSystem.defaultPreset)).toBe('md');
  });

  it('validates complete values without portal dependencies', () => {
    expect(isValidCompleteValue('12', 'px', suffixes, false)).toBe(true);
    expect(isValidCompleteValue('-', 'px', suffixes, false)).toBe(false);
    expect(isValidCompleteValue('auto', 'tailwind', suffixes, false)).toBe(true);
    expect(isValidCompleteValue('custom', 'unknown', suffixes, true)).toBe(true);
  });

  it('supports injected design-system suffix detection and formatting', () => {
    expect(determineSuffixFromValue('sm', acmeSuffixes, undefined, acmeSystem)).toBe('acme');
    expect(shouldAutoSwitchToDesignSystem('fluid', 'px', acmeSystem)).toBe(true);
    expect(getClosestDesignSystemPreset(17, acmeSystem)).toBe('md');
    expect(formatOutputValue('sm', 'acme', false, acmeSystem)).toEqual({ outputValue: 'sm', unit: '' });
    expect(isValidCompleteValue('fluid', 'acme', acmeSuffixes, false, acmeSystem)).toBe(true);
  });
});

describe('responsive layout policy', () => {
  const contextAt = (size: 'xs' | 'sm' | 'md' | 'lg', containerWidth?: number, hasSuffixMenu = true) =>
    createServlyNumberInputLayoutContext({
      size,
      containerWidth,
      isHovered: false,
      isFocused: false,
      isDragging: false,
      isTokenLinked: false,
      hasPrefix: true,
      hasSuffixMenu,
    });

  it('moves md and lg token actions into the suffix menu at compact widths', () => {
    for (const width of [120, 130]) {
      expect(resolveServlyNumberInputTokenActionPlacement(contextAt('xs', width))).toBe('inline');
      expect(resolveServlyNumberInputTokenActionPlacement(contextAt('sm', width))).toBe('inline');
      expect(resolveServlyNumberInputTokenActionPlacement(contextAt('md', width))).toBe('suffix-menu');
      expect(resolveServlyNumberInputTokenActionPlacement(contextAt('lg', width))).toBe('suffix-menu');
    }
  });

  it('keeps every size inline when there is comfortable value space', () => {
    for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
      expect(resolveServlyNumberInputTokenActionPlacement(contextAt(size, 220))).toBe('inline');
    }
  });

  it('supports policy overrides and keeps the action accessible without a suffix menu', () => {
    expect(
      resolveServlyNumberInputTokenActionPlacement(contextAt('sm', 220), () => ({ tokenActionPlacement: 'hidden' }))
    ).toBe('hidden');
    expect(
      resolveServlyNumberInputTokenActionPlacement(contextAt('sm', 220), () => ({ tokenActionPlacement: 'suffix-menu' }))
    ).toBe('suffix-menu');
    expect(
      resolveServlyNumberInputTokenActionPlacement(contextAt('lg', 120, false), () => ({ tokenActionPlacement: 'suffix-menu' }))
    ).toBe('inline');
  });

  it('falls back to inline without ResizeObserver measurements', () => {
    expect(resolveServlyNumberInputTokenActionPlacement(contextAt('lg'))).toBe('inline');
  });
});
