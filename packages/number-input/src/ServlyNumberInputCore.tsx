import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { defaultCoreAdapters, mergeAdapters } from './adapters/defaultAdapters';
import { InputField } from './components/InputField';
import { PrefixSection } from './components/PrefixSection';
import { SuffixDropdown } from './components/SuffixDropdown';
import { SuggestionsPopover } from './components/SuggestionsPopover';
import { TokenPickerPopover } from './components/TokenPickerPopover';
import { useServlyNumberInputContext } from './provider';
import type {
  ServlyNumberInputChangeEvent,
  ServlyNumberInputCoreProps,
  ServlyNumberInputDisplayValueContext,
  ServlyNumberInputRef,
  ServlyNumberInputRejectReason,
  ServlyNumberInputValueDragEvent,
  ServlyNumberInputValue,
} from './types';
import { convertUnit } from './utils/unitConverter';
import { cx } from './utils/cx';
import { getServlyNumberInputCssVariables, resolveServlyNumberInputTheme } from './utils/theme';
import {
  createServlyNumberInputLayoutContext,
  resolveServlyNumberInputTokenActionPlacement,
} from './utils/layoutPolicy';
import {
  getPresetMapForSuffix,
  getDesignSystemTokenDetails,
  isDesignSystemOption,
  isDesignSystemSuffix,
  resolveDesignSystem,
  valueInDesignSystem,
} from './utils/designSystem';
import {
  determineSuffixFromValue,
  formatOutputValue,
  getClosestDesignSystemPreset,
  getDefaultValueForSuffix,
  getNextPresetValue,
  shouldUsePresetMode,
  validateNumericInput,
} from './utils/numberInputUtils';
import { parseValueWithUnit } from './utils/valueParser';

const coerceNumericValue = (value: unknown): number => {
  const parsed = parseValueWithUnit(value);
  if (typeof parsed.value === 'number') return parsed.value;
  if (typeof parsed.numericValue === 'number') return parsed.numericValue;
  const parsedFloat = Number.parseFloat(String(parsed.value));
  return Number.isNaN(parsedFloat) ? 0 : parsedFloat;
};

const isMetricLike = (suffix: string, suffixOptionList: ServlyNumberInputCoreProps['suffixOptionList']) =>
  suffixOptionList?.find((opt) => opt.value === suffix)?.type === 'metric';

const isValidPartialNumberForMode = (inputValue: string, numberMode: ServlyNumberInputCoreProps['numberMode']) => {
  if (numberMode === 'integer') return /^-?\d*$/.test(inputValue);
  return /^-?\d*\.?\d*$/.test(inputValue);
};

const normalizeNumberForMode = (value: number, numberMode: ServlyNumberInputCoreProps['numberMode']) =>
  numberMode === 'integer' ? Math.round(value) : value;

/**
 * Adapter-driven Servly number input core. Import this from
 * `@servlyui/number-input/core` when you want to provide your own primitives.
 */
export const ServlyNumberInputCore = forwardRef<ServlyNumberInputRef, ServlyNumberInputCoreProps>(
  (
    {
      value: propValue,
      defaultValue,
      onChange,
      onValueDragStart,
      onValueDrag,
      onValueDragEnd,
      onReject,
      onTokenUnlink,
      onBlur,
      onFocus,
      onKeyDown,
      onKeyUp,
      prefixLabelText = '',
      prefixNode = null,
      prefixIcon = null,
      min = 0,
      max = 100,
      step = 1,
      disablePointerLock = false,
      unitOfMeasurement,
      basePixel = 16,
      suffixOptionList = [],
      suffixNode,
      formatter,
      theme,
      size,
      numberMode = 'any',
      designSystem: designSystemConfig,
      showTokenTrigger = 'auto',
      layoutPolicy,
      hideSuffixWhenTokenLinked = true,
      tokenPicker,
      onTokenPickerOpenChange,
      onAddTokenLibrary,
      renderTokenPicker,
      disabled = false,
      readOnly = false,
      placeholder = '',
      name,
      id,
      'data-testid': testId,
      componentTooltipTitle,
      componentTooltipMouseEnterDelay,
      componentTooltipMouseLeaveDelay,
      componentTooltipTrigger,
      componentTooltipPlacement = 'bottom',
      prefixNodeTooltipTitle,
      prefixNodeTooltipMouseEnterDelay,
      prefixNodeTooltipMouseLeaveDelay,
      prefixNodeTooltipTrigger,
      prefixNodeTooltipPlacement = 'bottom',
      inputTooltipTitle,
      inputTooltipMouseEnterDelay,
      inputTooltipMouseLeaveDelay,
      inputTooltipTrigger,
      inputTooltipPlacement = 'bottom',
      suffixTooltipTitle,
      suffixTooltipMouseEnterDelay,
      suffixTooltipMouseLeaveDelay,
      suffixTooltipPlacement = 'bottom',
      suffixTooltipTrigger,
      tooltipColor = '#181818',
      className = '',
      inputClassName,
      inputWidth,
      suffixClassName,
      classNames,
      styles,
      style,
      renderDisplayValue,
      allowCustomValue,
      allowText,
      isFilterActive = false,
      hidePrefixIcon = false,
      alwaysShowSuffix = false,
      isSectionHovered: propIsSectionHovered,
      adapters: propAdapters,
      defaultAdapters,
      ...rest
    },
    ref
  ) => {
    const context = useServlyNumberInputContext();
    const adapters = useMemo(
      () => mergeAdapters(defaultCoreAdapters, defaultAdapters, context.adapters, propAdapters),
      [context.adapters, defaultAdapters, propAdapters]
    );
    const { Tooltip, TokenIcon, UnlinkIcon } = adapters;
    const designSystem = useMemo(() => resolveDesignSystem(designSystemConfig), [designSystemConfig]);
    const resolvedTheme = useMemo(() => resolveServlyNumberInputTheme(theme ?? context.theme), [context.theme, theme]);
    const resolvedSize = size ?? context.size ?? 'sm';
    const cssVariables = useMemo(
      () => getServlyNumberInputCssVariables(resolvedTheme, resolvedSize),
      [resolvedTheme, resolvedSize]
    );
    const overlayClassName = cx(
      'servly-number-input__overlay',
      `servly-number-input__overlay--theme-${resolvedTheme.mode}`,
      `servly-number-input__overlay--size-${resolvedSize}`,
      resolvedTheme.className
    );
    const resolvedAllowCustomValue = allowCustomValue ?? allowText ?? false;
    const tokenPickerCloseBehavior = tokenPicker?.closeBehavior ?? 'selection';
    const usesAutomaticTokenPickerDismiss = tokenPickerCloseBehavior === 'automatic';

    const [uncontrolledValue, setUncontrolledValue] = useState<ServlyNumberInputValue | ''>(defaultValue ?? '');
    const value = propValue !== undefined ? propValue : uncontrolledValue;
    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const editingValueRef = useRef<ServlyNumberInputValue | null>(null);
    const invalidTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isDraggingRef = useRef(false);
    const publicDraggingRef = useRef(false);
    const dragUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rejectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [isActive, setIsActive] = useState(false);
    const [isValid, setIsValid] = useState(true);
    const [showInvalidAnimation, setShowInvalidAnimation] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [tokenPickerVisible, setTokenPickerVisible] = useState(false);
    const [displayOverlayVisible, setDisplayOverlayVisible] = useState(false);
    const [internalValue, setInternalValue] = useState<ServlyNumberInputValue | ''>(value);
    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [containerWidth, setContainerWidth] = useState<number>();

    const setResolvedTokenPickerVisible = useCallback(
      (open: boolean) => {
        setTokenPickerVisible(open);
        onTokenPickerOpenChange?.(open);
      },
      [onTokenPickerOpenChange]
    );

    const setResolvedDropdownVisible = useCallback(
      (open: boolean) => {
        setDropdownVisible(open);
        if (open) {
          setShowSuggestions(false);
          if (usesAutomaticTokenPickerDismiss) setResolvedTokenPickerVisible(false);
        }
      },
      [setResolvedTokenPickerVisible, usesAutomaticTokenPickerDismiss]
    );

    useEffect(() => {
      const root = rootRef.current;
      if (!root || typeof ResizeObserver === 'undefined') return;

      const updateWidth = (width: number) => {
        if (width > 0) setContainerWidth(width);
      };
      updateWidth(root.getBoundingClientRect().width);

      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) updateWidth(entry.contentRect.width);
      });
      observer.observe(root);
      return () => observer.disconnect();
    }, []);

    const [currentSuffix, setCurrentSuffix] = useState(() => {
      if (unitOfMeasurement) return unitOfMeasurement;

      const initial = value !== undefined ? value : defaultValue;
      if (!initial || initial === '') {
        const firstMetric = suffixOptionList.find((opt) => opt.type === 'metric');
        return firstMetric?.value || 'px';
      }

      if (suffixOptionList.length > 0) {
        return determineSuffixFromValue(initial, suffixOptionList, unitOfMeasurement, designSystem);
      }

      return 'px';
    });

    const parsedCurrentValue = useMemo(() => parseValueWithUnit(value, designSystem), [designSystem, value]);
    const lastParentValueRef = useRef(value);
    const lastUnitOfMeasurementRef = useRef(unitOfMeasurement);

    useEffect(() => {
      setInternalValue(value);
      if (editingValueRef.current !== null && value !== editingValueRef.current) {
        editingValueRef.current = null;
      }
    }, [value]);

    useEffect(() => {
      if (propValue === undefined) {
        setUncontrolledValue(defaultValue ?? '');
      }
    }, [defaultValue, propValue]);

    useEffect(() => {
      if (unitOfMeasurement !== lastUnitOfMeasurementRef.current) {
        lastUnitOfMeasurementRef.current = unitOfMeasurement;

        if (unitOfMeasurement) {
          setCurrentSuffix(unitOfMeasurement);
        } else if (!currentSuffix || currentSuffix === unitOfMeasurement) {
          setCurrentSuffix(determineSuffixFromValue(value, suffixOptionList, undefined, designSystem));
        }
      }
    }, [currentSuffix, designSystem, suffixOptionList, unitOfMeasurement, value]);

    useEffect(() => {
      if (
        !isActive &&
        !isDragging &&
        value !== lastParentValueRef.current &&
        value !== undefined &&
        suffixOptionList.length > 0
      ) {
        const parsed = parseValueWithUnit(value, designSystem);
        if (parsed.unit && parsed.unit !== '' && !unitOfMeasurement) {
          const newSuffix = determineSuffixFromValue(value, suffixOptionList, unitOfMeasurement, designSystem);
          if (newSuffix !== currentSuffix) setCurrentSuffix(newSuffix);
        }

        lastParentValueRef.current = value;
      }
    }, [currentSuffix, designSystem, isActive, isDragging, suffixOptionList, unitOfMeasurement, value]);

    useEffect(() => {
      if (!isValid && isActive) {
        setShowInvalidAnimation(true);
        if (invalidTimeoutRef.current) clearTimeout(invalidTimeoutRef.current);
        invalidTimeoutRef.current = setTimeout(() => setShowInvalidAnimation(false), 2000);
      } else {
        setShowInvalidAnimation(false);
        if (invalidTimeoutRef.current) {
          clearTimeout(invalidTimeoutRef.current);
          invalidTimeoutRef.current = null;
        }
      }

      return () => {
        if (invalidTimeoutRef.current) clearTimeout(invalidTimeoutRef.current);
      };
    }, [isActive, isValid]);

    useEffect(() => {
      if (!isActive) {
        setShowSuggestions(false);
        if (usesAutomaticTokenPickerDismiss) setResolvedTokenPickerVisible(false);
      }
    }, [isActive, setResolvedTokenPickerVisible, usesAutomaticTokenPickerDismiss]);

    useEffect(() => {
      if (!tokenPickerVisible && !isDragging && inputRef.current !== document.activeElement) {
        setIsActive(false);
      }
    }, [isDragging, tokenPickerVisible]);

    useEffect(() => {
      if (displayOverlayVisible) {
        setShowSuggestions(false);
        setResolvedTokenPickerVisible(false);
      }
    }, [displayOverlayVisible, setResolvedTokenPickerVisible]);

    useEffect(() => {
      setShowSuggestions(false);
      setResolvedTokenPickerVisible(false);
    }, [renderDisplayValue, setResolvedTokenPickerVisible]);

    useEffect(
      () => () => {
        if (dragUpdateTimeoutRef.current) clearTimeout(dragUpdateTimeoutRef.current);
        if (rejectTimeoutRef.current) clearTimeout(rejectTimeoutRef.current);
      },
      []
    );

    const getFormattedValue = useCallback(
      (nextValue: unknown = value): ServlyNumberInputValue | '' => {
        const parsed = parseValueWithUnit(nextValue, designSystem);

        if (isDesignSystemSuffix(currentSuffix, designSystem)) {
          const presetValue = parsed.tailwindPreset ?? (typeof parsed.value === 'string' ? parsed.value : String(parsed.value ?? ''));
          const tokenDetails = getDesignSystemTokenDetails(presetValue, designSystem);
          if (typeof tokenDetails?.numericValue === 'number') return tokenDetails.numericValue;
          const matchingOption = suffixOptionList.find((opt) => opt.type === 'keyword' && opt.value === presetValue);
          return matchingOption?.label ?? tokenDetails?.label ?? presetValue;
        }

        if (parsed.unit === currentSuffix && typeof parsed.value === 'number') {
          return parsed.value;
        }

        const numericValue =
          typeof parsed.value === 'number'
            ? parsed.value
            : typeof parsed.numericValue === 'number'
              ? parsed.numericValue
              : Number.parseFloat(String(parsed.value));

        if (Number.isNaN(numericValue) && !resolvedAllowCustomValue) {
          return parsed.value ?? '0';
        }

        if (formatter && !Number.isNaN(numericValue)) {
          return formatter(numericValue, currentSuffix);
        }

        return Number.isNaN(numericValue) ? parsed.value : numericValue;
      },
      [currentSuffix, designSystem, formatter, resolvedAllowCustomValue, suffixOptionList, value]
    );

    const handleValueChange = useCallback(
      (newValue: ServlyNumberInputValue | '', explicitSuffix: string | null = null) => {
        if (disabled) return;

        const activeSuffix = explicitSuffix || currentSuffix || 'px';
        const isActivelyTyping = inputRef.current === document.activeElement;
        const { outputValue, unit } = formatOutputValue(newValue, activeSuffix, isActivelyTyping, designSystem, numberMode);
        const parsed = parseValueWithUnit(newValue, designSystem);
        const numericValue =
          typeof parsed.value === 'number'
            ? parsed.value
            : typeof parsed.numericValue === 'number'
              ? parsed.numericValue
            : typeof outputValue === 'number'
              ? outputValue
              : Number.parseFloat(String(outputValue)) || 0;

        if (propValue === undefined) {
          setUncontrolledValue(outputValue);
        }

        const isDesignSystemValue = isDesignSystemSuffix(activeSuffix, designSystem);
        const changeEvent: ServlyNumberInputChangeEvent = {
          target: { value: outputValue, name },
          value: outputValue,
          numericValue,
          unit,
          designSystem: isDesignSystemValue ? designSystem.id : undefined,
          isDesignSystem: isDesignSystemValue,
          isTailwind: activeSuffix === 'tailwind',
          isDragOperation: explicitSuffix !== null,
        };

        onChange?.(changeEvent);
      },
      [currentSuffix, designSystem, disabled, name, numberMode, onChange, propValue]
    );

    const getNumericValueForEvent = useCallback(
      (eventValue: ServlyNumberInputValue | '') => {
        const parsed = parseValueWithUnit(eventValue, designSystem);
        if (typeof parsed.value === 'number') return parsed.value;
        if (typeof parsed.numericValue === 'number') return parsed.numericValue;
        const parsedFloat = Number.parseFloat(String(parsed.value));
        return Number.isNaN(parsedFloat) ? 0 : parsedFloat;
      },
      [designSystem]
    );

    const createDisplayValueContext = useCallback(
      (
        eventValue: ServlyNumberInputValue | '' = value as ServlyNumberInputValue | '',
        dragging = isDragging
      ): ServlyNumberInputDisplayValueContext => ({
        value: eventValue,
        displayValue: getFormattedValue(eventValue),
        numericValue: getNumericValueForEvent(eventValue),
        unit: isDesignSystemSuffix(currentSuffix, designSystem) ? '' : currentSuffix,
        suffix: currentSuffix,
        isDragging: dragging,
        isActive,
        isValid,
        isPresetMode: shouldUsePresetMode(currentSuffix, suffixOptionList, designSystem),
        isDesignSystem: isDesignSystemSuffix(currentSuffix, designSystem),
      }),
      [currentSuffix, designSystem, getFormattedValue, getNumericValueForEvent, isActive, isDragging, isValid, suffixOptionList, value]
    );

    const emitValueDragEvent = useCallback(
      (
        phase: ServlyNumberInputValueDragEvent['phase'],
        eventValue: ServlyNumberInputValue | '' = value as ServlyNumberInputValue | '',
        details: Pick<ServlyNumberInputValueDragEvent, 'rawValue' | 'steps'> = {}
      ) => {
        const dragEvent: ServlyNumberInputValueDragEvent = {
          ...createDisplayValueContext(eventValue, phase !== 'end'),
          phase,
          ...details,
        };

        if (phase === 'start') onValueDragStart?.(dragEvent);
        if (phase === 'move') onValueDrag?.(dragEvent);
        if (phase === 'end') onValueDragEnd?.(dragEvent);
      },
      [createDisplayValueContext, onValueDrag, onValueDragEnd, onValueDragStart, value]
    );

    const handleDragStateChange = useCallback(
      (nextIsDragging: boolean) => {
        if (dragUpdateTimeoutRef.current) {
          clearTimeout(dragUpdateTimeoutRef.current);
          dragUpdateTimeoutRef.current = null;
        }

        if (nextIsDragging) {
          setDropdownVisible(false);
          setResolvedTokenPickerVisible(false);
        }
        setIsDragging(nextIsDragging);

        if (publicDraggingRef.current === nextIsDragging) return;
        publicDraggingRef.current = nextIsDragging;
        emitValueDragEvent(nextIsDragging ? 'start' : 'end');
      },
      [emitValueDragEvent, setResolvedTokenPickerVisible]
    );

    useEffect(() => {
      const handlePointerLockChange = () => {
        if (document.pointerLockElement || !isDraggingRef.current) return;
        isDraggingRef.current = false;
        handleDragStateChange(false);
      };

      document.addEventListener('pointerlockchange', handlePointerLockChange);
      return () => document.removeEventListener('pointerlockchange', handlePointerLockChange);
    }, [handleDragStateChange]);

    const triggerReject = useCallback((reason: ServlyNumberInputRejectReason) => {
      onReject?.({
        ...createDisplayValueContext(value as ServlyNumberInputValue | '', isDraggingRef.current),
        reason,
      });

      if (rejectTimeoutRef.current) {
        clearTimeout(rejectTimeoutRef.current);
        rejectTimeoutRef.current = null;
      }

      setIsRejecting(false);
      const restart = () => setIsRejecting(true);
      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(restart);
      } else {
        setTimeout(restart, 0);
      }

      rejectTimeoutRef.current = setTimeout(() => {
        setIsRejecting(false);
        rejectTimeoutRef.current = null;
      }, 320);
    }, [createDisplayValueContext, onReject, value]);

    const handleDragChange = useCallback(
      (newValue: number, dragInfo?: { deltaX?: number; deltaY?: number; steps?: number }) => {
        if (disabled) return;

        if (!isDraggingRef.current) {
          isDraggingRef.current = true;
          handleDragStateChange(true);
        }

        if (shouldUsePresetMode(currentSuffix, suffixOptionList, designSystem)) {
          if (dragInfo?.steps && dragInfo.steps !== 0) {
            const direction = dragInfo.steps > 0 ? 'up' : 'down';
            const steps = Math.abs(dragInfo.steps);
            const presetMap = getPresetMapForSuffix(currentSuffix, suffixOptionList, designSystem);
            const resolvedCurrentValue =
              value !== undefined && value !== null && value !== ''
                ? value
                : defaultValue !== undefined && defaultValue !== null && defaultValue !== ''
                  ? defaultValue
                  : getDefaultValueForSuffix(currentSuffix || 'px', suffixOptionList, designSystem);
            const nextPreset = getNextPresetValue(resolvedCurrentValue, direction, steps, presetMap, designSystem.defaultPreset);
            handleValueChange(nextPreset, currentSuffix);
            emitValueDragEvent('move', nextPreset, { steps: dragInfo.steps });
          }
        } else {
          const numericValue = typeof newValue === 'number' ? newValue : Number.parseFloat(String(newValue)) || 0;
          const clampedValue = validateNumericInput(numericValue, min, max);
          if (clampedValue !== numericValue) triggerReject(numericValue > clampedValue ? 'max' : 'min');
          const roundedValue = normalizeNumberForMode(Math.round(clampedValue * 10) / 10, numberMode);
          handleValueChange(roundedValue, currentSuffix || 'px');
          emitValueDragEvent('move', roundedValue, { rawValue: newValue });
        }

        if (dragUpdateTimeoutRef.current) clearTimeout(dragUpdateTimeoutRef.current);
        // Keep drag display extensions mounted between rapid drag updates.
        // Some drag primitives do not emit a reliable drag-end; this debounce is
        // only a fallback and is reset by real drag lifecycle callbacks.
        dragUpdateTimeoutRef.current = setTimeout(() => {
          if (document.pointerLockElement) return;
          isDraggingRef.current = false;
          handleDragStateChange(false);
        }, 160);
      },
      [
        currentSuffix,
        defaultValue,
        designSystem,
        disabled,
        emitValueDragEvent,
        handleDragStateChange,
        handleValueChange,
        max,
        min,
        numberMode,
        suffixOptionList,
        triggerReject,
        value,
      ]
    );

    const handleInputChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = event.target.value;
        editingValueRef.current = inputValue;
        setInternalValue(inputValue);

        if (inputValue === '') {
          setIsValid(true);
          setShowSuggestions(false);
          handleValueChange('');
          return;
        }

        const isNumericLikeInput = /^-?\d*\.?\d*$/.test(inputValue);

        if (!isNumericLikeInput && valueInDesignSystem(inputValue, designSystem)) {
          if (isDesignSystemSuffix(currentSuffix, designSystem)) {
            setIsValid(true);
            setShowSuggestions(false);
            handleValueChange(inputValue);
          } else {
            setIsValid(true);
            setShowSuggestions(true);
          }
          return;
        }

        if (isDesignSystemSuffix(currentSuffix, designSystem)) {
          if (valueInDesignSystem(inputValue, designSystem)) {
            setIsValid(true);
            setShowSuggestions(false);
            handleValueChange(inputValue);
            return;
          }

          const isValidPartial =
            Object.keys(designSystem.presetMap).some((preset) => preset.startsWith(inputValue)) ||
            designSystem.keywords.some((keyword) => keyword.startsWith(inputValue));

          setIsValid(isValidPartial);
          if (!isValidPartial) triggerReject('invalid-preset');
          setShowSuggestions(false);
          setResolvedTokenPickerVisible(true);
          return;
        }

        if (isMetricLike(currentSuffix, suffixOptionList)) {
          const isValidNumericPattern = /^-?\d*\.?\d*$/.test(inputValue);
          setIsValid(isValidNumericPattern);
          setShowSuggestions(false);
          if (!isValidNumericPattern) triggerReject('invalid-number');
          if (isValidNumericPattern) handleValueChange(inputValue);
          return;
        }

        if (currentSuffix === 'number' || currentSuffix === '#') {
          const isValidNumberPattern = isValidPartialNumberForMode(inputValue, numberMode);
          setIsValid(isValidNumberPattern);
          setShowSuggestions(false);
          if (!isValidNumberPattern) triggerReject('invalid-number');
          if (isValidNumberPattern) handleValueChange(inputValue);
          return;
        }

        if (resolvedAllowCustomValue) {
          setIsValid(true);
          setShowSuggestions(false);
          handleValueChange(inputValue);
        } else {
          setIsValid(false);
          triggerReject('invalid-custom');
          setShowSuggestions(false);
        }
      },
      [
        currentSuffix,
        designSystem,
        handleValueChange,
        numberMode,
        resolvedAllowCustomValue,
        setResolvedTokenPickerVisible,
        suffixOptionList,
        triggerReject,
      ]
    );

    const handleInputFocus = useCallback(
      (event: React.FocusEvent<HTMLInputElement>) => {
        setIsActive(true);
        setIsValid(true);

        const parsed = parseValueWithUnit(value, designSystem);
        if (!parsed.isKeyword && !parsed.isTailwind && !parsed.isDesignSystem && !parsed.isText) {
          if (typeof parsed.value === 'number' && parsed.unit) {
            event.target.value = parsed.value.toString();
          }
          inputRef.current?.select();
        }

        onFocus?.(event);
      },
      [designSystem, onFocus, value]
    );

    const handleInputBlur = useCallback(
      (event: React.FocusEvent<HTMLInputElement>) => {
        const relatedTarget = event.relatedTarget as HTMLElement | null;
        const isClickingOnSuggestion =
          relatedTarget?.closest('.servly-number-input__suggestions') ||
          relatedTarget?.closest('.servly-number-input__suggestions-popover') ||
          relatedTarget?.closest('.servly-number-input__token-picker') ||
          relatedTarget?.closest('.servly-number-input__token-picker-popover');

        if (isClickingOnSuggestion) return;

        const inputValue = internalValue !== undefined ? internalValue : event.target.value;
        handleValueChange(inputValue);
        setIsActive(tokenPickerVisible && !usesAutomaticTokenPickerDismiss);
        setShowSuggestions(false);
        if (usesAutomaticTokenPickerDismiss) setResolvedTokenPickerVisible(false);
        editingValueRef.current = null;
        setIsValid(true);
        onBlur?.(event);
      },
      [handleValueChange, internalValue, onBlur, setResolvedTokenPickerVisible, tokenPickerVisible, usesAutomaticTokenPickerDismiss]
    );

    const handleSuffixChange = useCallback(
      (newSuffix: string) => {
        const parsed = parseValueWithUnit(value, designSystem);
        const selectedOption = suffixOptionList.find((opt) => opt.value === newSuffix);

        if (selectedOption?.type === 'keyword') {
          setCurrentSuffix(designSystem.id);
          handleValueChange(newSuffix, designSystem.id);
          setDropdownVisible(false);
          return;
        }

        if (isDesignSystemOption(selectedOption, designSystem)) {
          if (typeof parsed.value === 'number' && !isDesignSystemSuffix(currentSuffix, designSystem)) {
            let pixelValue = parsed.value;
            if (currentSuffix !== 'px') {
              pixelValue = convertUnit(parsed.value, currentSuffix, 'px', basePixel);
            }

            const preset = getClosestDesignSystemPreset(pixelValue, designSystem);

            setCurrentSuffix(designSystem.id);
            handleValueChange(preset || designSystem.defaultPreset, designSystem.id);
          } else {
            setCurrentSuffix(designSystem.id);
            if (!isDesignSystemSuffix(currentSuffix, designSystem)) handleValueChange(designSystem.defaultPreset, designSystem.id);
          }
          setDropdownVisible(false);
          return;
        }

        if (isDesignSystemSuffix(currentSuffix, designSystem) && !isDesignSystemSuffix(newSuffix, designSystem)) {
          let convertedValue = 0;
          let hasConverted = false;

          if (
            (designSystem.id === 'tailwind' && parsed.isTailwind) ||
            parsed.isDesignSystem ||
            (typeof parsed.value === 'string' && valueInDesignSystem(parsed.value, designSystem))
          ) {
            const presetKey = parsed.designSystemPreset ?? parsed.tailwindPreset ?? (typeof parsed.value === 'string' ? parsed.value : undefined);
            if (presetKey && Object.prototype.hasOwnProperty.call(designSystem.presetMap, presetKey)) {
              const pixelValue = designSystem.presetMap[presetKey];
              convertedValue = convertUnit(pixelValue, 'px', newSuffix, basePixel);
              hasConverted = true;
            } else if (typeof parsed.numericValue === 'number') {
              convertedValue = convertUnit(parsed.numericValue, 'px', newSuffix, basePixel);
              hasConverted = true;
            }
          } else if (typeof parsed.value === 'number') {
            convertedValue = convertUnit(parsed.value, 'px', newSuffix, basePixel);
            hasConverted = true;
          } else if (typeof parsed.numericValue === 'number') {
            convertedValue = convertUnit(parsed.numericValue, 'px', newSuffix, basePixel);
            hasConverted = true;
          }

          // Non-numeric design-system keywords need a useful metric starting point.
          if (!hasConverted) {
            const defaults: Record<string, number> = {
              '%': 100,
              rem: 1,
              em: 1,
              vh: 50,
              vw: 50,
              px: 16,
            };
            convertedValue = defaults[newSuffix] || 16;
          }

          setCurrentSuffix(newSuffix);
          handleValueChange(convertedValue, newSuffix);
          setDropdownVisible(false);
          return;
        }

        const oldSuffixOption = suffixOptionList.find((opt) => opt.value === currentSuffix);
        const newSuffixOption = suffixOptionList.find((opt) => opt.value === newSuffix);

        if (oldSuffixOption?.type === 'metric' && newSuffixOption?.type === 'metric') {
          if (typeof parsed.value === 'number') {
            const convertedValue = convertUnit(parsed.value, currentSuffix, newSuffix, basePixel);
            setCurrentSuffix(newSuffix);
            handleValueChange(convertedValue, newSuffix);
          } else {
            setCurrentSuffix(newSuffix);
            handleValueChange(parsed.value, newSuffix);
          }

          setDropdownVisible(false);
          return;
        }

        setCurrentSuffix(newSuffix);
        setDropdownVisible(false);
      },
      [basePixel, currentSuffix, designSystem, handleValueChange, suffixOptionList, value]
    );

    useImperativeHandle(
      ref,
      () => ({
        focus: () => inputRef.current?.focus(),
        blur: () => inputRef.current?.blur(),
        select: () => inputRef.current?.select(),
        setSelectionRange: (start, end) => inputRef.current?.setSelectionRange(start, end),
        getValue: () => getFormattedValue(),
        setValue: (newValue) => handleValueChange(newValue),
        getNumericValue: () => coerceNumericValue(value),
        getUnit: () => currentSuffix,
        setUnit: (unit) => setCurrentSuffix(unit),
      }),
      [currentSuffix, getFormattedValue, handleValueChange, value]
    );

    const designSystemSelection = useMemo(() => {
      if (!isDesignSystemSuffix(currentSuffix, designSystem)) return undefined;
      if (parsedCurrentValue.isKeyword) return String(parsedCurrentValue.value);

      if (
        (designSystem.id === 'tailwind' && parsedCurrentValue.isTailwind) ||
        parsedCurrentValue.isDesignSystem ||
        (typeof parsedCurrentValue.value === 'string' && valueInDesignSystem(parsedCurrentValue.value, designSystem))
      ) {
        if (parsedCurrentValue.designSystemPreset) return parsedCurrentValue.designSystemPreset;
        if (parsedCurrentValue.tailwindPreset) return parsedCurrentValue.tailwindPreset;
        if (typeof parsedCurrentValue.value === 'string') return parsedCurrentValue.value;
        if (typeof parsedCurrentValue.numericValue === 'number') return String(parsedCurrentValue.numericValue);
      }

      return undefined;
    }, [currentSuffix, designSystem, parsedCurrentValue]);

    const designSystemTokenDetails = useMemo(() => {
      if (!designSystemSelection) return undefined;
      return getDesignSystemTokenDetails(designSystemSelection, designSystem);
    }, [designSystem, designSystemSelection]);

    const designSystemTooltipTitle = useMemo(() => {
      if (!designSystemTokenDetails) return undefined;
      const displayValue = designSystemTokenDetails.metaLabel ?? designSystemTokenDetails.numericValue;
      if (displayValue === undefined || displayValue === '') return designSystemTokenDetails.label;
      return `${designSystemTokenDetails.label}: ${displayValue}`;
    }, [designSystemTokenDetails]);

    const displayValue = useMemo(() => {
      if (editingValueRef.current !== null && isActive) return editingValueRef.current;

      const activeValue = isActive ? internalValue : value;

      if (
        activeValue === undefined ||
        activeValue === null ||
        (resolvedAllowCustomValue && activeValue === '') ||
        (typeof activeValue === 'number' && Number.isNaN(activeValue))
      ) {
        if (resolvedAllowCustomValue) return activeValue ?? '';
        const fallback = defaultValue ?? '';
        return fallback === '' ? '0' : fallback;
      }

      if (currentSuffix === '%' && typeof activeValue === 'number') {
        return activeValue.toString();
      }

      const parsed = parseValueWithUnit(activeValue, designSystem);

      if (isActive) {
        if (
          isDesignSystemSuffix(currentSuffix, designSystem) &&
          (parsed.isKeyword ||
            (designSystem.id === 'tailwind' && parsed.isTailwind) ||
            parsed.isDesignSystem ||
            (typeof parsed.value === 'string' && valueInDesignSystem(parsed.value, designSystem)))
        ) {
          return getFormattedValue(activeValue);
        }
        if (!parsed.isKeyword && !parsed.isTailwind && !parsed.isDesignSystem && !parsed.isText) {
          return typeof parsed.value === 'number' ? parsed.value.toString() : activeValue;
        }
      }

      const formatted = getFormattedValue(activeValue);

      if (currentSuffix === '%') {
        if (typeof activeValue === 'string' && activeValue.endsWith('%')) return activeValue.slice(0, -1);
        if (typeof formatted === 'string' && formatted.endsWith('%')) return formatted.slice(0, -1);
        if (typeof formatted === 'number') return formatted.toString();
      }

      return formatted;
    }, [currentSuffix, defaultValue, designSystem, getFormattedValue, internalValue, isActive, resolvedAllowCustomValue, value]);

    const isDesignSystemValue =
      isDesignSystemSuffix(currentSuffix, designSystem) &&
      ((designSystem.id === 'tailwind' && parsedCurrentValue.isTailwind) ||
        parsedCurrentValue.isDesignSystem ||
        parsedCurrentValue.isKeyword ||
        (typeof parsedCurrentValue.value === 'string' && valueInDesignSystem(parsedCurrentValue.value, designSystem)));
    const displayValueContext = useMemo<ServlyNumberInputDisplayValueContext>(
      () => ({
        value,
        displayValue,
        numericValue: getNumericValueForEvent(value),
        unit: isDesignSystemSuffix(currentSuffix, designSystem) ? '' : currentSuffix,
        suffix: currentSuffix,
        isDragging,
        isActive,
        isValid,
        isPresetMode: shouldUsePresetMode(currentSuffix, suffixOptionList, designSystem),
        isDesignSystem: Boolean(isDesignSystemValue),
      }),
      [
        currentSuffix,
        designSystem,
        displayValue,
        getNumericValueForEvent,
        isActive,
        isDesignSystemValue,
        isDragging,
        isValid,
        suffixOptionList,
        value,
      ]
    );
    const contextSectionHovered = propIsSectionHovered ?? context.isSectionHovered;
    const resolvedIsSectionHovered = alwaysShowSuffix || contextSectionHovered || isHovered;
    const isPresetMode = shouldUsePresetMode(currentSuffix, suffixOptionList, designSystem);
    const prefixValue = coerceNumericValue(value);
    const prefixDragValue: ServlyNumberInputValue =
      isPresetMode && value !== undefined && value !== null && value !== ''
        ? value
        : isPresetMode
          ? getDefaultValueForSuffix(currentSuffix || 'px', suffixOptionList, designSystem)
          : prefixValue;
    const hasPrefix = Boolean(prefixLabelText || prefixNode || prefixIcon);
    const shouldHideSuffix = hideSuffixWhenTokenLinked && Boolean(isDesignSystemValue);
    const hasSuffix = !shouldHideSuffix && Boolean(suffixNode || suffixOptionList.length > 0);
    const hasSuffixMenu = !shouldHideSuffix && suffixOptionList.length > 0;
    const hasDesignSystemOption = suffixOptionList.some((option) => isDesignSystemOption(option, designSystem));
    const hasTokenSource = designSystem.libraries.length > 0 || Boolean(designSystemConfig) || hasDesignSystemOption;
    const shouldShowTokenTrigger =
      showTokenTrigger === true ||
      (showTokenTrigger !== false && hasTokenSource && Object.keys(designSystem.presetMap).length > 0);
    const layoutContext = createServlyNumberInputLayoutContext({
      containerWidth,
      size: resolvedSize,
      isHovered,
      isFocused: isActive,
      isDragging,
      isTokenLinked: Boolean(isDesignSystemValue),
      hasPrefix,
      hasSuffixMenu,
    });
    const tokenActionPlacement =
      shouldShowTokenTrigger && !isDesignSystemValue && !isDragging
        ? resolveServlyNumberInputTokenActionPlacement(layoutContext, layoutPolicy)
        : 'hidden';
    const shouldShowManualTokenTrigger = tokenActionPlacement === 'inline';
    const shouldShowSuffixMenuTokenAction = tokenActionPlacement === 'suffix-menu';
    const shouldUseLinkedTokenPicker = shouldShowTokenTrigger && isDesignSystemValue && !isDragging;
    const shouldShowLinkedUnlinkTrigger = shouldUseLinkedTokenPicker && isHovered;
    const manualTokenValue = !isDesignSystemValue && value !== undefined && value !== null && value !== '' ? value : undefined;

    useEffect(() => {
      if (tokenPickerVisible && !isDesignSystemValue && tokenActionPlacement !== 'suffix-menu' && !shouldShowManualTokenTrigger) {
        setResolvedTokenPickerVisible(false);
      }
    }, [
      isDesignSystemValue,
      setResolvedTokenPickerVisible,
      shouldShowManualTokenTrigger,
      tokenActionPlacement,
      tokenPickerVisible,
    ]);
    const unlinkTokenValue = () => {
      const metricSuffix = suffixOptionList.find((option) => option.type === 'metric')?.value || 'px';
      if (usesAutomaticTokenPickerDismiss) setResolvedTokenPickerVisible(false);
      setShowSuggestions(false);
      setDropdownVisible(false);
      const resolvedTokenValue =
        designSystemSelection && Object.prototype.hasOwnProperty.call(designSystem.presetMap, designSystemSelection)
          ? designSystem.presetMap[designSystemSelection]
          : coerceNumericValue(value);
      setCurrentSuffix(metricSuffix);
      handleValueChange(resolvedTokenValue, metricSuffix);
      onTokenUnlink?.();
      setTimeout(() => inputRef.current?.focus(), 0);
    };

    const tokenPickerProps = {
      adapters,
      visible: tokenPickerVisible,
      designSystem,
      selectedValue: designSystemSelection,
      classNames,
      styles,
      overlayClassName,
      overlayStyle: cssVariables,
      tokenPicker,
      manualValue: manualTokenValue,
      renderTokenPicker,
      renderCreateVariableValue: ({
        value: createVariableValue,
        unitOfMeasurement: createVariableUnit,
        onChange: onCreateVariableValueChange,
        onTokenUnlink: onCreateVariableTokenUnlink,
      }) => (
        <ServlyNumberInputCore
          value={createVariableValue}
          unitOfMeasurement={createVariableUnit}
          suffixOptionList={suffixOptionList}
          onChange={onCreateVariableValueChange}
          onTokenUnlink={onCreateVariableTokenUnlink}
          designSystem={designSystem}
          showTokenTrigger="auto"
          hideSuffixWhenTokenLinked
          tokenPicker={{
            ...tokenPicker,
            closeBehavior: 'selection',
            createVariable: false,
            showManualValue: false,
          }}
          theme={resolvedTheme}
          size={resolvedSize}
          adapters={adapters}
          classNames={classNames}
          styles={{
            ...styles,
            root: { ...styles?.root, width: '100%' },
          }}
          className="servly-number-input__create-variable-number-input"
        />
      ),
      onOpenChange: setResolvedTokenPickerVisible,
      onAddTokenLibrary,
      onSelectToken: (token) => {
        editingValueRef.current = null;
        setIsValid(true);
        setShowSuggestions(false);
        setCurrentSuffix(designSystem.id);
        handleValueChange(token.value, designSystem.id);
        setTimeout(() => inputRef.current?.focus(), 0);
      },
    } satisfies Omit<React.ComponentProps<typeof TokenPickerPopover>, 'children'>;
    const hasInteractiveOverlay = tokenPickerVisible || dropdownVisible || showSuggestions || isDragging || displayOverlayVisible;

    const tokenTrigger = shouldShowManualTokenTrigger && !isDragging ? (
      <TokenPickerPopover
        {...tokenPickerProps}
      >
        <button
          type="button"
          className={cx(
            'servly-number-input__token-trigger',
            tokenPickerVisible && 'is-open',
            'is-manual',
            classNames?.tokenTrigger
          )}
          style={styles?.tokenTrigger}
          aria-label="Open design token presets"
          aria-expanded={tokenPickerVisible}
          disabled={false}
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.preventDefault();
            setShowSuggestions(false);
            setDropdownVisible(false);
            if (!tokenPickerVisible) setResolvedTokenPickerVisible(true);
            else if (usesAutomaticTokenPickerDismiss) setResolvedTokenPickerVisible(false);
          }}
        >
          <TokenIcon className={cx('servly-number-input__token-icon', classNames?.tokenIcon)} size={14} />
        </button>
      </TokenPickerPopover>
    ) : null;

    const linkedUnlinkTrigger = shouldShowLinkedUnlinkTrigger ? (
      <button
        type="button"
        className={cx('servly-number-input__token-trigger', 'is-linked', classNames?.tokenTrigger)}
        style={styles?.tokenTrigger}
        aria-label="Unlink design token preset"
        disabled={false}
        onMouseDown={(event) => event.preventDefault()}
        onClick={(event) => {
          event.preventDefault();
          unlinkTokenValue();
        }}
      >
        <UnlinkIcon
          className={cx('servly-number-input__token-icon', 'servly-number-input__token-icon--unlink', classNames?.tokenIcon)}
          size={14}
        />
      </button>
    ) : null;

    const inputField = (
      <InputField
        adapters={adapters}
        ref={inputRef}
        value={displayValue}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        name={name}
        id={id}
        data-testid={testId}
        step={step}
        min={min}
        max={max}
        inputClassName={inputClassName}
        inputWidth={inputWidth}
        inputTooltipTitle={inputTooltipTitle}
        inputTooltipTrigger={inputTooltipTrigger}
        inputTooltipPlacement={inputTooltipPlacement}
        inputTooltipMouseEnterDelay={inputTooltipMouseEnterDelay}
        inputTooltipMouseLeaveDelay={inputTooltipMouseLeaveDelay}
        tooltipColor={tooltipColor}
        isDesignSystemValue={isDesignSystemValue}
        designSystemLabel={designSystem.label}
        designSystemTooltipTitle={designSystemTooltipTitle}
        designSystemInputClassName={designSystem.inputClassName}
        hasPrefix={hasPrefix}
        hasSuffix={hasSuffix}
        isFilterActive={isFilterActive}
        classNames={classNames}
        styles={styles}
        displayValueContext={displayValueContext}
        renderDisplayValue={renderDisplayValue}
        onDisplayOverlayChange={setDisplayOverlayVisible}
        isTokenPickerOpen={tokenPickerVisible}
        suppressTooltip={hasInteractiveOverlay}
        renderTokenValueWrapper={
          shouldUseLinkedTokenPicker
            ? (tokenValue) => <TokenPickerPopover {...tokenPickerProps}>{tokenValue}</TokenPickerPopover>
            : undefined
        }
        onTokenValueClick={
          tokenPicker?.tokenValueClickBehavior === 'edit'
            ? undefined
            : (event) => {
                event.preventDefault();
                setShowSuggestions(false);
                setDropdownVisible(false);
                setIsActive(true);
                setResolvedTokenPickerVisible(!tokenPickerVisible);
              }
        }
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={(event) => {
          if (event.ctrlKey && event.code === 'Space') {
            event.preventDefault();
            if (tokenPickerVisible && !usesAutomaticTokenPickerDismiss) return;
            setShowSuggestions(true);
            setResolvedTokenPickerVisible(false);
            return;
          }
          if (event.key === 'Escape') {
            setShowSuggestions(false);
            if (usesAutomaticTokenPickerDismiss) setResolvedTokenPickerVisible(false);
            return;
          }
          onKeyDown?.(event);
        }}
        onKeyUp={onKeyUp}
        {...rest}
      />
    );

    const tokenPickerInputField =
      tokenPickerVisible && tokenPicker?.tokenValueClickBehavior === 'edit' ? (
        <TokenPickerPopover {...tokenPickerProps}>{inputField}</TokenPickerPopover>
      ) : (
        inputField
      );

    return (
      <Tooltip
        title={hasInteractiveOverlay ? undefined : componentTooltipTitle}
        trigger={componentTooltipTrigger}
        placement={componentTooltipPlacement}
        mouseEnterDelay={componentTooltipMouseEnterDelay}
        mouseLeaveDelay={componentTooltipMouseLeaveDelay}
        color={tooltipColor}
      >
        <div
          ref={rootRef}
          className={cx(
            'servly-number-input',
            `servly-number-input--theme-${resolvedTheme.mode}`,
            `servly-number-input--size-${resolvedSize}`,
            disabled && 'servly-number-input--disabled',
            showInvalidAnimation && 'servly-number-input--invalid',
            isRejecting && 'servly-number-input--reject',
            (isActive || tokenPickerVisible || isDragging) && !showInvalidAnimation && !isRejecting && 'servly-number-input--active',
            isHovered && !isDragging && 'servly-number-input--hovered',
            isDragging && 'servly-number-input--dragging',
            shouldShowSuffixMenuTokenAction && 'servly-number-input--compact-token-action',
            `servly-number-input--token-action-${tokenActionPlacement}`,
            isFilterActive && 'servly-number-input--filter-active',
            isDesignSystemValue && designSystem.className,
            resolvedTheme.className,
            className,
            classNames?.root
          )}
          style={{ ...cssVariables, ...style, ...styles?.root }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <SuggestionsPopover
            adapters={adapters}
            visible={showSuggestions && isActive}
            currentSuffix={currentSuffix}
            inputValue={displayValue}
            isPresetMode={isPresetMode}
            suffixOptionList={suffixOptionList}
            designSystem={designSystem}
            classNames={classNames}
            styles={styles}
            overlayClassName={overlayClassName}
            overlayStyle={cssVariables}
            onClose={() => setShowSuggestions(false)}
            onSuggestionClick={(selectedValue) => {
              editingValueRef.current = null;
              setIsValid(true);
              handleValueChange(selectedValue, currentSuffix);
              setShowSuggestions(false);
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
          >
            <div className={cx('servly-number-input__inner', classNames?.inner)} style={styles?.inner}>
              <div className={cx('servly-number-input__control', classNames?.control)} style={styles?.control}>
                <PrefixSection
                  adapters={adapters}
                  prefixLabelText={hidePrefixIcon ? '' : prefixLabelText}
                  prefixNode={hidePrefixIcon ? null : prefixIcon || prefixNode}
                  hidePrefixIcon={hidePrefixIcon}
                  disabled={disabled}
                  prefixNodeTooltipTitle={prefixNodeTooltipTitle}
                  prefixNodeTooltipTrigger={prefixNodeTooltipTrigger}
                  prefixNodeTooltipPlacement={prefixNodeTooltipPlacement}
                  prefixNodeTooltipMouseEnterDelay={prefixNodeTooltipMouseEnterDelay}
                  prefixNodeTooltipMouseLeaveDelay={prefixNodeTooltipMouseLeaveDelay}
                  tooltipColor={tooltipColor}
                  value={prefixDragValue}
                  min={min}
                  max={max}
                  step={step}
                  disablePointerLock={disablePointerLock}
                  isPresetMode={isPresetMode}
                  presetMap={getPresetMapForSuffix(currentSuffix, suffixOptionList, designSystem)}
                  isFilterActive={isFilterActive}
                  classNames={classNames}
                  styles={styles}
                  onDragChange={handleDragChange}
                  onDragReject={triggerReject}
                  onInputFocus={(event) => {
                    event.preventDefault();
                    inputRef.current?.focus();
                    inputRef.current?.select();
                  }}
                  onDragStateChange={handleDragStateChange}
                />

                {tokenPickerInputField}
              </div>

              {tokenTrigger}
              {linkedUnlinkTrigger}

              {hasSuffix ? (
                <SuffixDropdown
                  adapters={adapters}
                  suffixNode={suffixNode}
                  suffixOptionList={suffixOptionList}
                  currentSuffix={currentSuffix}
                  isDesignSystemValue={Boolean(isDesignSystemValue)}
                  designSystem={designSystem}
                  designSystemSelection={designSystemSelection}
                  designSystemTooltipTitle={designSystemTooltipTitle}
                  dropdownVisible={dropdownVisible}
                  setDropdownVisible={setResolvedDropdownVisible}
                  suffixClassName={suffixClassName}
                  suffixTooltipTitle={suffixTooltipTitle}
                  suffixTooltipTrigger={suffixTooltipTrigger}
                  suffixTooltipPlacement={suffixTooltipPlacement}
                  suffixTooltipMouseEnterDelay={suffixTooltipMouseEnterDelay}
                  suffixTooltipMouseLeaveDelay={suffixTooltipMouseLeaveDelay}
                  tooltipColor={tooltipColor}
                  isFilterActive={isFilterActive}
                  isHovered={isHovered}
                  isSectionHovered={resolvedIsSectionHovered}
                  isDragging={isDragging}
                  classNames={classNames}
                  styles={styles}
                  overlayClassName={overlayClassName}
                  overlayStyle={cssVariables}
                  leadingAction={
                    shouldShowSuffixMenuTokenAction
                      ? {
                          key: 'servly-apply-variable',
                          label: 'Apply variable',
                          icon: <TokenIcon className="servly-number-input__suffix-option-token-icon" size={14} />,
                          onClick: () => {
                            setDropdownVisible(false);
                            setShowSuggestions(false);
                            setIsActive(true);
                            setResolvedTokenPickerVisible(true);
                          },
                        }
                      : undefined
                  }
                  renderDropdownWrapper={
                    shouldShowSuffixMenuTokenAction
                      ? (dropdown) => (
                          <TokenPickerPopover {...tokenPickerProps} triggerOpenChange={false}>
                            <span className="servly-number-input__compact-token-anchor">{dropdown}</span>
                          </TokenPickerPopover>
                        )
                      : undefined
                  }
                  onSuffixChange={handleSuffixChange}
                />
              ) : null}
            </div>
          </SuggestionsPopover>
        </div>
      </Tooltip>
    );
  }
);

ServlyNumberInputCore.displayName = 'ServlyNumberInputCore';
