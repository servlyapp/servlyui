import type React from 'react';

export type ServlyNumberInputValue = string | number;

export type ServlyNumberInputSuffixType = 'metric' | 'option' | 'keyword' | 'preset' | 'design-system' | 'number' | string;

export type ServlyNumberInputThemeMode = 'dark' | 'light';

export type ServlyNumberInputSize = 'xs' | 'sm' | 'md' | 'lg';

/** Placement used for the manual design-token action. */
export type ServlyNumberInputTokenActionPlacement = 'inline' | 'suffix-menu' | 'hidden';

/** Current layout measurements and interaction state passed to a layout policy. */
export interface ServlyNumberInputLayoutContext {
  containerWidth?: number;
  size: ServlyNumberInputSize;
  isHovered: boolean;
  isFocused: boolean;
  isDragging: boolean;
  isTokenLinked: boolean;
  hasPrefix: boolean;
  hasSuffixMenu: boolean;
  estimatedAvailableValueWidth?: number;
  minimumValueWidth: number;
}

/** Consumer overrides returned by a responsive layout policy. */
export interface ServlyNumberInputLayoutDecision {
  tokenActionPlacement?: ServlyNumberInputTokenActionPlacement;
}

/** Resolves responsive affordance placement for the current input layout. */
export type ServlyNumberInputLayoutPolicy = (
  context: ServlyNumberInputLayoutContext
) => ServlyNumberInputLayoutDecision | void;

/**
 * Theme tokens used by the packaged styles and portal overlays. Consumers can
 * override only the tokens they need; missing values are filled from the mode.
 */
export interface ServlyNumberInputThemeTokens {
  background?: string;
  backgroundHover?: string;
  filterBackground?: string;
  text?: string;
  mutedText?: string;
  fieldBorder?: string;
  valuePillBackground?: string;
  valuePillBorder?: string;
  selectedTextBackground?: string;
  activeBorder?: string;
  invalidBorder?: string;
  accent?: string;
  tokenValueText?: string;
  tokenIcon?: string;
  tokenIconHover?: string;
  overlayBackground?: string;
  overlayBorder?: string;
  overlayShadow?: string;
  optionBackground?: string;
  optionHoverBackground?: string;
  pickerRowHoverBackground?: string;
  pickerSectionText?: string;
  pickerMutedValueText?: string;
  selectedRing?: string;
  dangerText?: string;
}

/**
 * Theme configuration for a single input or provider. String themes use the
 * packaged token set; object themes merge custom tokens over their mode.
 */
export interface ServlyNumberInputTheme {
  mode?: ServlyNumberInputThemeMode;
  tokens?: ServlyNumberInputThemeTokens;
  className?: string;
}

/**
 * Numeric acceptance mode for raw number suffixes. `any` and `decimal`
 * allow decimal and integer values; `integer` rejects decimals while typing.
 */
export type ServlyNumberInputNumberMode = 'any' | 'integer' | 'decimal';

/**
 * Named DOM slots that can receive consumer class names and inline styles.
 */
export type ServlyNumberInputSlot =
  | 'root'
  | 'inner'
  | 'control'
  | 'prefixShell'
  | 'prefix'
  | 'hiddenDragArea'
  | 'inputWrap'
  | 'input'
  | 'displayValue'
  | 'suffix'
  | 'suffixLabel'
  | 'suffixCaret'
  | 'suffixOption'
  | 'suffixOptionLabel'
  | 'tokenTrigger'
  | 'tokenIcon'
  | 'tokenPicker'
  | 'tokenPickerRow'
  | 'tokenPickerSection'
  | 'suggestions'
  | 'suggestion';

/**
 * Slot-level class names merged onto the packaged Servly classes.
 */
export type ServlyNumberInputClassNames = Partial<Record<ServlyNumberInputSlot, string>>;

/**
 * Slot-level inline styles merged onto the component structure.
 */
export type ServlyNumberInputStyles = Partial<Record<ServlyNumberInputSlot, React.CSSProperties>>;

export interface ServlyNumberInputTokenOption {
  value: string;
  label?: string;
  numericValue?: number;
  description?: string;
  icon?: React.ReactNode;
  symbol?: ServlyNumberInputTokenSymbolName;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  itemType?: string;
  metaLabel?: string;
  className?: string;
}

export interface ServlyNumberInputTokenGroup {
  id: string;
  label: string;
  tokens: ServlyNumberInputTokenOption[];
  className?: string;
}

export interface ServlyNumberInputTokenLibrary {
  id: string;
  label: string;
  icon?: React.ReactNode;
  symbol?: ServlyNumberInputTokenSymbolName;
  groups: ServlyNumberInputTokenGroup[];
  className?: string;
}

export interface ServlyNumberInputTokenCollection {
  id: string;
  label: string;
}

/** Token identity retained when a newly created variable references another token. */
export interface ServlyNumberInputTokenReference {
  libraryId: string;
  groupId: string;
  token: ServlyNumberInputTokenOption;
}

export interface ServlyNumberInputCreateVariableDraft {
  collectionId: string;
  name: string;
  value: ServlyNumberInputValue | '';
  reference?: ServlyNumberInputTokenReference;
}

export interface ServlyNumberInputCreateVariableEvent {
  draft: ServlyNumberInputCreateVariableDraft;
  close: () => void;
  selectToken: (token: ServlyNumberInputTokenOption) => void;
}

export interface ServlyNumberInputCreateVariableRenderProps {
  draft: ServlyNumberInputCreateVariableDraft;
  collections: ServlyNumberInputTokenCollection[];
  title: string;
  submitLabel: string;
  setDraft: (draft: ServlyNumberInputCreateVariableDraft) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onClose: () => void;
}

export interface ServlyNumberInputTokenPickerRenderProps {
  libraries: ServlyNumberInputTokenLibrary[];
  selectedValue?: string;
  searchValue: string;
  selectedLibraryId: string;
  onSearchChange: (value: string) => void;
  onLibraryChange: (libraryId: string) => void;
  onSelectToken: (token: ServlyNumberInputTokenOption) => void;
  onClose: () => void;
  onAddTokenLibrary?: () => void;
}

export type ServlyNumberInputTokenPickerLibraryControl = 'dropdown' | 'select' | 'none';

export type ServlyNumberInputTokenPickerCloseBehavior = 'explicit' | 'selection' | 'automatic';

export type ServlyNumberInputTokenSymbolName = 'number' | 'spacing' | 'size' | 'radius' | 'opacity';

export interface ServlyNumberInputTokenPickerSearchItem {
  key: string;
  label: React.ReactNode;
  value?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
  itemType?: string;
  className?: string;
  onSelect?: () => void;
}

export interface ServlyNumberInputTokenPickerOptions {
  /**
   * Library selector primitive. `dropdown` reuses the configured adapter and is
   * the compact default; `select` keeps native select behavior; `none` hides it.
   */
  libraryControl?: ServlyNumberInputTokenPickerLibraryControl;
  /**
   * Close the whole token picker after a library is selected.
   */
  closeOnLibraryChange?: boolean;
  /** Controls ordinary picker dismissal. Defaults to `selection`. */
  closeBehavior?: ServlyNumberInputTokenPickerCloseBehavior;
  /**
   * Compact queue shown under search. When omitted, the picker derives up to
   * two matching tokens from the active libraries while the user is searching.
   */
  searchItems?:
    | ServlyNumberInputTokenPickerSearchItem[]
    | ((props: ServlyNumberInputTokenPickerRenderProps) => ServlyNumberInputTokenPickerSearchItem[]);
  maxSearchItems?: number;
  showSearchItems?: boolean | 'auto';
  renderSearchItem?: (
    item: ServlyNumberInputTokenPickerSearchItem,
    props: ServlyNumberInputTokenPickerRenderProps
  ) => React.ReactNode;
  itemDensity?: 'compact' | 'comfortable';
  /** Enables independent disclosure controls for token libraries. Defaults to `true`. */
  collapsibleLibraries?: boolean;
  /** Library ids expanded when the picker opens. Defaults to every library. */
  defaultExpandedLibraryIds?: string[];
  /** Notifies consumers when a library disclosure is opened or closed. */
  onLibraryOpenChange?: (libraryId: string, open: boolean) => void;
  tokenValueClickBehavior?: 'open-picker' | 'edit';
  showManualValue?: boolean;
  createVariable?:
    | boolean
    | {
        title?: string;
        submitLabel?: string;
        collections?: ServlyNumberInputTokenCollection[];
        defaultCollectionId?: string;
        defaultName?: string;
        defaultValue?: ServlyNumberInputValue | '';
        className?: string;
        onOpenChange?: (open: boolean) => void;
        onSubmit?: (event: ServlyNumberInputCreateVariableEvent) => void | ServlyNumberInputTokenOption | Promise<void | ServlyNumberInputTokenOption>;
        onCancel?: (draft: ServlyNumberInputCreateVariableDraft) => void;
        renderForm?: (props: ServlyNumberInputCreateVariableRenderProps) => React.ReactNode;
      };
}

/**
 * Design-system preset configuration. Tailwind is the default, but consumers
 * can inject their own scale, keywords, labels, marker, and class hooks.
 */
export interface ServlyNumberInputDesignSystem {
  id: string;
  label: string;
  presetMap: Record<string, number>;
  keywords?: string[];
  libraries?: ServlyNumberInputTokenLibrary[];
  defaultPreset?: string;
  marker?: React.ReactNode;
  metaLabel?: string;
  className?: string;
  inputClassName?: string;
  suffixClassName?: string;
  suggestionClassName?: string;
}

/**
 * A selectable unit, preset group, or keyword shown in the suffix dropdown.
 */
export interface ServlyNumberInputSuffixOption {
  value: string;
  type: ServlyNumberInputSuffixType;
  label?: string;
  description?: string;
  presets?: Record<string, number>;
  keywords?: string[];
  defaultPreset?: string;
  marker?: React.ReactNode;
  metaLabel?: string;
  className?: string;
}

/**
 * Change payload emitted by ServlyNumberInput.
 */
export interface ServlyNumberInputChangeEvent {
  target: {
    value: ServlyNumberInputValue | '';
    name?: string;
  };
  value: ServlyNumberInputValue | '';
  numericValue: number;
  unit: string;
  designSystem?: string;
  isDesignSystem: boolean;
  /**
   * @deprecated Use isDesignSystem instead. Kept for Tailwind-era consumers.
   */
  isTailwind: boolean;
  isDragOperation: boolean;
}

/**
 * Context passed to custom display renderers. Renderers can use this to layer
 * animation libraries over the native input without replacing the input itself.
 */
export interface ServlyNumberInputDisplayValueContext {
  value: ServlyNumberInputValue | '';
  displayValue: ServlyNumberInputValue | '';
  numericValue: number;
  unit: string;
  suffix: string;
  isDragging: boolean;
  isActive: boolean;
  isValid: boolean;
  isPresetMode: boolean;
  isDesignSystem: boolean;
}

/**
 * Drag lifecycle payload emitted while the prefix drag primitive changes value.
 */
export interface ServlyNumberInputValueDragEvent extends ServlyNumberInputDisplayValueContext {
  phase: 'start' | 'move' | 'end';
  rawValue?: number;
  steps?: number;
}

/**
 * Reason emitted when the component refuses a typed or dragged value.
 */
export type ServlyNumberInputRejectReason =
  | 'min'
  | 'max'
  | 'preset-start'
  | 'preset-end'
  | 'invalid-preset'
  | 'invalid-number'
  | 'invalid-custom';

/**
 * Payload emitted before the visual reject animation is shown.
 */
export interface ServlyNumberInputRejectEvent extends ServlyNumberInputDisplayValueContext {
  reason: ServlyNumberInputRejectReason;
}

/**
 * Imperative handle exposed by ServlyNumberInput refs.
 */
export interface ServlyNumberInputRef {
  focus: () => void;
  blur: () => void;
  select: () => void;
  setSelectionRange: (start: number, end: number) => void;
  getValue: () => ServlyNumberInputValue | '';
  setValue: (newValue: ServlyNumberInputValue | '') => void;
  getNumericValue: () => number;
  getUnit: () => string;
  setUnit: (unit: string) => void;
}

export interface ServlyTooltipProps {
  title?: React.ReactNode;
  trigger?: string | string[];
  placement?: string;
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;
  color?: string;
  children: React.ReactElement;
}

export interface ServlyPopoverProps {
  open: boolean;
  content: React.ReactNode;
  placement?: string;
  arrow?: boolean;
  overlayClassName?: string;
  overlayInnerStyle?: React.CSSProperties;
  autoAdjustOverflow?: boolean;
  destroyTooltipOnHide?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactElement;
}

export type ServlyDropdownItem =
  | { key: string; type?: 'item'; label: React.ReactNode; onClick: () => void }
  | { key: string; type: 'divider' };

export interface ServlyDropdownProps {
  items: ServlyDropdownItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placement?: string;
  trigger?: string[];
  overlayClassName?: string;
  overlayStyle?: React.CSSProperties;
  children: React.ReactElement;
}

export interface ServlyDraggableNumberInputProps {
  noInput?: boolean;
  suppressContentEditableWarning?: boolean;
  className?: string;
  inputStyle?: React.CSSProperties;
  value: number;
  min?: number;
  max?: number;
  modifierKeys?: Record<string, { multiplier: number; sensitivity: number }>;
  disabled?: boolean;
  disablePointerLock?: boolean;
  onChange: (value: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onClick?: (event: React.MouseEvent) => void;
  children: React.ReactNode;
}

/**
 * Replaceable primitive components used by the core package.
 */
export interface ServlyNumberInputAdapters {
  Tooltip: React.ComponentType<ServlyTooltipProps>;
  Popover: React.ComponentType<ServlyPopoverProps>;
  Dropdown: React.ComponentType<ServlyDropdownProps>;
  DraggableNumberInput: React.ComponentType<ServlyDraggableNumberInputProps>;
  CaretDownIcon: React.ComponentType<{ className?: string; size?: number }>;
  CheckIcon: React.ComponentType<{ className?: string; size?: number }>;
  CloseIcon: React.ComponentType<{ className?: string; size?: number }>;
  TokenIcon: React.ComponentType<{ className?: string; size?: number }>;
  UnlinkIcon: React.ComponentType<{ className?: string; size?: number }>;
}

export interface ServlyNumberInputProviderProps {
  adapters?: Partial<ServlyNumberInputAdapters>;
  theme?: ServlyNumberInputThemeMode | ServlyNumberInputTheme;
  size?: ServlyNumberInputSize;
  isSectionHovered?: boolean;
  children: React.ReactNode;
}

export interface ServlyNumberInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'prefix' | 'value' | 'defaultValue' | 'onChange' | 'onBlur' | 'onFocus' | 'size'
  > {
  value?: ServlyNumberInputValue | '';
  defaultValue?: ServlyNumberInputValue | '';
  onChange?: (event: ServlyNumberInputChangeEvent) => void;
  onValueDragStart?: (event: ServlyNumberInputValueDragEvent) => void;
  onValueDrag?: (event: ServlyNumberInputValueDragEvent) => void;
  onValueDragEnd?: (event: ServlyNumberInputValueDragEvent) => void;
  onReject?: (event: ServlyNumberInputRejectEvent) => void;
  /** Called when a linked design token is converted back to a manual numeric value. */
  onTokenUnlink?: () => void;
  /** Enables built-in directional audio haptics on the styled entrypoint. Defaults to `true`. */
  haptics?: boolean;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  prefixLabelText?: string;
  prefixNode?: React.ReactNode;
  prefixIcon?: React.ReactNode;
  min?: number;
  max?: number;
  step?: number;
  /**
   * Disables browser pointer lock during prefix drag. Defaults to `false` so
   * drag behavior keeps the cursor/event capture benefits of pointer lock.
   */
  disablePointerLock?: boolean;
  unitOfMeasurement?: string;
  basePixel?: number;
  suffixOptionList?: ServlyNumberInputSuffixOption[];
  suffixNode?: React.ReactNode;
  formatter?: (value: number, unit: string) => ServlyNumberInputValue;
  /**
   * Visual theme for the input and its portal overlays.
   */
  theme?: ServlyNumberInputThemeMode | ServlyNumberInputTheme;
  /**
   * Proportional control size. `sm` preserves the original 26px Servly control.
   */
  size?: ServlyNumberInputSize;
  /**
   * Controls whether raw number suffixes accept decimals or integers only.
   */
  numberMode?: ServlyNumberInputNumberMode;
  /**
   * Replaces Tailwind as the active preset scale while preserving the same UI behavior.
   */
  designSystem?: ServlyNumberInputDesignSystem;
  showTokenTrigger?: boolean | 'auto';
  /**
   * Overrides responsive affordance placement. The default policy moves the
   * manual token action into the suffix menu when inline controls would crowd
   * the readable value area.
   */
  layoutPolicy?: ServlyNumberInputLayoutPolicy;
  /**
   * Hides the unit suffix selector while the current value is linked to a
   * design-system token. Defaults to `true`; set to `false` when consumers
   * need token values and unit switching visible at the same time.
   */
  hideSuffixWhenTokenLinked?: boolean;
  tokenPicker?: ServlyNumberInputTokenPickerOptions;
  onTokenPickerOpenChange?: (open: boolean) => void;
  onAddTokenLibrary?: () => void;
  renderTokenPicker?: (props: ServlyNumberInputTokenPickerRenderProps) => React.ReactNode;
  componentTooltipTitle?: React.ReactNode;
  componentTooltipMouseEnterDelay?: number;
  componentTooltipMouseLeaveDelay?: number;
  componentTooltipTrigger?: string | string[];
  componentTooltipPlacement?: string;
  prefixNodeTooltipTitle?: React.ReactNode;
  prefixNodeTooltipMouseEnterDelay?: number;
  prefixNodeTooltipMouseLeaveDelay?: number;
  prefixNodeTooltipTrigger?: string | string[];
  prefixNodeTooltipPlacement?: string;
  inputTooltipTitle?: React.ReactNode;
  inputTooltipMouseEnterDelay?: number;
  inputTooltipMouseLeaveDelay?: number;
  inputTooltipTrigger?: string | string[];
  inputTooltipPlacement?: string;
  suffixTooltipTitle?: React.ReactNode;
  suffixTooltipMouseEnterDelay?: number;
  suffixTooltipMouseLeaveDelay?: number;
  suffixTooltipTrigger?: string | string[];
  suffixTooltipPlacement?: string;
  tooltipColor?: string;
  inputClassName?: string;
  inputWidth?: string;
  suffixClassName?: string;
  /**
   * Slot classes merged with the packaged Servly class names.
   */
  classNames?: ServlyNumberInputClassNames;
  /**
   * Slot styles merged with the packaged Servly inline styles.
   */
  styles?: ServlyNumberInputStyles;
  /**
   * Render an optional visual overlay for the displayed value. The native input
   * remains mounted and editable; the overlay is best suited for temporary
   * effects such as slot-text during drag operations.
   */
  renderDisplayValue?: (context: ServlyNumberInputDisplayValueContext) => React.ReactNode;
  'data-testid'?: string;
  allowCustomValue?: boolean;
  /**
   * @deprecated Use allowCustomValue instead. Kept only as a migration bridge from ServlyInput.
   */
  allowText?: boolean;
  isFilterActive?: boolean;
  hidePrefixIcon?: boolean;
  alwaysShowSuffix?: boolean;
  isSectionHovered?: boolean;
  adapters?: Partial<ServlyNumberInputAdapters>;
}

export interface ServlyNumberInputCoreProps extends Omit<ServlyNumberInputProps, 'haptics'> {
  /**
   * @internal Default primitive set used by styled entrypoints before provider and prop overrides.
   */
  defaultAdapters?: Partial<ServlyNumberInputAdapters>;
}

export interface ParsedValue {
  value: string | number;
  unit: string;
  isTailwind?: boolean;
  isDesignSystem?: boolean;
  isKeyword?: boolean;
  isText?: boolean;
  isPlainNumber?: boolean;
  numericValue?: number;
  tailwindPreset?: string;
  designSystemPreset?: string;
}
