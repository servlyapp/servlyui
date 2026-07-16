import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import type {
  ServlyNumberInputAdapters,
  ServlyNumberInputClassNames,
  ServlyNumberInputRejectReason,
  ServlyNumberInputStyles,
} from '../types';
import { cx } from '../utils/cx';
import { findPresetIndex, getOrderedPresetList, getPresetByIndex } from '../utils/numberInputUtils';

type DragRejectReason = Extract<ServlyNumberInputRejectReason, 'min' | 'max' | 'preset-start' | 'preset-end'>;

interface PrefixSectionProps {
  adapters: ServlyNumberInputAdapters;
  prefixLabelText?: string;
  prefixNode?: React.ReactNode;
  disabled?: boolean;
  prefixNodeTooltipTitle?: React.ReactNode;
  prefixNodeTooltipTrigger?: string | string[];
  prefixNodeTooltipPlacement?: string;
  prefixNodeTooltipMouseEnterDelay?: number;
  prefixNodeTooltipMouseLeaveDelay?: number;
  tooltipColor?: string;
  value: string | number;
  min?: number;
  max?: number;
  step?: number;
  disablePointerLock?: boolean;
  isPresetMode?: boolean;
  presetMap: Record<string, number>;
  isFilterActive?: boolean;
  hidePrefixIcon?: boolean;
  classNames?: ServlyNumberInputClassNames;
  styles?: ServlyNumberInputStyles;
  onDragChange: (value: number, dragInfo?: { deltaX?: number; deltaY?: number; steps?: number }) => void;
  onDragReject?: (reason: DragRejectReason) => void;
  onInputFocus: (event: React.MouseEvent) => void;
  onDragStateChange?: (isDragging: boolean) => void;
}

export const PrefixSection = memo(
  ({
    adapters,
    prefixLabelText,
    prefixNode,
    disabled = false,
    prefixNodeTooltipTitle,
    prefixNodeTooltipTrigger,
    prefixNodeTooltipPlacement,
    prefixNodeTooltipMouseEnterDelay,
    prefixNodeTooltipMouseLeaveDelay,
    tooltipColor = '#181818',
    value,
    min = 0,
    max = 100,
    step = 1,
    disablePointerLock = false,
    isPresetMode = false,
    presetMap,
    isFilterActive = false,
    hidePrefixIcon = false,
    classNames,
    styles,
    onDragChange,
    onDragReject,
    onInputFocus,
    onDragStateChange,
  }: PrefixSectionProps) => {
    const { Tooltip, DraggableNumberInput } = adapters;
    const [currentPresetIndex, setCurrentPresetIndex] = useState(0);
    const presetList = React.useMemo(() => getOrderedPresetList(presetMap), [presetMap]);
    const presetDragStepSize = React.useMemo(() => {
      if (!isPresetMode) return 1;
      if (presetList.length <= 4) return 5;
      if (presetList.length <= 8) return 4;
      if (presetList.length <= 16) return 3.25;
      return 2.4;
    }, [isPresetMode, presetList.length]);
    const dragAccumulator = useRef(0);
    const lastEmittedValue = useRef<string | number | null>(null);
    const isInitialized = useRef(false);
    const isDraggingRef = useRef(false);
    const isMouseDownRef = useRef(false);
    const hasDragMovementRef = useRef(false);
    const pendingDragValue = useRef<number | null>(null);
    const dragRafId = useRef<number | null>(null);
    const isMouseOverRef = useRef(false);
    const lastRejectAtRef = useRef(0);

    const emitDragReject = useCallback(
      (reason: DragRejectReason) => {
        const now = performance.now();
        if (now - lastRejectAtRef.current < 140) return;
        lastRejectAtRef.current = now;
        onDragReject?.(reason);
      },
      [onDragReject]
    );

    useEffect(() => {
      if (isDraggingRef.current) return;

      if (isPresetMode) {
        const index = findPresetIndex(value, presetList);
        setCurrentPresetIndex(index);
        dragAccumulator.current = index;
        lastEmittedValue.current = value;
      } else {
        const numericValue = value !== '' && value != null ? (typeof value === 'number' ? value : Number.parseFloat(String(value)) || 0) : 0;
        dragAccumulator.current = numericValue;
        lastEmittedValue.current = numericValue;
      }
      isInitialized.current = true;
    }, [isPresetMode, presetList, value]);

    const handleDragEnd = useCallback(() => {
      if (dragRafId.current !== null) {
        cancelAnimationFrame(dragRafId.current);
        dragRafId.current = null;
      }

      if (pendingDragValue.current !== null) {
        const finalValue = pendingDragValue.current;
        pendingDragValue.current = null;
        setTimeout(() => onDragChange(finalValue), 0);
      }

      if (!disablePointerLock && document.pointerLockElement) {
        document.exitPointerLock();
      }

      isDraggingRef.current = false;
      isMouseDownRef.current = false;
      hasDragMovementRef.current = false;
      onDragStateChange?.(false);
    }, [disablePointerLock, onDragChange, onDragStateChange]);

    const handleDragStart = useCallback(() => {
      hasDragMovementRef.current = false;
      isDraggingRef.current = true;
      onDragStateChange?.(true);
    }, [onDragStateChange]);

    const handleDragChange = useCallback(
      (newValue: number) => {
        hasDragMovementRef.current = true;
        if (!isDraggingRef.current) {
          isDraggingRef.current = true;
          onDragStateChange?.(true);
        }

        if (!isInitialized.current) {
          dragAccumulator.current = isPresetMode ? findPresetIndex(value, presetList) : Number.parseFloat(String(value)) || 0;
          isInitialized.current = true;
        }

        if (isPresetMode) {
          const delta = newValue - dragAccumulator.current;
          const steps = Math.floor(Math.abs(delta) / presetDragStepSize);

          if (steps > 0) {
            const direction = delta > 0 ? 'up' : 'down';
            const targetIndex =
              direction === 'up'
                ? Math.min(currentPresetIndex + steps, presetList.length - 1)
                : Math.max(currentPresetIndex - steps, 0);

            if (targetIndex !== currentPresetIndex) {
              const newPreset = getPresetByIndex(targetIndex, presetList);
              if (newPreset !== lastEmittedValue.current) {
                lastEmittedValue.current = newPreset;
                onDragChange(0, { steps: direction === 'up' ? steps : -steps });
              }
              setCurrentPresetIndex(targetIndex);
            } else {
              emitDragReject(direction === 'up' ? 'preset-end' : 'preset-start');
            }

            dragAccumulator.current += steps * presetDragStepSize * (direction === 'up' ? 1 : -1);
          }
          return;
        }

        pendingDragValue.current = newValue;
        lastEmittedValue.current = newValue;

        if (dragRafId.current !== null) cancelAnimationFrame(dragRafId.current);

        dragRafId.current = requestAnimationFrame(() => {
          if (pendingDragValue.current !== null) {
            onDragChange(pendingDragValue.current);
            pendingDragValue.current = null;
          }
          dragRafId.current = null;
        });
      },
      [currentPresetIndex, emitDragReject, isPresetMode, onDragChange, onDragStateChange, presetDragStepSize, presetList, value]
    );

    const handleMouseDown = useCallback(
      (event: React.MouseEvent) => {
        if (event.button !== 0 || disabled) return;
        isMouseDownRef.current = true;
        hasDragMovementRef.current = false;
      },
      [disabled]
    );

    const handlePrefixClick = useCallback(
      (event: React.MouseEvent) => {
        onInputFocus(event);
        if (!hasDragMovementRef.current) {
          isMouseDownRef.current = false;
          isDraggingRef.current = false;
          onDragStateChange?.(false);
          if (!disablePointerLock && document.pointerLockElement) {
            document.exitPointerLock();
          }
        }
      },
      [disablePointerLock, onDragStateChange, onInputFocus]
    );

    useEffect(() => {
      const handleGlobalMouseUp = (event: MouseEvent) => {
        if (event.button !== 0) return;
        if (isMouseDownRef.current && !isDraggingRef.current) {
          isMouseDownRef.current = false;
          if (!isMouseOverRef.current) onDragStateChange?.(false);
        }
      };

      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, [onDragStateChange]);

    useEffect(
      () => () => {
        if (dragRafId.current !== null) cancelAnimationFrame(dragRafId.current);
      },
      []
    );

    if (!prefixLabelText && !prefixNode && !hidePrefixIcon) return null;
    if (hidePrefixIcon && disabled) return null;

    const numericValue = typeof value === 'number' ? value : Number.parseFloat(String(value)) || 0;
    const draggableValue = isPresetMode ? currentPresetIndex : numericValue;
    const content = hidePrefixIcon ? (
      <div className={cx('servly-number-input__hidden-drag-area', classNames?.hiddenDragArea)} style={styles?.hiddenDragArea} />
    ) : (
      <Tooltip
        title={prefixNodeTooltipTitle}
        trigger={prefixNodeTooltipTrigger}
        placement={prefixNodeTooltipPlacement}
        mouseEnterDelay={prefixNodeTooltipMouseEnterDelay}
        mouseLeaveDelay={prefixNodeTooltipMouseLeaveDelay}
        color={tooltipColor}
      >
        <span>{prefixNode || prefixLabelText}</span>
      </Tooltip>
    );

    return (
      <div
        className={cx('servly-number-input__prefix-shell', hidePrefixIcon && 'servly-number-input__prefix-shell--hidden', classNames?.prefixShell)}
        style={styles?.prefixShell}
        onMouseDownCapture={handleMouseDown}
        onMouseEnter={() => {
          isMouseOverRef.current = true;
        }}
        onMouseLeave={() => {
          isMouseOverRef.current = false;
        }}
      >
        <DraggableNumberInput
          noInput
          suppressContentEditableWarning
          className={cx(
            'servly-number-input__prefix',
            isFilterActive && 'servly-number-input__prefix--filter-active',
            isPresetMode && 'servly-number-input__prefix--preset',
            hidePrefixIcon && 'servly-number-input__prefix--hidden',
            classNames?.prefix
          )}
          inputStyle={{ display: 'none', ...styles?.prefix }}
          value={draggableValue}
          min={isPresetMode ? -1000 : min}
          max={isPresetMode ? 1000 : max}
          modifierKeys={{
            default: { multiplier: isPresetMode ? 1 : step, sensitivity: isPresetMode ? 1 : 0.1 },
            ctrlKey: { multiplier: isPresetMode ? 0.1 : 0.1, sensitivity: isPresetMode ? 5 : 0.5 },
            altKey: { multiplier: isPresetMode ? 0.05 : 0.01, sensitivity: isPresetMode ? 10 : 0.2 },
            shiftKey: { multiplier: isPresetMode ? 1 : 10, sensitivity: isPresetMode ? 1 : 0.25 },
            metaKey: { multiplier: isPresetMode ? 2 : 100, sensitivity: isPresetMode ? 0.5 : 0.125 },
          }}
          disabled={disabled}
          disablePointerLock={disablePointerLock}
          onChange={handleDragChange}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onClick={handlePrefixClick}
        >
          {content}
        </DraggableNumberInput>
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.value === nextProps.value &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.isPresetMode === nextProps.isPresetMode &&
    prevProps.isFilterActive === nextProps.isFilterActive &&
    prevProps.hidePrefixIcon === nextProps.hidePrefixIcon &&
    prevProps.presetMap === nextProps.presetMap &&
    prevProps.min === nextProps.min &&
    prevProps.max === nextProps.max &&
    prevProps.step === nextProps.step
);

PrefixSection.displayName = 'ServlyNumberInputPrefixSection';
