import React from 'react';
import type {
  ServlyNumberInputAdapters,
  ServlyNumberInputClassNames,
  ServlyNumberInputDesignSystem,
  ServlyNumberInputStyles,
  ServlyNumberInputSuffixOption,
} from '../types';
import { cx } from '../utils/cx';
import { getKeywordsForSuffix, getPresetMapForSuffix, isDesignSystemSuffix, resolveDesignSystem } from '../utils/designSystem';
import { getOrderedPresetList } from '../utils/numberInputUtils';

interface SuggestionsPopoverProps {
  adapters: ServlyNumberInputAdapters;
  visible: boolean;
  onClose: () => void;
  currentSuffix: string;
  inputValue: string | number;
  onSuggestionClick: (value: string) => void;
  children: React.ReactElement;
  suffixOptionList: ServlyNumberInputSuffixOption[];
  designSystem: ServlyNumberInputDesignSystem;
  isPresetMode?: boolean;
  classNames?: ServlyNumberInputClassNames;
  styles?: ServlyNumberInputStyles;
  overlayClassName?: string;
  overlayStyle?: React.CSSProperties;
}

export const SuggestionsPopover = ({
  adapters,
  visible,
  onClose,
  currentSuffix,
  inputValue,
  onSuggestionClick,
  children,
  suffixOptionList,
  designSystem: designSystemConfig,
  isPresetMode = false,
  classNames,
  styles,
  overlayClassName,
  overlayStyle,
}: SuggestionsPopoverProps) => {
  const { Popover, CloseIcon } = adapters;
  const designSystem = resolveDesignSystem(designSystemConfig);

  const getSuggestions = () => {
    if (isDesignSystemSuffix(currentSuffix, designSystem) || isPresetMode) {
      const presetMap = getPresetMapForSuffix(currentSuffix, suffixOptionList, designSystem);
      const keywords = getKeywordsForSuffix(currentSuffix, suffixOptionList, designSystem);
      const presetSuggestions = getOrderedPresetList(presetMap).map(({ preset, pixels }) => ({
        value: preset,
        label: `${preset} (${pixels}px)`,
        type: 'preset',
      }));
      const keywordSuggestions = keywords.map((keyword) => ({
        value: keyword,
        label: keyword,
        type: 'keyword',
      }));
      return [...presetSuggestions, ...keywordSuggestions];
    }

    const metricSuggestions =
      currentSuffix === '%'
        ? ['0', '25', '50', '75', '100']
        : currentSuffix === 'rem' || currentSuffix === 'em'
          ? ['0.5', '1', '1.5', '2', '2.5', '3']
          : ['0', '4', '8', '12', '16', '20', '24', '32', '40', '48'];

    return metricSuggestions.map((value) => ({
      value,
      label: `${value}${currentSuffix}`,
      type: 'metric',
    }));
  };

  const content = (
    <div
      className={cx('servly-number-input__suggestions', classNames?.suggestions)}
      style={styles?.suggestions}
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      <div className="servly-number-input__suggestions-header">
        <span>{isPresetMode || isDesignSystemSuffix(currentSuffix, designSystem) ? `${designSystem.label} Presets` : 'Suggested Values'}</span>
        <button
          type="button"
          className="servly-number-input__suggestions-close"
          aria-label="Close suggestions"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
        >
          <CloseIcon size={14} />
        </button>
      </div>
      <div className="servly-number-input__suggestions-body">
        <div className={cx('servly-number-input__suggestions-grid', (isPresetMode || isDesignSystemSuffix(currentSuffix, designSystem)) && 'is-single-column')}>
          {getSuggestions().map((suggestion) => (
            <button
              key={suggestion.value}
              type="button"
              className={cx(
                'servly-number-input__suggestion',
                suggestion.type === 'preset' && 'servly-number-input__suggestion--preset',
                suggestion.type === 'keyword' && 'servly-number-input__suggestion--keyword',
                suggestion.type !== 'metric' && designSystem.suggestionClassName,
                suggestion.value === inputValue && 'is-selected',
                classNames?.suggestion
              )}
              style={styles?.suggestion}
              onMouseDown={(event) => event.preventDefault()}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onSuggestionClick(suggestion.value);
                onClose();
              }}
            >
              <span>{suggestion.label}</span>
            </button>
          ))}
        </div>
        {inputValue && !isPresetMode ? (
          <div className="servly-number-input__suggestions-invalid">
            <p>Invalid value: "{inputValue}"</p>
            <p>{isDesignSystemSuffix(currentSuffix, designSystem) ? `Use a ${designSystem.label} preset or keyword` : 'Enter a valid number'}</p>
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <Popover
      destroyTooltipOnHide
      content={content}
      open={visible}
      placement="left"
      overlayClassName={cx('servly-number-input__suggestions-popover', overlayClassName)}
      overlayInnerStyle={{
        ...overlayStyle,
        padding: 0,
        backgroundColor: 'var(--servly-number-input-overlay-bg)',
        border: '1px solid var(--servly-number-input-overlay-border)',
        borderRadius: 8,
        boxShadow: 'var(--servly-number-input-overlay-shadow)',
      }}
      autoAdjustOverflow={false}
      onOpenChange={(newOpen) => {
        if (!newOpen) onClose();
      }}
    >
      {children}
    </Popover>
  );
};
