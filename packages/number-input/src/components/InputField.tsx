import React, { forwardRef } from 'react';
import type {
  ServlyNumberInputAdapters,
  ServlyNumberInputClassNames,
  ServlyNumberInputDisplayValueContext,
  ServlyNumberInputStyles,
  ServlyNumberInputValue,
} from '../types';
import { cx } from '../utils/cx';

interface InputFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'value' | 'onChange' | 'onBlur' | 'onFocus' | 'size'> {
  adapters: ServlyNumberInputAdapters;
  value: ServlyNumberInputValue | '';
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
  inputClassName?: string;
  inputWidth?: string;
  'data-testid'?: string;
  inputTooltipTitle?: React.ReactNode;
  inputTooltipTrigger?: string | string[];
  inputTooltipPlacement?: string;
  inputTooltipMouseEnterDelay?: number;
  inputTooltipMouseLeaveDelay?: number;
  tooltipColor?: string;
  isDesignSystemValue?: boolean;
  designSystemLabel?: string;
  designSystemTooltipTitle?: React.ReactNode;
  designSystemInputClassName?: string;
  hasPrefix?: boolean;
  hasSuffix?: boolean;
  isFilterActive?: boolean;
  classNames?: ServlyNumberInputClassNames;
  styles?: ServlyNumberInputStyles;
  displayValueContext: ServlyNumberInputDisplayValueContext;
  renderDisplayValue?: (context: ServlyNumberInputDisplayValueContext) => React.ReactNode;
  onTokenValueClick?: (event: React.MouseEvent<HTMLElement>) => void;
  renderTokenValueWrapper?: (tokenValue: React.ReactElement) => React.ReactElement;
  isTokenPickerOpen?: boolean;
  suppressTooltip?: boolean;
  onDisplayOverlayChange?: (visible: boolean) => void;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      adapters,
      value,
      onChange,
      onFocus,
      onBlur,
      onKeyDown,
      onKeyUp,
      disabled = false,
      readOnly = false,
      placeholder = '',
      name,
      id,
      'data-testid': testId,
      type = 'text',
      step,
      min,
      max,
      inputClassName,
      inputWidth,
      inputTooltipTitle,
      inputTooltipTrigger,
      inputTooltipPlacement,
      inputTooltipMouseEnterDelay,
      inputTooltipMouseLeaveDelay,
      tooltipColor = '#181818',
      isDesignSystemValue = false,
      designSystemLabel = 'Design system',
      designSystemTooltipTitle,
      designSystemInputClassName,
      hasPrefix = false,
      hasSuffix = false,
      isFilterActive = false,
      classNames,
      styles,
      displayValueContext,
      renderDisplayValue,
      onTokenValueClick,
      renderTokenValueWrapper,
      isTokenPickerOpen = false,
      suppressTooltip = false,
      onDisplayOverlayChange,
      ...rest
    },
    ref
  ) => {
    const { Tooltip } = adapters;
    const idleTokenWidthRef = React.useRef<number>();
    const shouldRenderDisplayValue = !isDesignSystemValue || displayValueContext.isDragging;
    const renderedDisplayValue = shouldRenderDisplayValue ? renderDisplayValue?.(displayValueContext) : null;
    const hasDisplayValueOverlay =
      renderedDisplayValue !== undefined && renderedDisplayValue !== null && renderedDisplayValue !== false;
    React.useEffect(() => {
      onDisplayOverlayChange?.(hasDisplayValueOverlay);
    }, [hasDisplayValueOverlay, onDisplayOverlayChange]);
    const tokenValueLength = Math.max(2, String(value ?? '').length + 0.75);
    const isTokenPickerValue = Boolean(isDesignSystemValue && onTokenValueClick);
    const tokenValueStyle = {
      '--servly-number-input-token-value-width': `${tokenValueLength}ch`,
    } as React.CSSProperties;
    const tokenValueRef = React.useCallback((node: HTMLButtonElement | null) => {
      if (!node) return;
      const measuredWidth = node.getBoundingClientRect().width || node.offsetWidth;
      if (measuredWidth > 0) idleTokenWidthRef.current = measuredWidth;
    }, []);
    const inputWrapStyle = {
      ...(displayValueContext.isDragging && idleTokenWidthRef.current
        ? { '--servly-number-input-token-drag-width': `${idleTokenWidthRef.current}px` }
        : undefined),
      ...styles?.inputWrap,
    } as React.CSSProperties;
    const inputStyle = isDesignSystemValue
      ? ({
          ...tokenValueStyle,
          ...styles?.input,
        } as React.CSSProperties)
      : styles?.input;
    const shouldRenderNativeInput = !isTokenPickerValue || hasDisplayValueOverlay;
    const tooltipTitle = suppressTooltip
      ? undefined
      : inputTooltipTitle || (isDesignSystemValue ? designSystemTooltipTitle ?? `${designSystemLabel} token` : undefined);
    const tokenValueButton =
      isTokenPickerValue && !hasDisplayValueOverlay ? (
        <button
          ref={tokenValueRef}
          type="button"
          className={cx(
            'servly-number-input__token-value',
            isTokenPickerOpen && 'is-open',
            designSystemInputClassName,
            classNames?.input
          )}
          style={tokenValueStyle}
          disabled={disabled}
          data-testid={testId}
          aria-label={`Open design token picker for ${String(value)}`}
          aria-expanded={isTokenPickerOpen}
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.preventDefault();
            onTokenValueClick?.(event);
          }}
        >
          {value}
        </button>
      ) : null;

    return (
      <Tooltip
        title={tooltipTitle}
        trigger={inputTooltipTrigger}
        placement={inputTooltipPlacement}
        mouseEnterDelay={isDesignSystemValue && inputTooltipMouseEnterDelay === undefined ? 2 : inputTooltipMouseEnterDelay}
        mouseLeaveDelay={inputTooltipMouseLeaveDelay}
        color={tooltipColor}
      >
        <div
          className={cx(
            'servly-number-input__input-wrap',
            isFilterActive && 'servly-number-input__input-wrap--filter-active',
            isDesignSystemValue && 'servly-number-input__input-wrap--design-system',
            hasPrefix && 'servly-number-input__input-wrap--has-prefix',
            hasSuffix && 'servly-number-input__input-wrap--has-suffix',
            inputWidth,
            inputClassName?.includes('w-full') && 'servly-number-input__input-wrap--full',
            hasDisplayValueOverlay && 'servly-number-input__input-wrap--has-display-value',
            classNames?.inputWrap
          )}
          style={inputWrapStyle}
        >
          {shouldRenderNativeInput ? (
            <input
              ref={ref}
              type={type}
              className={cx(
                'servly-number-input__input',
                isDesignSystemValue && 'servly-number-input__input--design-system',
                isDesignSystemValue && designSystemInputClassName,
                hasDisplayValueOverlay && 'servly-number-input__input--display-overlaid',
                inputClassName,
                classNames?.input
              )}
              style={inputStyle}
              value={value}
              step={step}
              min={min}
              max={max}
              disabled={disabled}
              readOnly={readOnly}
              placeholder={placeholder}
              name={name}
              id={id}
              data-testid={testId}
              onChange={onChange}
              onFocus={onFocus}
              onClick={(event) => {
                onFocus(event as unknown as React.FocusEvent<HTMLInputElement>);
              }}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
              onKeyUp={onKeyUp}
              {...rest}
            />
          ) : null}
          {tokenValueButton ? (renderTokenValueWrapper ? renderTokenValueWrapper(tokenValueButton) : tokenValueButton) : null}
          {hasDisplayValueOverlay ? (
            <span
              className={cx('servly-number-input__display-value', classNames?.displayValue)}
              style={styles?.displayValue}
              aria-hidden="true"
            >
              {renderedDisplayValue}
            </span>
          ) : null}
        </div>
      </Tooltip>
    );
  }
);

InputField.displayName = 'ServlyNumberInputField';
