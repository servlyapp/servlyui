import React from 'react';
import type {
  ServlyNumberInputAdapters,
  ServlyNumberInputClassNames,
  ServlyNumberInputDesignSystem,
  ServlyDropdownItem,
  ServlyNumberInputStyles,
  ServlyNumberInputSuffixOption,
} from '../types';
import { isDesignSystemSuffix, resolveDesignSystem } from '../utils/designSystem';
import { cx } from '../utils/cx';

interface SuffixDropdownProps {
  adapters: ServlyNumberInputAdapters;
  suffixNode?: React.ReactNode;
  suffixOptionList: ServlyNumberInputSuffixOption[];
  currentSuffix: string;
  isDesignSystemValue: boolean;
  designSystemSelection?: string;
  designSystemTooltipTitle?: React.ReactNode;
  designSystem: ServlyNumberInputDesignSystem;
  dropdownVisible: boolean;
  setDropdownVisible: (visible: boolean) => void;
  onSuffixChange: (suffix: string) => void;
  suffixClassName?: string;
  suffixTooltipTitle?: React.ReactNode;
  suffixTooltipTrigger?: string | string[];
  suffixTooltipPlacement?: string;
  suffixTooltipMouseEnterDelay?: number;
  suffixTooltipMouseLeaveDelay?: number;
  tooltipColor?: string;
  isFilterActive?: boolean;
  isHovered?: boolean;
  isSectionHovered?: boolean;
  isDragging?: boolean;
  classNames?: ServlyNumberInputClassNames;
  styles?: ServlyNumberInputStyles;
  overlayClassName?: string;
  overlayStyle?: React.CSSProperties;
  leadingAction?: {
    key: string;
    label: React.ReactNode;
    icon?: React.ReactNode;
    onClick: () => void;
  };
  renderDropdownWrapper?: (dropdown: React.ReactElement) => React.ReactElement;
}

export const SuffixDropdown = ({
  adapters,
  suffixNode,
  suffixOptionList,
  currentSuffix,
  isDesignSystemValue,
  designSystem: designSystemConfig,
  designSystemSelection,
  designSystemTooltipTitle,
  dropdownVisible,
  setDropdownVisible,
  onSuffixChange,
  suffixClassName,
  suffixTooltipTitle,
  suffixTooltipTrigger,
  suffixTooltipPlacement,
  suffixTooltipMouseEnterDelay,
  suffixTooltipMouseLeaveDelay,
  tooltipColor = '#181818',
  isFilterActive = false,
  isHovered = false,
  isSectionHovered = false,
  isDragging = false,
  classNames,
  styles,
  overlayClassName,
  overlayStyle,
  leadingAction,
  renderDropdownWrapper,
}: SuffixDropdownProps) => {
  const { Tooltip, Dropdown, CaretDownIcon, CheckIcon } = adapters;
  const designSystem = resolveDesignSystem(designSystemConfig);
  const hasSuffixContent = Boolean(suffixNode || suffixOptionList.length > 0);
  const shouldRender = hasSuffixContent && (isSectionHovered || dropdownVisible || isDragging);

  if (!shouldRender) return null;

  const getSuffixDisplay = () => {
    const currentSuffixOption = suffixOptionList.find((opt) => opt.value === currentSuffix);
    if (isDesignSystemSuffix(currentSuffix, designSystem)) return currentSuffixOption?.marker ?? designSystem.marker;
    if (currentSuffixOption?.type === 'metric') return currentSuffix;
    return currentSuffix || 'px';
  };

  const isOptionSelected = (optionValue: string) => {
    if (isDesignSystemSuffix(currentSuffix, designSystem)) {
      if (isDesignSystemSuffix(optionValue, designSystem)) return !designSystemSelection;
      return optionValue === designSystemSelection;
    }
    return optionValue === currentSuffix;
  };

  const suffixMenuItems: ServlyDropdownItem[] = [
    ...(leadingAction
      ? [
          {
            key: leadingAction.key,
            label: (
              <div className="servly-number-input__suffix-option servly-number-input__suffix-option--token-action">
                {leadingAction.icon ? (
                  <span className="servly-number-input__suffix-option-action-icon">{leadingAction.icon}</span>
                ) : null}
                <span className="servly-number-input__suffix-option-label">{leadingAction.label}</span>
              </div>
            ),
            onClick: leadingAction.onClick,
          },
          { key: 'servly-apply-variable-divider', type: 'divider' as const },
        ]
      : []),
    ...suffixOptionList.map((option) => ({
      key: option.value,
      label: (
        <div className={cx('servly-number-input__suffix-option', option.className, classNames?.suffixOption)} style={styles?.suffixOption}>
          <CheckIcon className={cx('servly-number-input__suffix-option-check', isOptionSelected(option.value) && 'is-selected')} />
          <span
            className={cx(
              'servly-number-input__suffix-option-label',
              option.type === 'keyword' && 'is-design-system-keyword',
              classNames?.suffixOptionLabel
            )}
          >
            {option.label || option.value}
          </span>
          {option.type === 'keyword' ? (
            <span className="servly-number-input__suffix-option-meta">{option.metaLabel || designSystem.metaLabel}</span>
          ) : null}
          {option.value === '#' ? <span className="servly-number-input__suffix-option-meta">Number</span> : null}
        </div>
      ),
      onClick: () => onSuffixChange(option.value),
    })),
  ];

  const trigger = (
    <button
      type="button"
      className={cx(
        'servly-number-input__suffix',
        isFilterActive && 'servly-number-input__suffix--filter-active',
        isDesignSystemValue && 'servly-number-input__suffix--design-system',
        isDesignSystemValue && designSystem.suffixClassName,
        isHovered && 'servly-number-input__suffix--hovered',
        isDragging && 'servly-number-input__suffix--dragging',
        suffixClassName,
        classNames?.suffix
      )}
      style={styles?.suffix}
      aria-disabled={isDragging}
      onClick={(event) => {
        event.preventDefault();
        if (isDragging) return;
        setDropdownVisible(!dropdownVisible);
      }}
      aria-label="Change number input suffix"
    >
      <span className={cx('servly-number-input__suffix-label', classNames?.suffixLabel)} style={styles?.suffixLabel}>
        {getSuffixDisplay()}
      </span>
      <CaretDownIcon className={cx('servly-number-input__suffix-caret', dropdownVisible && !isDragging && 'is-open', classNames?.suffixCaret)} size={12} />
    </button>
  );

  const dropdown = (
    <Dropdown
      items={suffixMenuItems}
      placement="left"
      trigger={['click']}
      open={dropdownVisible && !isDragging}
      overlayClassName={cx('servly-number-input__dropdown-popup', 'servly-number-input__suffix-dropdown-popup', overlayClassName)}
      overlayStyle={overlayStyle}
      onOpenChange={(open) => {
        if (!isDragging) setDropdownVisible(open);
      }}
    >
      {trigger}
    </Dropdown>
  );

  return (
    <Tooltip
      title={suffixTooltipTitle || (isDesignSystemValue ? designSystemTooltipTitle ?? `${designSystem.label} token` : undefined)}
      trigger={suffixTooltipTrigger}
      placement={suffixTooltipPlacement}
      mouseEnterDelay={suffixTooltipMouseEnterDelay}
      mouseLeaveDelay={suffixTooltipMouseLeaveDelay}
      color={tooltipColor}
    >
      {suffixOptionList.length > 0 ? (
        renderDropdownWrapper ? renderDropdownWrapper(dropdown) : dropdown
      ) : (
        <div
          className={cx(
            'servly-number-input__suffix servly-number-input__suffix--node',
            isDragging && 'servly-number-input__suffix--dragging',
            suffixClassName,
            classNames?.suffix
          )}
          style={styles?.suffix}
        >
          {suffixNode}
        </div>
      )}
    </Tooltip>
  );
};
