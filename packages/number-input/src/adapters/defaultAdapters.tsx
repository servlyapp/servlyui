import React from 'react';
import type {
  ServlyDropdownProps,
  ServlyDraggableNumberInputProps,
  ServlyNumberInputAdapters,
  ServlyPopoverProps,
  ServlyTooltipProps,
} from '../types';

const Tooltip = ({ children }: ServlyTooltipProps) => children;

const Popover = ({ open, content, children }: ServlyPopoverProps) => (
  <>
    {children}
    {open ? (
      <div className="servly-number-input__fallback-popover" role="dialog">
        {content}
      </div>
    ) : null}
  </>
);

const Dropdown = ({ items, open, overlayClassName, overlayStyle, children }: ServlyDropdownProps) => (
  <span className="servly-number-input__fallback-dropdown">
    {children}
    {open ? (
      <div className={['servly-number-input__fallback-menu', overlayClassName].filter(Boolean).join(' ')} style={overlayStyle} role="menu">
        {items.map((item) =>
          item.type === 'divider' ? (
            <hr key={item.key} className="servly-number-input__dropdown-divider" role="separator" />
          ) : (
            <button key={item.key} type="button" role="menuitem" onClick={item.onClick}>
              {item.label}
            </button>
          )
        )}
      </div>
    ) : null}
  </span>
);

const DraggableNumberInput = ({ children, onClick, disabled }: ServlyDraggableNumberInputProps) => (
  <span
    className="servly-number-input__fallback-draggable"
    onClick={(event) => {
      if (!disabled) onClick?.(event);
    }}
  >
    {children}
  </span>
);

const CaretDownIcon = ({ className }: { className?: string }) => <span className={className}>v</span>;
const CheckIcon = ({ className }: { className?: string }) => <span className={className}>✓</span>;
const CloseIcon = ({ className }: { className?: string }) => <span className={className}>×</span>;
const TokenIcon = ({ className, size = 14 }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 1.75 14.25 8 8 14.25 1.75 8 8 1.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M8 5.25v5.5M5.25 8h5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const UnlinkIcon = ({ className, size = 14 }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M5.3 10.7 4.2 11.8a2.1 2.1 0 0 1-3-3l2.2-2.2a2.1 2.1 0 0 1 3 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M10.7 5.3 11.8 4.2a2.1 2.1 0 0 1 3 3l-2.2 2.2a2.1 2.1 0 0 1-3 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="m5 5 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const defaultCoreAdapters: ServlyNumberInputAdapters = {
  Tooltip,
  Popover,
  Dropdown,
  DraggableNumberInput,
  CaretDownIcon,
  CheckIcon,
  CloseIcon,
  TokenIcon,
  UnlinkIcon,
};

export const mergeAdapters = (
  ...adapterSets: Array<Partial<ServlyNumberInputAdapters> | undefined>
): ServlyNumberInputAdapters =>
  adapterSets.reduce<ServlyNumberInputAdapters>(
    (merged, adapterSet) => ({ ...merged, ...(adapterSet ?? {}) }),
    defaultCoreAdapters
  );
