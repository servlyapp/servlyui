import React, { createRef } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ServlyNumberInputCore } from '../ServlyNumberInputCore';
import { ServlyNumberInputProvider } from '../provider';
import { ServlyNumberInputTokenSymbol } from '../components/TokenSymbol';
import type {
  ServlyDropdownProps,
  ServlyDraggableNumberInputProps,
  ServlyNumberInputAdapters,
  ServlyNumberInputDesignSystem,
  ServlyPopoverProps,
  ServlyNumberInputRef,
  ServlyTooltipProps,
} from '../types';

const suffixes = [
  { value: 'px', type: 'metric', label: 'PX' },
  { value: 'rem', type: 'metric', label: 'REM' },
  { value: '%', type: 'metric', label: 'Percent' },
  { value: '#', type: 'number', label: 'Number' },
  { value: 'tailwind', type: 'option', label: 'Tailwind' },
  { value: 'auto', type: 'keyword', label: 'Auto' },
];

const acmeDesignSystem: ServlyNumberInputDesignSystem = {
  id: 'acme',
  label: 'Acme',
  presetMap: { xs: 4, sm: 8, md: 16, lg: 32 },
  keywords: ['fluid'],
  defaultPreset: 'md',
  marker: 'A',
  metaLabel: 'Acme token',
  className: 'acme-root',
  inputClassName: 'acme-input',
  suffixClassName: 'acme-suffix',
  suggestionClassName: 'acme-suggestion',
};

const groupedDesignSystem: ServlyNumberInputDesignSystem = {
  ...acmeDesignSystem,
  libraries: [
    {
      id: 'ios',
      label: 'iOS and iPadOS 26',
      icon: <span data-testid="ios-library-icon">iOS</span>,
      groups: [
        {
          id: 'edge',
          label: 'Scroll Edge Effect',
          tokens: [
            { value: 'top', label: 'Top', numericValue: 27, metaLabel: '27', symbol: 'spacing' },
            {
              value: 'bottom',
              label: 'Bottom',
              numericValue: 62,
              metaLabel: '62',
              symbol: 'size',
              icon: <img data-testid="custom-bottom-icon" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" alt="" />,
            },
          ],
        },
        {
          id: 'glass',
          label: 'Liquid Glass',
          tokens: [{ value: 'opacity', label: 'Opacity', numericValue: 60, metaLabel: '60', symbol: 'opacity' }],
        },
      ],
    },
  ],
};

const acmeSuffixes = [
  { value: 'px', type: 'metric', label: 'PX' },
  { value: 'rem', type: 'metric', label: 'REM' },
  { value: 'acme', type: 'design-system', label: 'Acme', marker: 'A' },
  { value: 'fluid', type: 'keyword', label: 'Fluid' },
];

const TestDropdown = ({ items, open, overlayClassName, overlayStyle, children }: ServlyDropdownProps) => (
  <span>
    {children}
    {open ? (
      <div role="menu" className={overlayClassName} style={overlayStyle}>
        {items.map((item) =>
          item.type === 'divider' ? (
            <hr key={item.key} role="separator" />
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

const TestDraggable = ({ value, onChange, onDragStart, onDragEnd, children }: ServlyDraggableNumberInputProps) => (
  <span>
    <button
      type="button"
      data-testid="drag-step"
      onClick={() => {
        onDragStart?.();
        onChange(value + 10);
        onDragEnd?.();
      }}
    >
      drag
    </button>
    {children}
  </span>
);

const ReverseDraggable = ({ value, onChange, onDragStart, onDragEnd, children }: ServlyDraggableNumberInputProps) => (
  <span>
    <button
      type="button"
      data-testid="drag-step-down"
      onClick={() => {
        onDragStart?.();
        onChange(value - 10);
        onDragEnd?.();
      }}
    >
      drag down
    </button>
    {children}
  </span>
);

const HoldingDraggable = ({ value, onChange, onDragStart, children }: ServlyDraggableNumberInputProps) => (
  <span>
    <button
      type="button"
      data-testid="hold-drag-step"
      onClick={() => {
        onDragStart?.();
        onChange(value + 10);
      }}
    >
      hold drag
    </button>
    {children}
  </span>
);

const SmallStepDraggable = ({ value, onChange, onDragStart, children }: ServlyDraggableNumberInputProps) => (
  <span>
    <button
      type="button"
      data-testid="small-drag-step"
      onClick={() => {
        onDragStart?.();
        onChange(value + 1);
      }}
    >
      small drag
    </button>
    {children}
  </span>
);

const ClickableDraggable = ({ onClick, children }: ServlyDraggableNumberInputProps) => (
  <button type="button" data-testid="prefix-click-target" onClick={onClick}>
    {children}
  </button>
);

const DismissableTestPopover = ({ open, content, onOpenChange, children }: ServlyPopoverProps) => (
  <>
    {children}
    {open ? (
      <div data-testid="dismissable-popover">
        <button type="button" data-testid="outside-dismiss" onClick={() => onOpenChange?.(false)}>
          dismiss
        </button>
        {content}
      </div>
    ) : null}
  </>
);

const adapters: Partial<ServlyNumberInputAdapters> = {
  Tooltip: ({ children }: ServlyTooltipProps) => children,
  Popover: ({ open, content, placement, arrow, overlayClassName, overlayInnerStyle, children }) => (
    <>
      {children}
      {open ? (
        <div
          data-testid="popover-overlay"
          data-placement={placement}
          data-arrow={String(arrow)}
          className={overlayClassName}
          style={overlayInnerStyle}
        >
          {content}
        </div>
      ) : null}
    </>
  ),
  Dropdown: TestDropdown,
  DraggableNumberInput: TestDraggable,
  CaretDownIcon: () => <span>v</span>,
  CheckIcon: () => <span>check</span>,
  CloseIcon: () => <span>x</span>,
};

let resizeObserverCallback: ResizeObserverCallback | undefined;

class TestResizeObserver implements ResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    resizeObserverCallback = callback;
  }

  observe() {}
  unobserve() {}
  disconnect() {}
}

const installResizeObserver = () => vi.stubGlobal('ResizeObserver', TestResizeObserver);

const resizeInput = (width: number) => {
  act(() => {
    resizeObserverCallback?.(
      [{ contentRect: { width } } as unknown as ResizeObserverEntry],
      {} as ResizeObserver
    );
  });
};

afterEach(() => {
  resizeObserverCallback = undefined;
  vi.unstubAllGlobals();
});

describe('ServlyNumberInputCore', () => {
  it('renders controlled values and emits raw typing changes while focused', async () => {
    const onChange = vi.fn();
    render(
      <ServlyNumberInputCore
        value={10}
        onChange={onChange}
        suffixOptionList={suffixes}
        unitOfMeasurement="px"
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    const input = screen.getByTestId('number-input');
    await userEvent.click(input);
    fireEvent.change(input, { target: { value: '12' } });

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        value: '12',
        unit: 'px',
        numericValue: 12,
        isTailwind: false,
      })
    );
  });

  it('supports uncontrolled default values', () => {
    render(
      <ServlyNumberInputCore
        defaultValue={8}
        suffixOptionList={suffixes}
        unitOfMeasurement="px"
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    expect(screen.getByTestId('number-input')).toHaveValue('8');
  });

  it('uses dark sm as the default theme and size', () => {
    const { container } = render(
      <ServlyNumberInputCore
        value={8}
        suffixOptionList={suffixes}
        unitOfMeasurement="px"
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass('servly-number-input--theme-dark', 'servly-number-input--size-sm');
    expect(root.style.getPropertyValue('--servly-number-input-bg')).toBe('#202020');
    expect(root.style.getPropertyValue('--servly-number-input-height')).toBe('26px');
  });

  it('applies light theme and large size from component props', () => {
    const { container } = render(
      <ServlyNumberInputCore
        value={8}
        theme="light"
        size="lg"
        suffixOptionList={suffixes}
        unitOfMeasurement="px"
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass('servly-number-input--theme-light', 'servly-number-input--size-lg');
    expect(root.style.getPropertyValue('--servly-number-input-bg')).toBe('#f5f5f5');
    expect(root.style.getPropertyValue('--servly-number-input-height')).toBe('40px');
  });

  it('uses provider theme and size defaults and lets component props win', () => {
    const { container, rerender } = render(
      <ServlyNumberInputProvider theme="light" size="md">
        <ServlyNumberInputCore
          value={8}
          suffixOptionList={suffixes}
          unitOfMeasurement="px"
          alwaysShowSuffix
          adapters={adapters}
          data-testid="number-input"
        />
      </ServlyNumberInputProvider>
    );

    let root = container.querySelector('.servly-number-input') as HTMLElement;
    expect(root).toHaveClass('servly-number-input--theme-light', 'servly-number-input--size-md');

    rerender(
      <ServlyNumberInputProvider theme="light" size="md">
        <ServlyNumberInputCore
          value={8}
          theme="dark"
          size="xs"
          suffixOptionList={suffixes}
          unitOfMeasurement="px"
          alwaysShowSuffix
          adapters={adapters}
          data-testid="number-input"
        />
      </ServlyNumberInputProvider>
    );

    root = container.querySelector('.servly-number-input') as HTMLElement;
    expect(root).toHaveClass('servly-number-input--theme-dark', 'servly-number-input--size-xs');
    expect(root.style.getPropertyValue('--servly-number-input-height')).toBe('22px');
  });

  it('applies proportional variables used by token and suffix controls across sizes', () => {
    const { container, rerender } = render(
      <ServlyNumberInputCore
        value={16}
        size="xs"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="px"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    let root = container.querySelector('.servly-number-input') as HTMLElement;
    expect(root.style.getPropertyValue('--servly-number-input-height')).toBe('22px');
    expect(root.style.getPropertyValue('--servly-number-input-suffix-width')).toBe('24px');

    rerender(
      <ServlyNumberInputCore
        value={16}
        size="lg"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="px"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    root = container.querySelector('.servly-number-input') as HTMLElement;
    expect(root.style.getPropertyValue('--servly-number-input-height')).toBe('40px');
    expect(root.style.getPropertyValue('--servly-number-input-suffix-width')).toBe('44px');
    expect(screen.getByRole('button', { name: /open design token presets/i })).toHaveClass('servly-number-input__token-trigger');
  });

  it('uses independent light, dark, and custom token value colors', () => {
    const { container, rerender } = render(
      <ServlyNumberInputCore value="md" designSystem={acmeDesignSystem} unitOfMeasurement="acme" adapters={adapters} />
    );
    let root = container.querySelector('.servly-number-input') as HTMLElement;
    expect(root.style.getPropertyValue('--servly-number-input-token-value-text')).toBe('#93c5fd');

    rerender(
      <ServlyNumberInputCore value="md" theme="light" designSystem={acmeDesignSystem} unitOfMeasurement="acme" adapters={adapters} />
    );
    root = container.querySelector('.servly-number-input') as HTMLElement;
    expect(root.style.getPropertyValue('--servly-number-input-token-value-text')).toBe('#2563eb');

    rerender(
      <ServlyNumberInputCore
        value="md"
        theme={{ mode: 'light', tokens: { accent: '#f97316', tokenValueText: '#123456' } }}
        designSystem={acmeDesignSystem}
        unitOfMeasurement="acme"
        adapters={adapters}
      />
    );
    root = container.querySelector('.servly-number-input') as HTMLElement;
    expect(root.style.getPropertyValue('--servly-number-input-token-value-text')).toBe('#123456');
    expect(root.style.getPropertyValue('--servly-number-input-accent')).toBe('#f97316');
  });

  it('merges custom theme tokens into the root and dropdown overlay', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ServlyNumberInputCore
        value={8}
        theme={{
          mode: 'light',
          className: 'brand-number-theme',
          tokens: {
            background: '#fff7ed',
            text: '#431407',
            overlayBackground: '#fffbeb',
            accent: '#ea580c',
          },
        }}
        suffixOptionList={suffixes}
        unitOfMeasurement="px"
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass('servly-number-input--theme-light', 'brand-number-theme');
    expect(root.style.getPropertyValue('--servly-number-input-bg')).toBe('#fff7ed');
    expect(root.style.getPropertyValue('--servly-number-input-text')).toBe('#431407');

    await user.click(screen.getByRole('button', { name: /change number input suffix/i }));
    const menu = screen.getByRole('menu');
    expect(menu).toHaveClass('servly-number-input__dropdown-popup', 'brand-number-theme');
    expect((menu as HTMLElement).style.getPropertyValue('--servly-number-input-overlay-bg')).toBe('#fffbeb');
    expect((menu as HTMLElement).style.getPropertyValue('--servly-number-input-accent')).toBe('#ea580c');
  });

  it('passes dark accent variables to dropdown overlays for hover and selected styling', async () => {
    const user = userEvent.setup();
    render(
      <ServlyNumberInputCore
        value={8}
        theme={{ mode: 'dark', tokens: { accent: '#ff8a00' } }}
        suffixOptionList={suffixes}
        unitOfMeasurement="px"
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    await user.click(screen.getByRole('button', { name: /change number input suffix/i }));

    const menu = screen.getByRole('menu');
    expect(menu).toHaveClass('servly-number-input__dropdown-popup', 'servly-number-input__overlay--theme-dark');
    expect((menu as HTMLElement).style.getPropertyValue('--servly-number-input-accent')).toBe('#ff8a00');
  });

  it('converts metric suffix changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ServlyNumberInputCore
        value={16}
        onChange={onChange}
        suffixOptionList={suffixes}
        unitOfMeasurement="px"
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    await user.click(screen.getByRole('button', { name: /change number input suffix/i }));
    await user.click(screen.getByText('REM'));

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        value: 1,
        unit: 'rem',
      })
    );
  });

  it('shows suggestions from the keyboard and applies a suggestion', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ServlyNumberInputCore
        value={16}
        onChange={onChange}
        suffixOptionList={suffixes}
        unitOfMeasurement="px"
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    const input = screen.getByTestId('number-input');
    await user.click(input);
    fireEvent.keyDown(input, { ctrlKey: true, code: 'Space' });
    await user.click(screen.getByText('24px'));

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ value: '24', unit: 'px' }));
  });

  it('focuses numeric values without opening the token picker', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ServlyNumberInputCore
        value={62}
        theme="light"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="px"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    await user.click(screen.getByTestId('number-input'));

    expect(container.firstChild).toHaveClass('servly-number-input--active', 'servly-number-input--theme-light');
    expect(screen.queryByText('All libraries')).not.toBeInTheDocument();
  });

  it('lets a linked token preview toggle the explicit picker open and closed', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ServlyNumberInputCore
        value="md"
        theme="light"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    expect(screen.queryByRole('button', { name: /open design token presets/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /unlink design token preset/i })).not.toBeInTheDocument();

    const tokenValue = screen.getByRole('button', { name: /open design token picker for 16/i });
    expect(tokenValue).toHaveClass('servly-number-input__token-value');
    expect(screen.getByTestId('number-input')).toBe(tokenValue);
    expect(container.querySelector('input[data-testid="number-input"]')).not.toBeInTheDocument();

    await user.click(tokenValue);

    expect(container.firstChild).toHaveClass('servly-number-input--active');
    expect(tokenValue).toHaveClass('is-open');
    expect(tokenValue).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('All libraries')).toBeInTheDocument();

    await user.click(tokenValue);

    expect(screen.queryByText('All libraries')).not.toBeInTheDocument();
    expect(tokenValue).toHaveAttribute('aria-expanded', 'false');
  });

  it('ignores ordinary popover dismissal in explicit close mode', async () => {
    const user = userEvent.setup();
    render(
      <ServlyNumberInputCore
        value="md"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={acmeDesignSystem}
        tokenPicker={{ closeBehavior: 'explicit' }}
        adapters={{ ...adapters, Popover: DismissableTestPopover }}
        data-testid="number-input"
      />
    );

    await user.click(screen.getByRole('button', { name: /open design token picker for 16/i }));
    await user.click(screen.getByTestId('outside-dismiss'));

    expect(screen.getByText('All libraries')).toBeInTheDocument();
  });

  it('closes on selection by default and supports automatic picker dismissal', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ServlyNumberInputCore
        value="md"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={acmeDesignSystem}
        adapters={adapters}
        data-testid="number-input"
      />
    );

    await user.click(screen.getByRole('button', { name: /open design token picker for 16/i }));
    await user.click(screen.getByText('lg').closest('button') as HTMLElement);
    expect(screen.queryByText('All libraries')).not.toBeInTheDocument();

    rerender(
      <ServlyNumberInputCore
        value="md"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={acmeDesignSystem}
        tokenPicker={{ closeBehavior: 'automatic' }}
        adapters={adapters}
        data-testid="number-input"
      />
    );
    const tokenValue = screen.getByRole('button', { name: /open design token picker for 16/i });
    await user.click(tokenValue);
    await user.click(tokenValue);
    expect(screen.queryByText('All libraries')).not.toBeInTheDocument();
  });

  it('reveals linked token unlink only from whole input hover', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ServlyNumberInputCore
        value="md"
        theme="light"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );
    const root = container.querySelector('.servly-number-input') as HTMLElement;
    const tokenValue = screen.getByRole('button', { name: /open design token picker for 16/i });

    expect(screen.queryByRole('button', { name: /unlink design token preset/i })).not.toBeInTheDocument();

    fireEvent.focus(tokenValue);
    expect(screen.queryByRole('button', { name: /unlink design token preset/i })).not.toBeInTheDocument();

    fireEvent.click(tokenValue);
    expect(screen.getByText('All libraries')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /unlink design token preset/i })).not.toBeInTheDocument();

    fireEvent.mouseEnter(root);
    expect(screen.getByRole('button', { name: /unlink design token preset/i })).toHaveClass('is-linked');

    fireEvent.mouseLeave(root);
    expect(screen.queryByRole('button', { name: /unlink design token preset/i })).not.toBeInTheDocument();

    await user.click(tokenValue);
    expect(screen.queryByText('All libraries')).not.toBeInTheDocument();
  });

  it('delays token tooltips and suppresses them while the token picker is open', async () => {
    const user = userEvent.setup();
    const Tooltip = ({ children, title, mouseEnterDelay }: ServlyTooltipProps) => (
      <span data-tooltip-title={title ? String(title) : ''} data-tooltip-delay={mouseEnterDelay ?? ''}>
        {children}
      </span>
    );

    render(
      <ServlyNumberInputCore
        value="md"
        theme="light"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={{ ...adapters, Tooltip }}
        data-testid="number-input"
      />
    );

    const tokenValue = screen.getByRole('button', { name: /open design token picker for 16/i });
    expect(tokenValue.closest('[data-tooltip-title]')).toHaveAttribute('data-tooltip-title', 'md: 16');
    expect(tokenValue.closest('[data-tooltip-delay]')).toHaveAttribute('data-tooltip-delay', '2');

    await user.click(tokenValue);

    expect(screen.getByText('All libraries')).toBeInTheDocument();
    expect(tokenValue.closest('[data-tooltip-title]')).toHaveAttribute('data-tooltip-title', '');
  });

  it('hides the suffix selector by default when a token is linked', () => {
    render(
      <ServlyNumberInputCore
        value="md"
        theme="light"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    expect(screen.queryByRole('button', { name: /change number input suffix/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /unlink design token preset/i })).not.toBeInTheDocument();
  });

  it('can keep the suffix selector visible while a token is linked', () => {
    render(
      <ServlyNumberInputCore
        value="md"
        theme="light"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={acmeDesignSystem}
        hideSuffixWhenTokenLinked={false}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    expect(screen.getByRole('button', { name: /change number input suffix/i })).toHaveClass(
      'servly-number-input__suffix--design-system',
      'acme-suffix'
    );
    expect(screen.queryByRole('button', { name: /unlink design token preset/i })).not.toBeInTheDocument();
  });

  it('opens the token picker from the manual token trigger without opening the suffix dropdown', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ServlyNumberInputCore
        value={16}
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="px"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    const tokenButton = screen.getByRole('button', { name: /open design token presets/i });
    expect(tokenButton).toHaveClass('is-manual');
    expect(tokenButton.querySelector('.servly-number-input__token-icon')).toBeInTheDocument();
    expect(tokenButton.querySelector('.servly-number-input__token-icon--unlink')).toBeNull();

    fireEvent.mouseEnter(container.querySelector('.servly-number-input') as HTMLElement);
    expect(screen.queryByText('All libraries')).not.toBeInTheDocument();

    await user.click(tokenButton);

    expect(screen.getByText('All libraries')).toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('moves the manual token action into the suffix menu when md width is constrained', async () => {
    installResizeObserver();
    const user = userEvent.setup();
    const { container } = render(
      <ServlyNumberInputCore
        value={16}
        prefixLabelText="W"
        size="md"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="px"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    resizeInput(120);

    const root = container.querySelector('.servly-number-input') as HTMLElement;
    await waitFor(() => expect(root).toHaveClass('servly-number-input--compact-token-action'));
    expect(root).toHaveClass('servly-number-input--token-action-suffix-menu');
    expect(screen.queryByRole('button', { name: /open design token presets/i })).not.toBeInTheDocument();
    expect(container.querySelector('.servly-number-input__compact-token-anchor')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /change number input suffix/i }));
    const menu = screen.getByRole('menu');
    const menuItems = within(menu).getAllByRole('menuitem');
    expect(menuItems[0]).toHaveTextContent('Apply variable');
    expect(menuItems[0].querySelector('.servly-number-input__suffix-option-token-icon')).toBeInTheDocument();
    expect(within(menu).getByRole('separator')).toBeInTheDocument();

    await user.click(menuItems[0]);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByText('All libraries')).toBeInTheDocument();
    expect(root).toHaveClass('servly-number-input--active');
  });

  it('preserves an open token picker while resizing between compact and inline anchors', async () => {
    installResizeObserver();
    const user = userEvent.setup();
    const { container } = render(
      <ServlyNumberInputCore
        value={16}
        prefixLabelText="W"
        size="md"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="px"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    resizeInput(120);
    await user.click(screen.getByRole('button', { name: /change number input suffix/i }));
    await user.click(screen.getByText('Apply variable'));
    expect(screen.getByText('All libraries')).toBeInTheDocument();

    resizeInput(220);

    const root = container.querySelector('.servly-number-input') as HTMLElement;
    await waitFor(() => expect(root).toHaveClass('servly-number-input--token-action-inline'));
    expect(root).not.toHaveClass('servly-number-input--compact-token-action');
    expect(screen.getByRole('button', { name: /open design token presets/i })).toHaveClass('is-open');
    expect(screen.getByText('All libraries')).toBeInTheDocument();
  });

  it('falls back to the inline token action when a suffix-menu policy has no menu host', () => {
    render(
      <ServlyNumberInputCore
        value={16}
        designSystem={acmeDesignSystem}
        showTokenTrigger
        layoutPolicy={() => ({ tokenActionPlacement: 'suffix-menu' })}
        adapters={adapters}
        data-testid="number-input"
      />
    );

    expect(screen.getByRole('button', { name: /open design token presets/i })).toBeInTheDocument();
    expect(screen.queryByText('Apply variable')).not.toBeInTheDocument();
  });

  it('allows policies and showTokenTrigger to suppress every manual token action', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ServlyNumberInputCore
        value={16}
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="px"
        designSystem={acmeDesignSystem}
        layoutPolicy={() => ({ tokenActionPlacement: 'hidden' })}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    expect(screen.queryByRole('button', { name: /open design token presets/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /change number input suffix/i }));
    expect(screen.queryByText('Apply variable')).not.toBeInTheDocument();

    rerender(
      <ServlyNumberInputCore
        value={16}
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="px"
        designSystem={acmeDesignSystem}
        showTokenTrigger={false}
        layoutPolicy={() => ({ tokenActionPlacement: 'suffix-menu' })}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    expect(screen.queryByText('Apply variable')).not.toBeInTheDocument();
  });

  it('does not add a compact manual action for linked tokens', async () => {
    installResizeObserver();
    const user = userEvent.setup();
    render(
      <ServlyNumberInputCore
        value="md"
        prefixLabelText="W"
        size="lg"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={acmeDesignSystem}
        hideSuffixWhenTokenLinked={false}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    resizeInput(120);
    await user.click(screen.getByRole('button', { name: /change number input suffix/i }));

    expect(screen.queryByText('Apply variable')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open design token picker for 16/i })).toBeInTheDocument();
  });

  it('hides the manual token trigger while prefix dragging', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ServlyNumberInputCore
        value={16}
        prefixLabelText="W"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="px"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={{ ...adapters, DraggableNumberInput: HoldingDraggable }}
        data-testid="number-input"
      />
    );

    await user.click(screen.getByTestId('hold-drag-step'));

    expect(container.querySelector('.servly-number-input')).toHaveClass('servly-number-input--dragging', 'servly-number-input--active');
    expect(screen.queryByRole('button', { name: /open design token presets/i })).not.toBeInTheDocument();
    expect(screen.queryByText('All libraries')).not.toBeInTheDocument();
  });

  it('keeps the manual token trigger hidden while pointer lock is still active between drag updates', () => {
    vi.useFakeTimers();
    Object.defineProperty(document, 'pointerLockElement', {
      configurable: true,
      value: document.body,
    });

    render(
      <ServlyNumberInputCore
        value={16}
        prefixLabelText="W"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="px"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={{ ...adapters, DraggableNumberInput: HoldingDraggable }}
        data-testid="number-input"
      />
    );

    fireEvent.click(screen.getByTestId('hold-drag-step'));
    act(() => vi.advanceTimersByTime(220));

    expect(screen.queryByRole('button', { name: /open design token presets/i })).not.toBeInTheDocument();

    Object.defineProperty(document, 'pointerLockElement', {
      configurable: true,
      value: null,
    });
    act(() => {
      document.dispatchEvent(new Event('pointerlockchange'));
    });

    expect(screen.getByRole('button', { name: /open design token presets/i })).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('unlinks a linked token trigger back to a metric value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <ServlyNumberInputCore
        value="md"
        onChange={onChange}
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    fireEvent.mouseEnter(container.querySelector('.servly-number-input') as HTMLElement);

    const unlinkButton = screen.getByRole('button', { name: /unlink design token preset/i });
    expect(screen.queryByRole('button', { name: /open design token presets/i })).not.toBeInTheDocument();
    expect(unlinkButton.querySelector('.servly-number-input__token-icon--unlink')).toBeInTheDocument();
    expect(unlinkButton.querySelector('.servly-number-input__token-icon:not(.servly-number-input__token-icon--unlink)')).toBeNull();

    await user.click(unlinkButton);

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ value: 16, unit: 'px', isDesignSystem: false }));
  });

  it('hides linked token unlink while prefix dragging', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ServlyNumberInputCore
        value="md"
        prefixLabelText="W"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={{ ...adapters, DraggableNumberInput: HoldingDraggable }}
        data-testid="number-input"
      />
    );
    fireEvent.mouseEnter(container.querySelector('.servly-number-input') as HTMLElement);
    expect(screen.getByRole('button', { name: /unlink design token preset/i })).toBeInTheDocument();

    await user.click(screen.getByTestId('hold-drag-step'));

    expect(screen.queryByRole('button', { name: /unlink design token preset/i })).not.toBeInTheDocument();
  });

  it('keeps linked token unlink hidden while pointer lock is still active between drag updates', () => {
    vi.useFakeTimers();
    Object.defineProperty(document, 'pointerLockElement', {
      configurable: true,
      value: document.body,
    });

    const { container } = render(
      <ServlyNumberInputCore
        value="md"
        prefixLabelText="W"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={{ ...adapters, DraggableNumberInput: HoldingDraggable }}
        data-testid="number-input"
      />
    );
    const root = container.querySelector('.servly-number-input') as HTMLElement;

    fireEvent.mouseEnter(root);
    expect(screen.getByRole('button', { name: /unlink design token preset/i })).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('hold-drag-step'));
    act(() => vi.advanceTimersByTime(220));

    expect(screen.queryByRole('button', { name: /unlink design token preset/i })).not.toBeInTheDocument();

    Object.defineProperty(document, 'pointerLockElement', {
      configurable: true,
      value: null,
    });
    act(() => {
      document.dispatchEvent(new Event('pointerlockchange'));
    });

    expect(screen.getByRole('button', { name: /unlink design token preset/i })).toBeInTheDocument();

    fireEvent.mouseLeave(root);
    expect(screen.queryByRole('button', { name: /unlink design token preset/i })).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('suppresses forced display overlays for linked tokens while idle', () => {
    render(
      <ServlyNumberInputCore
        value="md"
        prefixLabelText="P"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
        renderDisplayValue={() => <span data-testid="forced-display">slot preview</span>}
      />
    );

    expect(screen.queryByTestId('forced-display')).not.toBeInTheDocument();
    expect(screen.getByTestId('number-input')).not.toHaveClass('servly-number-input__input--display-overlaid');
  });

  it('allows drag display overlays to replace linked token values', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ServlyNumberInputCore
        value="md"
        prefixLabelText="P"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={{ ...adapters, DraggableNumberInput: HoldingDraggable }}
        data-testid="number-input"
        renderDisplayValue={(context) =>
          context.isDragging ? <span data-testid="drag-display">slot {context.displayValue}</span> : null
        }
      />
    );

    await user.click(screen.getByTestId('hold-drag-step'));

    expect(screen.getByTestId('drag-display')).toHaveTextContent('slot 16');
    expect(screen.getByTestId('number-input')).toHaveClass('servly-number-input__input--display-overlaid');
    expect(screen.queryByRole('button', { name: /open design token picker/i })).not.toBeInTheDocument();
    expect(container.querySelectorAll('.servly-number-input__display-value')).toHaveLength(1);
    expect(container.querySelectorAll('.servly-number-input__token-value')).toHaveLength(0);
  });

  it('locks the measured token pill width for the full drag traversal', async () => {
    const measurement = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 42,
      height: 20,
      x: 0,
      y: 0,
      top: 0,
      right: 42,
      bottom: 20,
      left: 0,
      toJSON: () => ({}),
    });
    const { container, rerender } = render(
      <ServlyNumberInputCore
        value="md"
        prefixLabelText="P"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={acmeDesignSystem}
        adapters={{ ...adapters, DraggableNumberInput: HoldingDraggable }}
        data-testid="number-input"
        renderDisplayValue={(context) => (context.isDragging ? <span>{context.displayValue}</span> : null)}
      />
    );

    fireEvent.click(screen.getByTestId('hold-drag-step'));
    let inputWrap = container.querySelector('.servly-number-input__input-wrap') as HTMLElement;
    expect(inputWrap.style.getPropertyValue('--servly-number-input-token-drag-width')).toBe('42px');

    rerender(
      <ServlyNumberInputCore
        value="lg"
        prefixLabelText="P"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={acmeDesignSystem}
        adapters={{ ...adapters, DraggableNumberInput: HoldingDraggable }}
        data-testid="number-input"
        renderDisplayValue={(context) => (context.isDragging ? <span>{context.displayValue}</span> : null)}
      />
    );
    inputWrap = container.querySelector('.servly-number-input__input-wrap') as HTMLElement;
    expect(inputWrap.style.getPropertyValue('--servly-number-input-token-drag-width')).toBe('42px');

    measurement.mockRestore();
  });

  it('closes an open token picker when the display renderer changes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ServlyNumberInputCore
        value={16}
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="px"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
        renderDisplayValue={() => null}
      />
    );

    await user.click(screen.getByRole('button', { name: /open design token presets/i }));
    expect(screen.getByText('All libraries')).toBeInTheDocument();

    rerender(
      <ServlyNumberInputCore
        value={16}
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="px"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
        renderDisplayValue={() => <span data-testid="forced-display">slot preview</span>}
      />
    );

    await waitFor(() => expect(screen.queryByText('All libraries')).not.toBeInTheDocument());
  });

  it('uses the configured dropdown adapter for the token library control', async () => {
    const user = userEvent.setup();
    render(
      <ServlyNumberInputCore
        value="md"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    await user.click(screen.getByTestId('number-input'));

    expect(screen.queryByRole('combobox', { name: /token library/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /token library/i }));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Acme' })).toBeInTheDocument();
  });

  it('opens the token picker under the trigger without a popover arrow', async () => {
    const user = userEvent.setup();
    render(
      <ServlyNumberInputCore
        value={947}
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="px"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    await user.click(screen.getByRole('button', { name: /open design token presets/i }));

    expect(screen.getByTestId('popover-overlay')).toHaveAttribute('data-placement', 'bottomRight');
    expect(screen.getByTestId('popover-overlay')).toHaveAttribute('data-arrow', 'false');
  });

  it('shows the current manual value as a variable creation row', async () => {
    const user = userEvent.setup();
    render(
      <ServlyNumberInputCore
        value={947}
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="px"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    await user.click(screen.getByRole('button', { name: /open design token presets/i }));

    expect(screen.getByText('Number')).toBeInTheDocument();
    expect(screen.getByText('947')).toBeInTheDocument();

    await user.click(screen.getByText('Number').closest('button') as HTMLElement);

    expect(screen.getByText('Variable')).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('947')).toHaveLength(2);
  });

  it('uses the adapter dropdown for collections and the standard token picker for references', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { container } = render(
      <ServlyNumberInputCore
        value={947}
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="px"
        designSystem={groupedDesignSystem}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
        tokenPicker={{ createVariable: { onSubmit } }}
      />
    );

    await user.click(screen.getByRole('button', { name: /open design token presets/i }));
    await user.click(screen.getByRole('button', { name: /create design variable/i }));

    const collectionTrigger = screen.getByRole('button', { name: /variable collection/i });
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    await user.click(collectionTrigger);
    await user.click(screen.getByRole('menuitem', { name: 'iOS and iPadOS 26' }));

    const nestedValueInput = container.querySelector('.servly-number-input__create-variable-number-input') as HTMLElement;
    await user.hover(nestedValueInput);
    await user.click(within(nestedValueInput).getByRole('button', { name: /open design token presets/i }));
    expect(screen.getByRole('textbox', { name: /search design tokens/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Top 27/i }));

    expect(within(nestedValueInput).getByRole('button', { name: /open design token picker for 27/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Create variable' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        draft: expect.objectContaining({
          value: 27,
          reference: expect.objectContaining({
            libraryId: 'ios',
            groupId: 'edge',
            token: expect.objectContaining({ value: 'top', numericValue: 27 }),
          }),
        }),
      })
    );
  });

  it('clears a variable token reference when its resolved value is edited manually', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { container } = render(
      <ServlyNumberInputCore
        value={947}
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="px"
        designSystem={groupedDesignSystem}
        alwaysShowSuffix
        adapters={adapters}
        tokenPicker={{ createVariable: { onSubmit } }}
      />
    );

    await user.click(screen.getByRole('button', { name: /open design token presets/i }));
    await user.click(screen.getByRole('button', { name: /create design variable/i }));
    const nestedValueInput = container.querySelector('.servly-number-input__create-variable-number-input') as HTMLElement;
    await user.hover(nestedValueInput);
    await user.click(within(nestedValueInput).getByRole('button', { name: /open design token presets/i }));
    await user.click(screen.getByRole('button', { name: /Top 27/i }));

    const linkedValueInput = container.querySelector('.servly-number-input__create-variable-number-input') as HTMLElement;
    fireEvent.mouseEnter(linkedValueInput);
    await user.click(within(linkedValueInput).getByRole('button', { name: /unlink design token preset/i }));
    const valueInput = await waitFor(() => {
      const unlinkedValueInput = container.querySelector('.servly-number-input__create-variable-number-input') as HTMLElement;
      return within(unlinkedValueInput).getByRole('textbox');
    });
    await user.clear(valueInput);
    const editableValueInput = within(
      container.querySelector('.servly-number-input__create-variable-number-input') as HTMLElement
    ).getByRole('textbox');
    await user.type(editableValueInput, '32');
    await user.click(screen.getByRole('button', { name: 'Create variable' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        draft: expect.objectContaining({ value: '32', reference: undefined }),
      })
    );
  });

  it('can disable the default create-variable affordances', async () => {
    const user = userEvent.setup();
    render(
      <ServlyNumberInputCore
        value={947}
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="px"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
        tokenPicker={{ createVariable: false }}
      />
    );

    await user.click(screen.getByRole('button', { name: /open design token presets/i }));

    expect(screen.queryByRole('button', { name: /create design variable/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Number')).not.toBeInTheDocument();
  });

  it('lets consumers render and submit a custom create-variable form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <ServlyNumberInputCore
        value={12}
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="px"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
        tokenPicker={{
          createVariable: {
            onSubmit,
            renderForm: (props) => (
              <button type="button" data-testid="custom-create-variable" onClick={props.onSubmit}>
                Create {props.draft.value}
              </button>
            ),
          },
        }}
      />
    );

    await user.click(screen.getByRole('button', { name: /open design token presets/i }));
    await user.click(screen.getByRole('button', { name: /create design variable/i }));
    await user.click(screen.getByTestId('custom-create-variable'));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ draft: expect.objectContaining({ value: 12 }) }));
  });

  it('shows a compact two-item search queue only when search has matches', async () => {
    const user = userEvent.setup();
    render(
      <ServlyNumberInputCore
        value="md"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    await user.click(screen.getByTestId('number-input'));

    expect(screen.queryByLabelText('Matching tokens')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/search design tokens/i), 'm');

    expect(screen.getByLabelText('Matching tokens').querySelectorAll('button')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /clear token search/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /clear token search/i }));
    expect(screen.getByLabelText(/search design tokens/i)).toHaveValue('');
    expect(screen.queryByLabelText('Matching tokens')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/search design tokens/i), 'm');
    await user.keyboard('{Escape}');
    expect(screen.getByLabelText(/search design tokens/i)).toHaveValue('');
    expect(screen.getByText('All libraries')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/search design tokens/i), 'zzzz');

    expect(screen.queryByLabelText('Matching tokens')).not.toBeInTheDocument();
  });

  it('selects a token from flat preset map rows', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ServlyNumberInputCore
        value="md"
        onChange={onChange}
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    await user.click(screen.getByTestId('number-input'));
    await user.click(screen.getByText('lg').closest('button') as HTMLElement);

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        value: 'lg',
        unit: '',
        designSystem: 'acme',
        isDesignSystem: true,
      })
    );
    expect(screen.queryByText('All libraries')).not.toBeInTheDocument();
    expect(screen.getByTestId('number-input')).toHaveAttribute('aria-expanded', 'false');
  });

  it('displays resolved numeric preset values while preserving token identity in changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ServlyNumberInputCore
        value="md"
        onChange={onChange}
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    expect(screen.getByRole('button', { name: /open design token picker for 16/i })).toHaveTextContent('16');

    await user.click(screen.getByRole('button', { name: /open design token picker for 16/i }));
    await user.click(screen.getByText('lg').closest('button') as HTMLElement);

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ value: 'lg', numericValue: 32, designSystem: 'acme' }));
  });

  it('opens the token picker for invalid design-system input', async () => {
    const onReject = vi.fn();
    render(
      <ServlyNumberInputCore
        value="md"
        onReject={onReject}
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={acmeDesignSystem}
        tokenPicker={{ tokenValueClickBehavior: 'edit' }}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    const input = screen.getByTestId('number-input');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'zzz' } });

    expect(onReject).toHaveBeenCalledWith(expect.objectContaining({ reason: 'invalid-preset' }));
    expect(screen.getByText('All libraries')).toBeInTheDocument();
  });

  it('uses grouped token libraries when provided', async () => {
    const user = userEvent.setup();
    render(
      <ServlyNumberInputCore
        value="bottom"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={groupedDesignSystem}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    expect(screen.getByRole('button', { name: /open design token picker for 62/i })).toHaveTextContent('62');

    await user.click(screen.getByRole('button', { name: /open design token picker for 62/i }));

    expect(screen.getByRole('button', { name: 'iOS and iPadOS 26' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('ios-library-icon')).toBeInTheDocument();
    expect(screen.getByText('Scroll Edge Effect')).toBeInTheDocument();
    expect(screen.getByText('Bottom')).toBeInTheDocument();
    expect(screen.getByText('Bottom').closest('.servly-number-input__token-picker-row')).toHaveClass('is-selected');
    expect(screen.getByText('62', { selector: '.servly-number-input__token-picker-row-value' })).toBeInTheDocument();
  });

  it('scrolls the selected token into view when the picker opens', async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });

    render(
      <ServlyNumberInputCore
        value="bottom"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={groupedDesignSystem}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    await user.click(screen.getByRole('button', { name: /open design token picker for 62/i }));

    await waitFor(() =>
      expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center', inline: 'nearest' })
    );
    expect(screen.getByRole('button', { name: 'iOS and iPadOS 26' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Bottom').closest('.servly-number-input__token-picker-row')).toHaveClass('is-selected');

    if (originalScrollIntoView) HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    else delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView;
  });

  it('collapses and expands token libraries with configurable defaults and events', async () => {
    const user = userEvent.setup();
    const onLibraryOpenChange = vi.fn();
    render(
      <ServlyNumberInputCore
        value="bottom"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={groupedDesignSystem}
        tokenPicker={{ defaultExpandedLibraryIds: [], onLibraryOpenChange }}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    await user.click(screen.getByRole('button', { name: /open design token picker for 62/i }));

    const libraryDisclosure = screen.getByRole('button', { name: 'iOS and iPadOS 26' });
    expect(libraryDisclosure).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Bottom')).not.toBeInTheDocument();

    await user.click(libraryDisclosure);

    expect(libraryDisclosure).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Bottom')).toBeInTheDocument();
    expect(onLibraryOpenChange).toHaveBeenLastCalledWith('ios', true);

    await user.click(libraryDisclosure);

    expect(libraryDisclosure).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Bottom')).not.toBeInTheDocument();
    expect(onLibraryOpenChange).toHaveBeenLastCalledWith('ios', false);

    await user.type(screen.getByLabelText(/search design tokens/i), 'bottom');
    expect(screen.getAllByText('Bottom')).toHaveLength(2);
    expect(libraryDisclosure).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('button', { name: /clear token search/i }));
    expect(screen.queryByText('Bottom')).not.toBeInTheDocument();
    expect(libraryDisclosure).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders all packaged semantic symbols and preserves custom icon precedence', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        {(['number', 'spacing', 'size', 'radius', 'opacity'] as const).map((symbol) => (
          <ServlyNumberInputTokenSymbol key={symbol} symbol={symbol} />
        ))}
        <ServlyNumberInputCore
          value="bottom"
          suffixOptionList={acmeSuffixes}
          unitOfMeasurement="acme"
          designSystem={groupedDesignSystem}
          adapters={adapters}
          data-testid="number-input"
        />
      </>
    );

    for (const symbol of ['number', 'spacing', 'size', 'radius', 'opacity']) {
      expect(container.querySelector(`[data-symbol="${symbol}"]`)).toBeInTheDocument();
    }

    await user.click(screen.getByRole('button', { name: /open design token picker for 62/i }));
    const bottomRow = screen.getByText('Bottom').closest('.servly-number-input__token-picker-row') as HTMLElement;
    expect(within(bottomRow).getByTestId('custom-bottom-icon')).toBeInTheDocument();
    expect(bottomRow.querySelector('[data-symbol="size"]')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/search design tokens/i), 'top');
    const searchQueue = screen.getByLabelText('Matching tokens');
    expect(searchQueue.querySelector('[data-symbol="spacing"]')).toBeInTheDocument();
  });

  it('uses resolved token value text for design-system tooltips', () => {
    const tooltipAdapters: Partial<ServlyNumberInputAdapters> = {
      ...adapters,
      Tooltip: ({ children, title }: ServlyTooltipProps) => (
        <span data-tooltip-title={typeof title === 'string' ? title : ''}>{children}</span>
      ),
    };
    render(
      <ServlyNumberInputCore
        value="bottom"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={groupedDesignSystem}
        alwaysShowSuffix
        adapters={tooltipAdapters}
        data-testid="number-input"
      />
    );

    expect(screen.getByTestId('number-input').closest('[data-tooltip-title]')).toHaveAttribute('data-tooltip-title', 'Bottom: 62');
  });

  it('lets custom token picker renderers replace default picker content', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ServlyNumberInputCore
        value="md"
        onChange={onChange}
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
        renderTokenPicker={(props) => (
          <button type="button" data-testid="custom-token-picker" onClick={() => props.onSelectToken({ value: 'xs', label: 'XS' })}>
            Custom token picker
          </button>
        )}
      />
    );

    await user.click(screen.getByRole('button', { name: /open design token picker for 16/i }));
    await user.click(screen.getByTestId('custom-token-picker'));

    expect(screen.queryByText('All libraries')).not.toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ value: 'xs', designSystem: 'acme' }));
  });

  it('keeps suffix unit switching independent from the token trigger', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ServlyNumberInputCore
        value={16}
        onChange={onChange}
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="px"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    await user.click(screen.getByRole('button', { name: /change number input suffix/i }));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.queryByText('All libraries')).not.toBeInTheDocument();

    await user.click(screen.getByText('REM'));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ unit: 'rem' }));
  });

  it('passes theme variables to the suggestions popover overlay', async () => {
    render(
      <ServlyNumberInputCore
        value={16}
        theme={{ mode: 'dark', tokens: { overlayBackground: '#121826', overlayBorder: '#334155' } }}
        suffixOptionList={suffixes}
        unitOfMeasurement="px"
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    const input = screen.getByTestId('number-input');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { ctrlKey: true, code: 'Space' });

    const overlay = screen.getByTestId('popover-overlay');
    expect(overlay).toHaveClass('servly-number-input__suggestions-popover', 'servly-number-input__overlay--theme-dark');
    expect(overlay.style.getPropertyValue('--servly-number-input-overlay-bg')).toBe('#121826');
    expect(overlay.style.getPropertyValue('--servly-number-input-overlay-border')).toBe('#334155');
  });

  it('marks invalid metric input without emitting a change', async () => {
    const onChange = vi.fn();
    const onReject = vi.fn();
    const { container } = render(
      <ServlyNumberInputCore
        value={16}
        onChange={onChange}
        onReject={onReject}
        suffixOptionList={suffixes}
        unitOfMeasurement="px"
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    const input = screen.getByTestId('number-input');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'abc' } });

    expect(onChange).not.toHaveBeenCalledWith(expect.objectContaining({ value: 'abc' }));
    expect(onReject).toHaveBeenCalledWith(expect.objectContaining({ reason: 'invalid-number', suffix: 'px' }));
    await waitFor(() => expect(container.firstChild).toHaveClass('servly-number-input--invalid'));
  });

  it('allows decimal number values by default for number suffixes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ServlyNumberInputCore
        value={10}
        onChange={onChange}
        suffixOptionList={suffixes}
        unitOfMeasurement="#"
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    const input = screen.getByTestId('number-input');
    await user.click(input);
    fireEvent.change(input, { target: { value: '12.5' } });

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        value: '12.5',
        unit: '#',
        numericValue: 12.5,
      })
    );
  });

  it('rejects decimal input when numberMode is integer', async () => {
    const onChange = vi.fn();
    const onReject = vi.fn();
    const { container } = render(
      <ServlyNumberInputCore
        value={10}
        onChange={onChange}
        onReject={onReject}
        suffixOptionList={suffixes}
        unitOfMeasurement="#"
        numberMode="integer"
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    const input = screen.getByTestId('number-input');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '12.5' } });

    expect(onChange).not.toHaveBeenCalled();
    expect(onReject).toHaveBeenCalledWith(expect.objectContaining({ reason: 'invalid-number', suffix: '#' }));
    await waitFor(() => expect(container.firstChild).toHaveClass('servly-number-input--invalid'));
  });

  it('rejects invalid design-system preset typing before opening the token picker', async () => {
    const onChange = vi.fn();
    const onReject = vi.fn();
    render(
      <ServlyNumberInputCore
        value="md"
        onChange={onChange}
        onReject={onReject}
        suffixOptionList={acmeSuffixes}
        designSystem={acmeDesignSystem}
        unitOfMeasurement="acme"
        tokenPicker={{ tokenValueClickBehavior: 'edit' }}
        hideSuffixWhenTokenLinked={false}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    const input = screen.getByTestId('number-input');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'zz' } });

    expect(onChange).not.toHaveBeenCalled();
    expect(onReject).toHaveBeenCalledWith(expect.objectContaining({ reason: 'invalid-preset', suffix: 'acme' }));
    expect(screen.getByText('All libraries')).toBeInTheDocument();
  });

  it('rejects invalid custom values when custom values are not allowed', () => {
    const onChange = vi.fn();
    const onReject = vi.fn();
    render(
      <ServlyNumberInputCore
        value="base"
        onChange={onChange}
        onReject={onReject}
        suffixOptionList={[{ value: 'custom', type: 'custom', label: 'Custom' }]}
        unitOfMeasurement="custom"
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    const input = screen.getByTestId('number-input');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'other' } });

    expect(onChange).not.toHaveBeenCalledWith(expect.objectContaining({ value: 'other' }));
    expect(onReject).toHaveBeenCalledWith(expect.objectContaining({ reason: 'invalid-custom', suffix: 'custom' }));
  });

  it('converts metric values into an injected design-system scale', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ServlyNumberInputCore
        value={16}
        onChange={onChange}
        suffixOptionList={acmeSuffixes}
        designSystem={acmeDesignSystem}
        unitOfMeasurement="px"
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    await user.click(screen.getByRole('button', { name: /change number input suffix/i }));
    await user.click(screen.getByText('Acme'));

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        value: 'md',
        unit: '',
        designSystem: 'acme',
        isDesignSystem: true,
        isTailwind: false,
      })
    );
  });

  it('applies injected design-system and slot classes', async () => {
    const { container } = render(
      <ServlyNumberInputCore
        value="sm"
        suffixOptionList={acmeSuffixes}
        designSystem={acmeDesignSystem}
        unitOfMeasurement="acme"
        hideSuffixWhenTokenLinked={false}
        tokenPicker={{ tokenValueClickBehavior: 'edit' }}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
        classNames={{ root: 'slot-root', input: 'slot-input', suffix: 'slot-suffix' }}
        styles={{ root: { width: 123 } }}
      />
    );

    const root = container.firstChild as HTMLElement;
    const input = screen.getByTestId('number-input');
    expect(root).toHaveClass('slot-root', 'acme-root');
    expect(root).toHaveStyle({ width: '123px' });
    expect(input).toHaveClass('slot-input', 'acme-input');
    expect(container.querySelector('.slot-suffix')).toHaveClass('acme-suffix');

    fireEvent.focus(input);
    fireEvent.keyDown(input, { ctrlKey: true, code: 'Space' });
    expect(screen.getByText('Acme Presets')).toBeInTheDocument();
    expect(screen.getByText('sm (8px)').closest('button')).toHaveClass('acme-suggestion');
  });

  it('clamps drag changes and marks them as drag operations', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onReject = vi.fn();
    const { container } = render(
      <ServlyNumberInputCore
        value={98}
        onChange={onChange}
        onReject={onReject}
        prefixLabelText="W"
        suffixOptionList={suffixes}
        unitOfMeasurement="px"
        alwaysShowSuffix
        min={0}
        max={100}
        adapters={adapters}
        data-testid="number-input"
      />
    );

    await user.click(screen.getByTestId('drag-step'));

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        value: 100,
        unit: 'px',
        isDragOperation: true,
      })
    );
    expect(onReject).toHaveBeenCalledWith(expect.objectContaining({ reason: 'max', suffix: 'px' }));
    await waitFor(() => expect(container.firstChild).toHaveClass('servly-number-input--reject'));
  });

  it('emits min rejection when dragging below the minimum value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onReject = vi.fn();
    render(
      <ServlyNumberInputCore
        value={2}
        onChange={onChange}
        onReject={onReject}
        prefixLabelText="W"
        suffixOptionList={suffixes}
        unitOfMeasurement="px"
        alwaysShowSuffix
        min={0}
        max={100}
        adapters={{ ...adapters, DraggableNumberInput: ReverseDraggable }}
        data-testid="number-input"
      />
    );

    await user.click(screen.getByTestId('drag-step-down'));

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ value: 0, unit: 'px' }));
    expect(onReject).toHaveBeenCalledWith(expect.objectContaining({ reason: 'min', suffix: 'px' }));
  });

  it('shows a refusal state when dragging beyond the last preset', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onReject = vi.fn();
    const { container } = render(
      <ServlyNumberInputCore
        value="lg"
        onChange={onChange}
        onReject={onReject}
        prefixLabelText="G"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    await user.click(screen.getByTestId('drag-step'));

    expect(onChange).not.toHaveBeenCalled();
    expect(onReject).toHaveBeenCalledWith(expect.objectContaining({ reason: 'preset-end', suffix: 'acme' }));
    await waitFor(() => expect(container.firstChild).toHaveClass('servly-number-input--reject'));
  });

  it('requires more drag distance before stepping through short preset lists', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onReject = vi.fn();
    render(
      <ServlyNumberInputCore
        value="md"
        onChange={onChange}
        onReject={onReject}
        prefixLabelText="G"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={{ ...adapters, DraggableNumberInput: SmallStepDraggable }}
        data-testid="number-input"
      />
    );

    await user.click(screen.getByTestId('small-drag-step'));

    expect(onChange).not.toHaveBeenCalled();
    expect(onReject).not.toHaveBeenCalled();
  });

  it('emits preset-start rejection when dragging before the first preset', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onReject = vi.fn();
    render(
      <ServlyNumberInputCore
        value="xs"
        onChange={onChange}
        onReject={onReject}
        prefixLabelText="G"
        suffixOptionList={acmeSuffixes}
        unitOfMeasurement="acme"
        designSystem={acmeDesignSystem}
        alwaysShowSuffix
        adapters={{ ...adapters, DraggableNumberInput: ReverseDraggable }}
        data-testid="number-input"
      />
    );

    await user.click(screen.getByTestId('drag-step-down'));

    expect(onChange).not.toHaveBeenCalled();
    expect(onReject).toHaveBeenCalledWith(expect.objectContaining({ reason: 'preset-start', suffix: 'acme' }));
  });

  it('emits value drag lifecycle events', async () => {
    const user = userEvent.setup();
    const onValueDragStart = vi.fn();
    const onValueDrag = vi.fn();
    const onValueDragEnd = vi.fn();
    render(
      <ServlyNumberInputCore
        value={20}
        prefixLabelText="W"
        suffixOptionList={suffixes}
        unitOfMeasurement="px"
        alwaysShowSuffix
        min={0}
        max={100}
        adapters={adapters}
        data-testid="number-input"
        onValueDragStart={onValueDragStart}
        onValueDrag={onValueDrag}
        onValueDragEnd={onValueDragEnd}
      />
    );

    await user.click(screen.getByTestId('drag-step'));

    expect(onValueDragStart).toHaveBeenCalledWith(expect.objectContaining({ phase: 'start', value: 20, suffix: 'px' }));
    expect(onValueDrag).toHaveBeenCalledWith(expect.objectContaining({ phase: 'move', value: 30, rawValue: 30 }));
    expect(onValueDragEnd).toHaveBeenCalledWith(expect.objectContaining({ phase: 'end', suffix: 'px' }));
  });

  it('keeps pointer lock enabled for prefix drag by default and allows opting out', () => {
    const capturedProps: ServlyDraggableNumberInputProps[] = [];
    const CapturingDraggable = (props: ServlyDraggableNumberInputProps) => {
      capturedProps.push(props);
      return <span data-testid="capturing-drag">{props.children}</span>;
    };

    const { rerender } = render(
      <ServlyNumberInputCore
        value={20}
        prefixLabelText="W"
        suffixOptionList={suffixes}
        unitOfMeasurement="px"
        alwaysShowSuffix
        adapters={{ ...adapters, DraggableNumberInput: CapturingDraggable }}
      />
    );

    expect(capturedProps[capturedProps.length - 1]?.disablePointerLock).toBe(false);

    rerender(
      <ServlyNumberInputCore
        value={20}
        prefixLabelText="W"
        suffixOptionList={suffixes}
        unitOfMeasurement="px"
        alwaysShowSuffix
        disablePointerLock
        adapters={{ ...adapters, DraggableNumberInput: CapturingDraggable }}
      />
    );

    expect(capturedProps[capturedProps.length - 1]?.disablePointerLock).toBe(true);
  });

  it('selects the input on prefix click without entering drag state', async () => {
    const user = userEvent.setup();
    const select = vi.spyOn(HTMLInputElement.prototype, 'select').mockImplementation(() => undefined);
    const { container } = render(
      <ServlyNumberInputCore
        value={20}
        prefixLabelText="W"
        suffixOptionList={suffixes}
        unitOfMeasurement="px"
        alwaysShowSuffix
        adapters={{ ...adapters, DraggableNumberInput: ClickableDraggable }}
        data-testid="number-input"
      />
    );

    await user.click(screen.getByTestId('prefix-click-target'));

    expect(select).toHaveBeenCalled();
    expect(container.querySelector('.servly-number-input')).not.toHaveClass('servly-number-input--dragging');

    select.mockRestore();
  });

  it('renders a custom display value overlay while dragging', async () => {
    const user = userEvent.setup();
    render(
      <ServlyNumberInputCore
        value={20}
        prefixLabelText="W"
        suffixOptionList={suffixes}
        unitOfMeasurement="px"
        alwaysShowSuffix
        adapters={{ ...adapters, DraggableNumberInput: HoldingDraggable }}
        data-testid="number-input"
        renderDisplayValue={(context) =>
          context.isDragging ? <span data-testid="drag-display">slot {context.displayValue}</span> : null
        }
      />
    );

    expect(screen.queryByTestId('drag-display')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('hold-drag-step'));

    expect(screen.getByTestId('drag-display')).toHaveTextContent('slot 20');
    expect(screen.getByTestId('number-input')).toHaveClass('servly-number-input__input--display-overlaid');
  });

  it('keeps the suffix visible and inert while prefix drag is active', async () => {
    const user = userEvent.setup();
    render(
      <ServlyNumberInputCore
        value={20}
        prefixLabelText="W"
        suffixOptionList={suffixes}
        unitOfMeasurement="px"
        alwaysShowSuffix
        adapters={{ ...adapters, DraggableNumberInput: HoldingDraggable }}
        data-testid="number-input"
      />
    );

    await user.click(screen.getByTestId('hold-drag-step'));

    const suffixTrigger = await screen.findByRole('button', { name: /change number input suffix/i });
    expect(suffixTrigger).toHaveClass('servly-number-input__suffix--dragging');
    expect(suffixTrigger).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(suffixTrigger);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes an open suffix dropdown when prefix drag starts', async () => {
    const user = userEvent.setup();
    render(
      <ServlyNumberInputCore
        value={20}
        prefixLabelText="W"
        suffixOptionList={suffixes}
        unitOfMeasurement="px"
        alwaysShowSuffix
        adapters={{ ...adapters, DraggableNumberInput: HoldingDraggable }}
        data-testid="number-input"
      />
    );

    await user.click(screen.getByRole('button', { name: /change number input suffix/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.click(screen.getByTestId('hold-drag-step'));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /change number input suffix/i })).toBeInTheDocument();
  });

  it('keeps normal suffix hiding when not hovered or always shown', () => {
    render(
      <ServlyNumberInputCore
        value={20}
        prefixLabelText="W"
        suffixOptionList={suffixes}
        unitOfMeasurement="px"
        adapters={adapters}
        data-testid="number-input"
      />
    );

    expect(screen.queryByRole('button', { name: /change number input suffix/i })).not.toBeInTheDocument();
  });

  it('exposes the ref API', () => {
    const ref = createRef<ServlyNumberInputRef>();
    const onChange = vi.fn();
    render(
      <ServlyNumberInputCore
        ref={ref}
        defaultValue={12}
        onChange={onChange}
        suffixOptionList={suffixes}
        unitOfMeasurement="px"
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    expect(ref.current?.getNumericValue()).toBe(12);
    expect(ref.current?.getUnit()).toBe('px');
    act(() => {
      ref.current?.setUnit('rem');
    });
    expect(ref.current?.getUnit()).toBe('rem');
    act(() => {
      ref.current?.setValue(24);
    });
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ value: 24 }));
  });

  it('respects disabled and readOnly states', () => {
    const onChange = vi.fn();
    render(
      <ServlyNumberInputCore
        value={16}
        onChange={onChange}
        suffixOptionList={suffixes}
        unitOfMeasurement="px"
        disabled
        readOnly
        alwaysShowSuffix
        adapters={adapters}
        data-testid="number-input"
      />
    );

    const input = screen.getByTestId('number-input');
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('readonly');
    fireEvent.change(input, { target: { value: '20' } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('uses provider adapters and lets component adapters win', () => {
    const ProviderTooltip = ({ children }: ServlyTooltipProps) => <span data-testid="provider-tooltip">{children}</span>;
    const ComponentTooltip = ({ children }: ServlyTooltipProps) => <span data-testid="component-tooltip">{children}</span>;
    const { Tooltip: _tooltip, ...adaptersWithoutTooltip } = adapters;

    const { rerender } = render(
      <ServlyNumberInputProvider adapters={{ Tooltip: ProviderTooltip }}>
        <ServlyNumberInputCore
          value={16}
          suffixOptionList={suffixes}
          unitOfMeasurement="px"
          alwaysShowSuffix
          adapters={adaptersWithoutTooltip}
          data-testid="number-input"
        />
      </ServlyNumberInputProvider>
    );

    expect(screen.getAllByTestId('provider-tooltip').length).toBeGreaterThan(0);

    rerender(
      <ServlyNumberInputProvider adapters={{ Tooltip: ProviderTooltip }}>
        <ServlyNumberInputCore
          value={16}
          suffixOptionList={suffixes}
          unitOfMeasurement="px"
          alwaysShowSuffix
          adapters={{ ...adapters, Tooltip: ComponentTooltip }}
          data-testid="number-input"
        />
      </ServlyNumberInputProvider>
    );

    expect(screen.getAllByTestId('component-tooltip').length).toBeGreaterThan(0);
  });
});
