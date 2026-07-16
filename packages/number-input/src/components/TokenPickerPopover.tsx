import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
  ServlyNumberInputAdapters,
  ServlyNumberInputChangeEvent,
  ServlyNumberInputClassNames,
  ServlyNumberInputCreateVariableDraft,
  ServlyNumberInputCreateVariableRenderProps,
  ServlyNumberInputDesignSystem,
  ServlyNumberInputStyles,
  ServlyNumberInputTokenLibrary,
  ServlyNumberInputTokenOption,
  ServlyNumberInputTokenPickerOptions,
  ServlyNumberInputTokenPickerRenderProps,
  ServlyNumberInputTokenPickerSearchItem,
  ServlyNumberInputValue,
} from '../types';
import { cx } from '../utils/cx';
import { getOrderedPresetList } from '../utils/numberInputUtils';
import { ServlyNumberInputTokenSymbol } from './TokenSymbol';

interface TokenPickerPopoverProps {
  adapters: ServlyNumberInputAdapters;
  visible: boolean;
  children: React.ReactElement;
  designSystem: Required<ServlyNumberInputDesignSystem>;
  selectedValue?: string;
  classNames?: ServlyNumberInputClassNames;
  styles?: ServlyNumberInputStyles;
  overlayClassName?: string;
  overlayStyle?: React.CSSProperties;
  tokenPicker?: ServlyNumberInputTokenPickerOptions;
  manualValue?: string | number;
  renderTokenPicker?: (props: ServlyNumberInputTokenPickerRenderProps) => React.ReactNode;
  renderCreateVariableValue: (props: {
    value: ServlyNumberInputValue | '';
    unitOfMeasurement: string;
    onChange: (event: ServlyNumberInputChangeEvent) => void;
    onTokenUnlink: () => void;
  }) => React.ReactNode;
  onOpenChange: (open: boolean) => void;
  triggerOpenChange?: boolean;
  onSelectToken: (token: ServlyNumberInputTokenOption) => void;
  onAddTokenLibrary?: () => void;
}

const getDefaultTokenLibraries = (
  designSystem: Required<ServlyNumberInputDesignSystem>
): ServlyNumberInputTokenLibrary[] => {
  if (designSystem.libraries.length > 0) return designSystem.libraries;

  const presetTokens = getOrderedPresetList(designSystem.presetMap).map(({ preset, pixels }) => ({
    value: preset,
    label: preset,
    numericValue: pixels,
    metaLabel: String(pixels),
  }));

  const keywordTokens = designSystem.keywords.map((keyword) => ({
    value: keyword,
    label: keyword,
    metaLabel: designSystem.metaLabel,
  }));

  return [
    {
      id: designSystem.id,
      label: designSystem.label,
      icon: designSystem.marker,
      groups: [
        {
          id: 'presets',
          label: designSystem.label,
          tokens: [...presetTokens, ...keywordTokens],
        },
      ],
    },
  ];
};

const getTokenMeta = (token: ServlyNumberInputTokenOption) => token.suffix ?? token.metaLabel ?? token.numericValue ?? '';

const getCreateVariableConfig = (tokenPicker?: ServlyNumberInputTokenPickerOptions) => {
  if (tokenPicker?.createVariable === false) return null;
  if (tokenPicker?.createVariable && typeof tokenPicker.createVariable === 'object') return tokenPicker.createVariable;
  return {};
};

export const TokenPickerPopover = ({
  adapters,
  visible,
  children,
  designSystem,
  selectedValue,
  classNames,
  styles,
  overlayClassName,
  overlayStyle,
  tokenPicker,
  manualValue,
  renderTokenPicker,
  renderCreateVariableValue,
  onOpenChange,
  triggerOpenChange = true,
  onSelectToken,
  onAddTokenLibrary,
}: TokenPickerPopoverProps) => {
  const { Popover, Dropdown, CloseIcon, CaretDownIcon, TokenIcon } = adapters;
  const [searchValue, setSearchValue] = useState('');
  const [selectedLibraryId, setSelectedLibraryId] = useState('all');
  const [libraryDropdownVisible, setLibraryDropdownVisible] = useState(false);
  const [createVariableVisible, setCreateVariableVisible] = useState(false);
  const [collectionDropdownVisible, setCollectionDropdownVisible] = useState(false);
  const selectedRowRef = useRef<HTMLButtonElement | null>(null);
  const wasVisibleRef = useRef(false);
  const libraries = useMemo(() => getDefaultTokenLibraries(designSystem), [designSystem]);
  const libraryControl = tokenPicker?.libraryControl ?? 'dropdown';
  const maxSearchItems = tokenPicker?.maxSearchItems ?? 2;
  const showSearchItems = tokenPicker?.showSearchItems ?? 'auto';
  const itemDensity = tokenPicker?.itemDensity ?? 'compact';
  const closeBehavior = tokenPicker?.closeBehavior ?? 'selection';
  const collapsibleLibraries = tokenPicker?.collapsibleLibraries ?? true;
  const createVariableConfig = getCreateVariableConfig(tokenPicker);
  const canCreateVariable = createVariableConfig !== null;
  const showManualValue = tokenPicker?.showManualValue ?? true;
  const collections =
    createVariableConfig?.collections ??
    libraries.map((library) => ({
      id: library.id,
      label: library.label,
    }));
  const tokenReferences = useMemo(
    () =>
      libraries.flatMap((library) =>
        library.groups.flatMap((group) =>
          group.tokens.map((token) => ({ libraryId: library.id, groupId: group.id, token }))
        )
      ),
    [libraries]
  );
  const initialCollectionId = createVariableConfig?.defaultCollectionId ?? collections[0]?.id ?? designSystem.id;
  const [createDraft, setCreateDraft] = useState<ServlyNumberInputCreateVariableDraft>({
    collectionId: initialCollectionId,
    name: createVariableConfig?.defaultName ?? '',
    value: createVariableConfig?.defaultValue ?? manualValue ?? '',
  });
  const [collapsedLibraryIds, setCollapsedLibraryIds] = useState<Set<string>>(() => {
    if (!tokenPicker?.defaultExpandedLibraryIds) return new Set();
    const expandedIds = new Set(tokenPicker.defaultExpandedLibraryIds);
    return new Set(libraries.filter((library) => !expandedIds.has(library.id)).map((library) => library.id));
  });

  useEffect(() => {
    const justOpened = visible && !wasVisibleRef.current;
    wasVisibleRef.current = visible;
    if (!justOpened || !selectedValue) return;

    const frame = window.requestAnimationFrame(() => {
      selectedRowRef.current?.scrollIntoView?.({ block: 'center', inline: 'nearest' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedValue, visible]);

  const handleSelectToken = (token: ServlyNumberInputTokenOption) => {
    onSelectToken(token);
    if (closeBehavior !== 'explicit') onOpenChange(false);
  };

  const getTokenIcon = (token: ServlyNumberInputTokenOption) =>
    token.prefix ?? token.icon ?? <ServlyNumberInputTokenSymbol symbol={token.symbol ?? 'number'} />;

  const renderProps: ServlyNumberInputTokenPickerRenderProps = {
    libraries,
    selectedValue,
    searchValue,
    selectedLibraryId,
    onSearchChange: setSearchValue,
    onLibraryChange: setSelectedLibraryId,
    onSelectToken: handleSelectToken,
    onClose: () => onOpenChange(false),
    onAddTokenLibrary,
  };

  const closeCreateVariable = () => {
    setCollectionDropdownVisible(false);
    setCreateVariableVisible(false);
    createVariableConfig?.onOpenChange?.(false);
  };

  const openCreateVariable = () => {
    if (!canCreateVariable) return;
    setCreateDraft({
      collectionId: createVariableConfig?.defaultCollectionId ?? collections[0]?.id ?? designSystem.id,
      name: createVariableConfig?.defaultName ?? '',
      value: createVariableConfig?.defaultValue ?? manualValue ?? '',
    });
    setCollectionDropdownVisible(false);
    setCreateVariableVisible(true);
    createVariableConfig?.onOpenChange?.(true);
  };

  const handleCreateVariableSubmit = async () => {
    const event = {
      draft: createDraft,
      close: closeCreateVariable,
      selectToken: handleSelectToken,
    };
    const createdToken = await createVariableConfig?.onSubmit?.(event);
    if (createdToken) handleSelectToken(createdToken);
    closeCreateVariable();
  };

  const handleCreateVariableCancel = () => {
    createVariableConfig?.onCancel?.(createDraft);
    closeCreateVariable();
  };

  const normalizedSearch = searchValue.trim().toLowerCase();
  const matchesSearch = (token: ServlyNumberInputTokenOption) => {
    if (!normalizedSearch) return true;
    return [token.value, token.label, token.description, token.metaLabel, token.itemType]
      .filter(Boolean)
      .some((text) => String(text).toLowerCase().includes(normalizedSearch));
  };
  const visibleLibraries = libraries
    .filter((library) => selectedLibraryId === 'all' || library.id === selectedLibraryId)
    .map((library) => ({
      ...library,
      groups: library.groups
        .map((group) => ({
          ...group,
          tokens: group.tokens.filter(matchesSearch),
        }))
        .filter((group) => group.tokens.length > 0),
    }))
    .filter((library) => library.groups.length > 0);

  const allMatchingTokens = visibleLibraries.flatMap((library) =>
    library.groups.flatMap((group) => group.tokens.map((token) => ({ library, group, token })))
  );

  const defaultSearchItems: ServlyNumberInputTokenPickerSearchItem[] =
    normalizedSearch.length > 0
      ? allMatchingTokens.slice(0, maxSearchItems).map(({ library, token }) => ({
          key: `${library.id}-${token.value}`,
          label: token.label ?? token.value,
          value: token.value,
          icon: getTokenIcon(token),
          suffix: getTokenMeta(token),
          itemType: token.itemType,
          className: token.className,
          onSelect: () => handleSelectToken(token),
        }))
      : [];
  const configuredSearchItems =
    typeof tokenPicker?.searchItems === 'function' ? tokenPicker.searchItems(renderProps) : tokenPicker?.searchItems;
  const searchItems = (configuredSearchItems ?? defaultSearchItems).slice(0, maxSearchItems);
  const shouldShowSearchItems =
    searchItems.length > 0 && (showSearchItems === true || (showSearchItems === 'auto' && normalizedSearch.length > 0));

  const handleLibraryChange = (libraryId: string) => {
    setSelectedLibraryId(libraryId);
    setLibraryDropdownVisible(false);
    if (tokenPicker?.closeOnLibraryChange) onOpenChange(false);
  };

  const toggleLibrary = (libraryId: string) => {
    if (!collapsibleLibraries) return;
    setCollapsedLibraryIds((current) => {
      const next = new Set(current);
      const open = next.has(libraryId);
      if (open) next.delete(libraryId);
      else next.add(libraryId);
      tokenPicker?.onLibraryOpenChange?.(libraryId, open);
      return next;
    });
  };

  const libraryLabel = selectedLibraryId === 'all' ? 'All libraries' : libraries.find((library) => library.id === selectedLibraryId)?.label;
  const libraryItems = [
    { key: 'all', label: 'All libraries', onClick: () => handleLibraryChange('all') },
    ...libraries.map((library) => ({
      key: library.id,
      label: library.label,
      onClick: () => handleLibraryChange(library.id),
    })),
  ];

  const manualToken =
    canCreateVariable && showManualValue && manualValue !== undefined && manualValue !== null && manualValue !== ''
      ? {
          value: String(manualValue),
          label: 'Number',
          numericValue: Number.parseFloat(String(manualValue)),
          metaLabel: String(manualValue),
        }
      : null;
  const shouldShowCreateVariableButton = canCreateVariable || Boolean(onAddTokenLibrary);
  const selectedCollectionLabel =
    collections.find((collection) => collection.id === createDraft.collectionId)?.label ?? collections[0]?.label ?? '';
  const collectionItems = collections.map((collection) => ({
    key: collection.id,
    label: collection.label,
    onClick: () => {
      setCreateDraft((current) => ({ ...current, collectionId: collection.id }));
      setCollectionDropdownVisible(false);
    },
  }));
  const handleCreateVariableValueChange = (event: ServlyNumberInputChangeEvent) => {
    const reference = event.isDesignSystem
      ? tokenReferences.find((candidate) => candidate.token.value === String(event.value))
      : undefined;

    if (reference) {
      const resolvedValue =
        reference.token.numericValue ??
        designSystem.presetMap[reference.token.value] ??
        reference.token.value;
      setCreateDraft((current) => ({ ...current, value: resolvedValue, reference }));
      return;
    }

    setCreateDraft((current) => ({ ...current, value: event.value, reference: undefined }));
  };

  const libraryControlNode =
    libraryControl === 'none' ? null : libraryControl === 'select' ? (
      <select
        value={selectedLibraryId}
        aria-label="Token library"
        onChange={(event) => handleLibraryChange(event.target.value)}
      >
        <option value="all">All libraries</option>
        {libraries.map((library) => (
          <option key={library.id} value={library.id}>
            {library.label}
          </option>
        ))}
      </select>
    ) : (
      <Dropdown
        items={libraryItems}
        open={libraryDropdownVisible}
        onOpenChange={setLibraryDropdownVisible}
        placement="bottomLeft"
        trigger={['click']}
        overlayClassName="servly-number-input__dropdown-popup servly-number-input__token-picker-library-menu"
        overlayStyle={overlayStyle}
      >
        <button
          type="button"
          className="servly-number-input__token-picker-library-trigger"
          aria-label="Token library"
          aria-expanded={libraryDropdownVisible}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setLibraryDropdownVisible(!libraryDropdownVisible);
          }}
        >
          <span>{libraryLabel}</span>
          <span className="servly-number-input__token-picker-library-trigger-caret" aria-hidden="true">
            <CaretDownIcon size={12} />
          </span>
        </button>
      </Dropdown>
    );

  const content =
    createVariableVisible
      ? createVariableConfig?.renderForm?.({
          draft: createDraft,
          collections,
          title: createVariableConfig?.title ?? 'Variable',
          submitLabel: createVariableConfig?.submitLabel ?? 'Create variable',
          setDraft: setCreateDraft,
          onSubmit: handleCreateVariableSubmit,
          onCancel: handleCreateVariableCancel,
          onClose: closeCreateVariable,
        } satisfies ServlyNumberInputCreateVariableRenderProps) ?? (
          <div
            className={cx('servly-number-input__token-picker', 'servly-number-input__create-variable', createVariableConfig?.className)}
            style={styles?.tokenPicker}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="servly-number-input__create-variable-header">
              <strong>{createVariableConfig?.title ?? 'Variable'}</strong>
              <button type="button" className="servly-number-input__suggestions-close" aria-label="Close create variable form" onClick={closeCreateVariable}>
                <CloseIcon size={16} />
              </button>
            </header>
            <div className="servly-number-input__create-variable-body">
              <label>
                <span>Collection</span>
                <Dropdown
                  items={collectionItems}
                  open={collectionDropdownVisible}
                  onOpenChange={(open) => {
                    setCollectionDropdownVisible(open);
                  }}
                  placement="bottomLeft"
                  trigger={[]}
                  overlayClassName="servly-number-input__dropdown-popup servly-number-input__create-variable-dropdown"
                  overlayStyle={overlayStyle}
                >
                  <button
                    type="button"
                    className="servly-number-input__create-variable-select-trigger"
                    aria-label="Variable collection"
                    aria-expanded={collectionDropdownVisible}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setCollectionDropdownVisible((open) => !open);
                    }}
                  >
                    <span>{selectedCollectionLabel}</span>
                    <CaretDownIcon size={12} />
                  </button>
                </Dropdown>
              </label>
              <label>
                <span>Name</span>
                <input
                  className="servly-number-input__create-variable-name-input"
                  value={createDraft.name}
                  onChange={(event) => setCreateDraft({ ...createDraft, name: event.target.value })}
                  autoFocus
                />
              </label>
              <label>
                <span>Value</span>
                {renderCreateVariableValue({
                  value: createDraft.reference?.token.value ?? createDraft.value,
                  unitOfMeasurement: createDraft.reference ? designSystem.id : 'px',
                  onChange: handleCreateVariableValueChange,
                  onTokenUnlink: () =>
                    setCreateDraft((current) => ({ ...current, reference: undefined })),
                })}
              </label>
            </div>
            <footer className="servly-number-input__create-variable-footer">
              <button type="button" onClick={handleCreateVariableSubmit}>
                {createVariableConfig?.submitLabel ?? 'Create variable'}
              </button>
            </footer>
          </div>
        )
      : renderTokenPicker?.(renderProps) ?? (
      <div
        className={cx('servly-number-input__suggestions', 'servly-number-input__token-picker', classNames?.tokenPicker)}
        style={styles?.tokenPicker}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="servly-number-input__token-picker-search">
          <svg className="servly-number-input__token-picker-search-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M7 12.25A5.25 5.25 0 1 1 7 1.75a5.25 5.25 0 0 1 0 10.5Z" stroke="currentColor" strokeWidth="1.6" />
            <path d="m10.75 10.75 3.1 3.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span className="servly-number-input__token-picker-search-field">
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && searchValue) {
                  event.preventDefault();
                  event.stopPropagation();
                  setSearchValue('');
                }
              }}
              placeholder="Search"
              aria-label="Search design tokens"
            />
            {searchValue ? (
              <button
                type="button"
                className="servly-number-input__token-picker-search-clear"
                aria-label="Clear token search"
                onClick={() => setSearchValue('')}
              >
                <CloseIcon size={12} />
              </button>
            ) : null}
          </span>
          <button
            type="button"
            className="servly-number-input__suggestions-close"
            aria-label="Close design token picker"
            onClick={() => onOpenChange(false)}
          >
            <CloseIcon size={14} />
          </button>
        </div>

        {shouldShowSearchItems ? (
          <div className="servly-number-input__token-picker-search-queue" aria-label="Matching tokens">
            {searchItems.map((item) => {
              const renderedItem = tokenPicker?.renderSearchItem?.(item, renderProps);
              return renderedItem ? (
                <React.Fragment key={item.key}>{renderedItem}</React.Fragment>
              ) : (
                <button
                  key={item.key}
                  type="button"
                  className={cx(
                    'servly-number-input__token-picker-search-item',
                    item.itemType && `is-${item.itemType}`,
                    item.className
                  )}
                  onClick={() => item.onSelect?.()}
                >
                  {item.icon ? <span className="servly-number-input__token-picker-search-item-icon">{item.icon}</span> : null}
                  <span className="servly-number-input__token-picker-search-item-label">{item.label}</span>
                  {item.suffix ? <span className="servly-number-input__token-picker-search-item-suffix">{item.suffix}</span> : null}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="servly-number-input__token-picker-toolbar">
          {libraryControlNode}
          {shouldShowCreateVariableButton ? (
            <button
              type="button"
              className="servly-number-input__token-picker-add"
              aria-label="Create design variable"
              onClick={() => {
                onAddTokenLibrary?.();
                openCreateVariable();
              }}
            >
              +
            </button>
          ) : null}
        </div>

        <div className={cx('servly-number-input__token-picker-body', `is-${itemDensity}`)}>
          {manualToken ? (
            <button
              type="button"
              className="servly-number-input__token-picker-row servly-number-input__token-picker-row--manual is-selected"
              onClick={openCreateVariable}
            >
              <span className="servly-number-input__token-picker-row-icon" aria-hidden="true">
                <ServlyNumberInputTokenSymbol symbol="number" />
              </span>
              <span className="servly-number-input__token-picker-row-label">{manualToken.label}</span>
              <span className="servly-number-input__token-picker-row-value">{manualToken.metaLabel}</span>
            </button>
          ) : null}
          {visibleLibraries.map((library) => (
            <section className={cx('servly-number-input__token-picker-library', library.className)} key={library.id}>
              <button
                type="button"
                className="servly-number-input__token-picker-library-heading"
                aria-label={library.label}
                aria-expanded={!collapsibleLibraries || normalizedSearch.length > 0 || !collapsedLibraryIds.has(library.id)}
                onClick={() => toggleLibrary(library.id)}
              >
                <span className="servly-number-input__token-picker-library-label">{library.label}</span>
                <span className="servly-number-input__token-picker-library-icon" aria-hidden="true">
                  {library.icon ??
                    (library.symbol ? <ServlyNumberInputTokenSymbol symbol={library.symbol} /> : <TokenIcon size={16} />)}
                </span>
                {collapsibleLibraries ? (
                  <CaretDownIcon
                    className={cx(
                      'servly-number-input__token-picker-library-caret',
                      (normalizedSearch.length > 0 || !collapsedLibraryIds.has(library.id)) && 'is-open'
                    )}
                    size={12}
                  />
                ) : null}
              </button>
              {!collapsibleLibraries || normalizedSearch.length > 0 || !collapsedLibraryIds.has(library.id) ? (
                <div className="servly-number-input__token-picker-library-content">
                  {library.groups.map((group) => (
                    <div className={cx('servly-number-input__token-picker-section', group.className, classNames?.tokenPickerSection)} key={group.id}>
                      {group.label !== library.label ? <p>{group.label}</p> : null}
                      {group.tokens.map((token) => (
                        <button
                          key={`${library.id}-${group.id}-${token.value}`}
                          ref={token.value === selectedValue ? selectedRowRef : undefined}
                          type="button"
                          className={cx(
                            'servly-number-input__suggestion',
                            'servly-number-input__token-picker-row',
                            token.value === selectedValue && 'is-selected',
                            token.className,
                            classNames?.tokenPickerRow
                          )}
                          style={styles?.tokenPickerRow}
                          onClick={() => handleSelectToken(token)}
                        >
                          <span className="servly-number-input__token-picker-row-icon" aria-hidden="true">
                            {getTokenIcon(token)}
                          </span>
                          <span className="servly-number-input__token-picker-row-label">{token.label ?? token.value}</span>
                          <span className="servly-number-input__token-picker-row-value">{getTokenMeta(token)}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          ))}
          {visibleLibraries.length === 0 ? <p className="servly-number-input__token-picker-empty">No tokens found</p> : null}
        </div>
      </div>
    );

  return (
    <Popover
      destroyTooltipOnHide
      content={content}
      open={visible}
      placement="bottomRight"
      arrow={false}
      overlayClassName={cx('servly-number-input__token-picker-popover', overlayClassName)}
      overlayInnerStyle={{
        ...overlayStyle,
        padding: 0,
        backgroundColor: 'var(--servly-number-input-overlay-bg)',
        border: '1px solid var(--servly-number-input-overlay-border)',
        borderRadius: 'calc(var(--servly-number-input-radius) + 4px)',
        boxShadow: 'var(--servly-number-input-overlay-shadow)',
      }}
      autoAdjustOverflow
      onOpenChange={
        triggerOpenChange
          ? (open) => {
              if (open || closeBehavior === 'automatic') onOpenChange(open);
            }
          : undefined
      }
    >
      {children}
    </Popover>
  );
};
