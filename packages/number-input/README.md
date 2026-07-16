# @servlyui/number-input

`ServlyNumberInput` is a compact React number input for design/property panels. It supports integers, decimals, CSS units, injectable design-system presets, suffix switching, suggestions, min/max validation, and draggable value changes.

It was extracted from the portal `ServlyInput` and narrowed around numeric input behavior.

## Install

```bash
npm install @servlyui/number-input react react-dom
```

For the default styled component, also install the default primitive peers:

```bash
npm install antd lucide-react react-icons draggable-number-input
```

Import the packaged styles once in your app:

```tsx
import '@servlyui/number-input/styles.css';
```

## Basic Usage

```tsx
import { ServlyNumberInput } from '@servlyui/number-input';
import '@servlyui/number-input/styles.css';

const suffixes = [
  { value: 'px', type: 'metric', label: 'Pixels' },
  { value: 'rem', type: 'metric', label: 'REM' },
  { value: '%', type: 'metric', label: 'Percent' },
  { value: 'tailwind', type: 'option', label: 'Tailwind' },
  { value: 'auto', type: 'keyword', label: 'Auto' },
];

export function WidthInput() {
  return (
    <ServlyNumberInput
      value={16.5}
      prefixLabelText="W"
      suffixOptionList={suffixes}
      unitOfMeasurement="px"
      alwaysShowSuffix
      min={0}
      max={400}
      onChange={(event) => {
        console.log(event.value, event.unit, event.numericValue, event.isDesignSystem);
      }}
    />
  );
}
```

## Number Values

The component treats raw numeric values as finite JavaScript numbers. Integers and decimals are accepted by default for metric suffixes and for raw number suffixes such as `#` or `number`.

Use `numberMode` when a field must be stricter:

```tsx
<ServlyNumberInput unitOfMeasurement="#" numberMode="integer" />
<ServlyNumberInput unitOfMeasurement="#" numberMode="decimal" />
<ServlyNumberInput unitOfMeasurement="#" numberMode="any" />
```

`numberMode="integer"` rejects decimal input while typing and rounds drag/programmatic number output. `any` and `decimal` both allow whole numbers and decimal values.

## Prefix Drag And Pointer Lock

Prefix dragging uses browser pointer lock by default so the drag can continue cleanly past neighboring UI and viewport edges. Browser pointer lock can show a browser-owned hint such as "press Esc to show your cursor"; web apps cannot suppress or restyle that hint while pointer lock is active.

```tsx
<ServlyNumberInput disablePointerLock />
```

Set `disablePointerLock` only when a product prefers normal cursor behavior over pointer-lock capture.

## Core Usage With Custom Primitives

Use `/core` when you do not want the package entrypoint to statically import Ant Design, Lucide, react-icons, or draggable-number-input.

```tsx
import { ServlyNumberInputCore, ServlyNumberInputProvider } from '@servlyui/number-input/core';

<ServlyNumberInputProvider adapters={myAdapters} isSectionHovered>
  <ServlyNumberInputCore suffixOptionList={[{ value: 'px', type: 'metric' }]} />
</ServlyNumberInputProvider>;
```

Adapter precedence is:

1. Component `adapters`
2. `ServlyNumberInputProvider` adapters
3. Default AntD adapters for `ServlyNumberInput`, or core fallback adapters for `ServlyNumberInputCore`

Adapters include `Tooltip`, `Popover`, `Dropdown`, `DraggableNumberInput`, `CaretDownIcon`, `CheckIcon`, `CloseIcon`, `TokenIcon`, and `UnlinkIcon`.

## Public API

Main exports:

- `ServlyNumberInput`
- `ServlyNumberInputCore`
- `ServlyNumberInputProvider`
- `ServlyNumberInputProps`
- `ServlyNumberInputRef`
- `ServlyNumberInputChangeEvent`
- `ServlyNumberInputSuffixOption`
- `ServlyNumberInputAdapters`
- `ServlyNumberInputDesignSystem`
- `ServlyNumberInputTokenLibrary`
- `ServlyNumberInputTokenGroup`
- `ServlyNumberInputTokenOption`
- `ServlyNumberInputTokenPickerRenderProps`
- `ServlyNumberInputDisplayValueContext`
- `ServlyNumberInputNumberMode`
- `ServlyNumberInputSize`
- `ServlyNumberInputTheme`
- `ServlyNumberInputClassNames`
- `ServlyNumberInputStyles`
- `ServlyNumberInputValueDragEvent`
- `ServlyNumberInputRejectEvent`
- `ServlyNumberInputRejectReason`
- `parseValueWithUnit`
- `convertUnit`
- `TAILWIND_PRESET_MAP`
- `DEFAULT_TAILWIND_DESIGN_SYSTEM`
- `VALID_UNITS`

Haptics extension exports from `@servlyui/number-input/haptics`:

- `createServlyNumberInputHapticEngine`
- `useServlyNumberInputHaptics`
- `DEFAULT_SERVLY_NUMBER_INPUT_HAPTIC_ASSETS`
- `getServlyNumberInputHapticKindForRejectReason`
- haptic engine, envelope, speed, asset, and hook result types

## Ref API

```tsx
const ref = useRef<ServlyNumberInputRef>(null);

ref.current?.focus();
ref.current?.select();
ref.current?.setValue(24);
ref.current?.getNumericValue();
ref.current?.getUnit();
ref.current?.setUnit('rem');
```

## Suffix Options

Metric suffixes convert between compatible units:

```ts
{ value: 'px', type: 'metric', label: 'Pixels' }
```

The Tailwind option is the default design-system preset mode. It converts numeric pixel values to the closest Tailwind preset:

```ts
{ value: 'tailwind', type: 'option', label: 'Tailwind' }
```

Keyword options write a Tailwind keyword while keeping the component in Tailwind mode:

```ts
{ value: 'auto', type: 'keyword', label: 'Auto' }
```

Preset suffixes can provide their own ordered numeric preset map for drag traversal:

```ts
{ value: 'blur', type: 'preset', presets: { '0': 0, sm: 4, md: 8 } }
```

## Custom Design Systems

Tailwind is only the default preset scale. Consumers can inject another design system with its own token map, keywords, marker, labels, and class hooks:

```tsx
const acmeScale = {
  id: 'acme',
  label: 'Acme',
  presetMap: { xs: 4, sm: 8, md: 16, lg: 32 },
  keywords: ['fluid', 'content'],
  defaultPreset: 'md',
  marker: 'A',
  metaLabel: 'Acme token',
  className: 'acme-number-input',
  inputClassName: 'acme-number-input-field',
  suffixClassName: 'acme-number-input-suffix',
  suggestionClassName: 'acme-number-input-suggestion',
};

<ServlyNumberInput
  value="md"
  unitOfMeasurement="acme"
  designSystem={acmeScale}
  suffixOptionList={[
    { value: 'px', type: 'metric', label: 'Pixels' },
    { value: 'acme', type: 'design-system', label: 'Acme', marker: 'A' },
    { value: 'fluid', type: 'keyword', label: 'Fluid' },
  ]}
/>;
```

Design-system preset maps can use numeric keys like Tailwind or named keys such as `xs`, `sm`, and `md`. Drag traversal and suggestions order presets by their numeric pixel value. If multiple presets share the same numeric value, keep their keys stable and unique; display extensions should animate `displayValue` rather than `numericValue` so equal-value tokens still transition by identity.

Change events include generic design-system metadata:

```ts
event.isDesignSystem; // true for Tailwind or an injected scale
event.designSystem; // e.g. "tailwind" or "acme"
event.isTailwind; // deprecated Tailwind-era alias
```

## Design Token Picker

When a `designSystem` or design-system suffix option is present, ServlyNumberInput can show a token trigger beside the value. For manual values, the visible `DiamondPlus` token icon opens design token presets. For linked token values, the value pill opens the picker and the trailing control reveals an unlink icon on hover/focus.

The manual token action is container-aware. When the prefix, readable value, token action, and suffix cannot fit together, the package moves `Apply variable` into the suffix dropdown as its first item. The default minimum readable value widths are 32px, 36px, 40px, and 48px for `xs`, `sm`, `md`, and `lg`. Without a suffix menu, the action remains inline so token selection stays accessible.

Use `layoutPolicy` to override only the placement decision. The callback receives the measured width, size, interaction state, token state, suffix availability, and estimated value space:

```tsx
import type { ServlyNumberInputLayoutPolicy } from '@servlyui/number-input';

const keepTokenActionInline: ServlyNumberInputLayoutPolicy = () => ({
  tokenActionPlacement: 'inline',
});

const productLayout: ServlyNumberInputLayoutPolicy = (context) => ({
  tokenActionPlacement:
    context.containerWidth !== undefined && context.containerWidth < 150
      ? 'suffix-menu'
      : 'inline',
});

<ServlyNumberInput layoutPolicy={productLayout} />;
```

Available placements are `inline`, `suffix-menu`, and `hidden`. `showTokenTrigger={false}` always wins. If `suffix-menu` is requested without a selectable suffix menu, the component falls back to `inline`. Browsers without `ResizeObserver` use the inline default unless the policy explicitly returns another placement.

By default, linked token values hide the suffix selector because the token owns the scale/unit context. Set `hideSuffixWhenTokenLinked={false}` when your product needs token linking and unit switching visible at the same time; when visible, the suffix keeps a token-colored background while the dropdown menu itself stays theme-neutral.

```tsx
<ServlyNumberInput
  value={value}
  prefixLabelText="W"
  unitOfMeasurement="acme"
  designSystem={acmeScale}
  suffixOptionList={[
    { value: 'px', type: 'metric', label: 'Pixels' },
    { value: 'acme', type: 'design-system', label: 'Acme', marker: 'A' },
  ]}
  showTokenTrigger="auto"
  hideSuffixWhenTokenLinked
  tokenPicker={{
    libraryControl: 'dropdown',
    closeBehavior: 'selection',
    maxSearchItems: 2,
    showSearchItems: 'auto',
    collapsibleLibraries: true,
    defaultExpandedLibraryIds: ['ios-26'],
    onLibraryOpenChange: (libraryId, open) => trackLibraryDisclosure(libraryId, open),
  }}
/>
```

The default picker uses compact, size-aware typography and spacing. Its search, close, add, library, and disclosure controls share proportional icon boxes across `xs | sm | md | lg`. Each token library is an independent disclosure section, expanded by default unless `defaultExpandedLibraryIds` is provided. Opening the picker scrolls the rendered selected token to the center of the token list. Searching temporarily reveals matching rows inside collapsed libraries; the clear icon or Escape resets the search and restores their previous collapsed state. Set `collapsibleLibraries={false}` when every library should remain open. Library-level `icon` nodes appear beside their labels, and the active token row receives an inset rounded theme surface without adding a border.

Flat `presetMap` values automatically become picker rows. For a more Figma-like library view, provide grouped token libraries:

```tsx
const acmeScale = {
  id: 'acme',
  label: 'Acme',
  presetMap: { top: 27, bottom: 62, opacity: 60 },
  libraries: [
    {
      id: 'ios',
      label: 'iOS and iPadOS 26',
      symbol: 'size',
      groups: [
        {
          id: 'edge',
          label: 'Scroll Edge Effect',
          tokens: [
            { value: 'top', label: 'Top', numericValue: 27, metaLabel: '27', symbol: 'spacing' },
            { value: 'bottom', label: 'Bottom', numericValue: 62, metaLabel: '62', symbol: 'size' },
          ],
        },
      ],
    },
  ],
} satisfies ServlyNumberInputDesignSystem;
```

Typing an invalid preset while in design-system mode opens the token picker and emits `onReject`. Consumers can replace the default picker with `renderTokenPicker`; the render props include libraries, search state, selected library, `onSelectToken`, `onClose`, and `onAddTokenLibrary`.

By default the token picker reuses the configured `Dropdown` adapter for the library filter, opens under the token trigger without an arrow, and uses compact popover sizing that matches the package suggestions/dropdowns. `closeBehavior: 'selection'` is the default, so choosing a token closes the library. Use `'explicit'` when the picker should remain open until its trigger, close button, or a custom renderer's `onClose` closes it; use `'automatic'` for normal popover dismissal. `closeOnLibraryChange` remains an explicit override.

The picker shows a Figma-like manual value row such as `Number 947` and exposes a plus action for creating a variable. Use `tokenPicker.libraryControl = 'select' | 'dropdown' | 'none'`, `searchItems`, `renderSearchItem`, `itemDensity: 'comfortable'`, `showManualValue`, and `createVariable: false` when a product needs its own picker rhythm. Linked token values open the token picker on click; manual values reveal the token trigger on hover/focus. Set `tokenPicker.tokenValueClickBehavior = 'edit'` to make token values behave like normal editable text.

Token options and libraries accept `symbol: 'number' | 'spacing' | 'size' | 'radius' | 'opacity'`. The packaged `ServlyNumberInputTokenSymbol` renders the same dependency-free SVG set elsewhere in your UI. Custom visuals take precedence in this order: `prefix`, `icon` (including an image or React node), `symbol`, then the default number symbol. Derived search results reuse the resolved token visual automatically.

### Create Variable Form

The default plus button opens a small variable form with collection, name, and value fields. Collection selection reuses the configured Servly `Dropdown` adapter instead of a native select. The Value field is a recursive `ServlyNumberInputCore` instance with variable creation disabled at that nested level, so it inherits the same hover-only token action, linked preview, unlink behavior, search, grouped libraries, symbols, theme, and sizing without creating an infinite form hierarchy. Choosing another token displays its resolved numeric value and stores a typed `draft.reference` containing `libraryId`, `groupId`, and the full token option. Unlinking or manually editing the resolved value clears that reference. Consumers can use `onTokenUnlink` when they also retain token identity outside the component value.

The form remains intentionally pluggable: use `tokenPicker.createVariable` to supply collections, listen for open/cancel/submit events, return a token to select it immediately, or replace the form entirely. Set `createVariable: false` to hide the default plus action and manual-value creation row.

```tsx
<ServlyNumberInput
  value={width}
  designSystem={acmeScale}
  tokenPicker={{
    createVariable: {
      collections: [{ id: 'ios', label: 'iOS and iPadOS 26' }],
      defaultName: 'Number 2',
      onSubmit: async ({ draft, selectToken, close }) => {
        const token = await saveVariable(draft);
        selectToken({ value: token.name, label: token.name, metaLabel: String(token.value) });
        close();
      },
      renderForm: undefined,
    },
  }}
/>
```

Custom `renderForm` receives `draft`, `collections`, `setDraft`, `onSubmit`, `onCancel`, and `onClose`. Keep custom forms keyboard reachable, keep labels visible, and call `onSubmit` after validating so the package can preserve picker lifecycle events.

## Styling Hooks

Import `@servlyui/number-input/styles.css` for the packaged Servly baseline. You can layer product-specific styles through normal `className`, legacy `inputClassName` / `suffixClassName`, design-system class hooks, or slot-level classes and styles:

The input ships with dark and light themes plus a proportional size scale. `sm` is the original 26px Servly control, while `xs`, `md`, and `lg` scale the prefix, value well, suffix button, dropdown rows, and suggestion popover together.

```tsx
<ServlyNumberInput theme="light" size="md" />
```

Use the provider when a panel or app should share defaults:

```tsx
<ServlyNumberInputProvider theme="dark" size="sm">
  <ServlyNumberInput value={16} unitOfMeasurement="px" />
  <ServlyNumberInput value="md" unitOfMeasurement="tailwind" />
</ServlyNumberInputProvider>
```

Custom themes merge over a dark or light base, so you only need to specify the tokens your product owns. The same variables are passed to suffix dropdowns and suggestion popovers, including AntD portal overlays.

```tsx
const citrusTheme = {
  mode: 'light',
  className: 'citrus-number-theme',
  tokens: {
    background: '#fff7ed',
    text: '#431407',
    accent: '#f97316',
    tokenValueText: '#9a3412',
    overlayBackground: '#fffbeb',
    overlayBorder: '#fdba74',
    optionHoverBackground: '#ffedd5',
  },
} satisfies ServlyNumberInputTheme;

<ServlyNumberInput theme={citrusTheme} size="lg" />;
```

`tokenValueText` is independent from `accent`. The built-in dark theme uses a lighter linked-token blue (`#93c5fd`), while light mode uses a darker blue (`#2563eb`). During prefix traversal, the component captures the idle token pill width and keeps the animated preview at that width until dragging ends.

```tsx
<ServlyNumberInput
  className="panel-number-input"
  classNames={{
    root: 'my-number-root',
    input: 'my-number-input',
    suffix: 'my-number-suffix',
    suggestion: 'my-number-suggestion',
  }}
  styles={{
    root: { width: 120 },
    input: { fontVariantNumeric: 'tabular-nums' },
  }}
/>
```

```tsx
<ServlyNumberInput
  value={120}
  prefixIcon={<WidthIcon aria-hidden="true" />}
  suffixOptionList={[{ value: 'px', type: 'metric', label: 'Pixels' }]}
  unitOfMeasurement="px"
  alwaysShowSuffix
  styles={{ root: { width: 120 } }}
/>
```

Available slots are `root`, `inner`, `control`, `prefixShell`, `prefix`, `hiddenDragArea`, `inputWrap`, `input`, `displayValue`, `suffix`, `suffixLabel`, `suffixCaret`, `suffixOption`, `suffixOptionLabel`, `tokenTrigger`, `tokenIcon`, `tokenPicker`, `tokenPickerRow`, `tokenPickerSection`, `suggestions`, and `suggestion`.

## Display Extensions

The package does not depend on animation libraries. Consumers can add their own display effect through `renderDisplayValue` and the drag lifecycle callbacks.

For example, Text Motion's `slot-text` package can animate the value only while prefix dragging:

```bash
npm install slot-text
```

```tsx
import { SlotText } from 'slot-text/react';
import { chromatic } from 'slot-text';
import 'slot-text/style.css';
import { ServlyNumberInput } from '@servlyui/number-input';

<ServlyNumberInput
  value={width}
  prefixLabelText="W"
  suffixOptionList={suffixes}
  unitOfMeasurement="px"
  renderDisplayValue={(context) =>
    context.isDragging ? (
      <SlotText
        text={String(context.displayValue)}
        options={{
          duration: 125,
          stagger: 5,
          exitOffset: 20,
          bounce: 0.12,
          color: chromatic({ from: 28, spread: 30, saturation: 92, lightness: 58 }),
          colorFade: 220,
          interrupt: true,
        }}
      />
    ) : null
  }
  onValueDragStart={(event) => console.log('drag started', event)}
  onValueDrag={(event) => console.log('drag moved', event.value, event.rawValue)}
  onValueDragEnd={(event) => console.log('drag ended', event)}
/>;
```

The native input stays mounted and editable; `renderDisplayValue` only paints an overlay. This keeps accessibility and form behavior in the component while allowing consumers to bring their own animation dependency.

The renderer receives `value`, `displayValue`, `numericValue`, `unit`, `suffix`, `isDragging`, `isActive`, `isValid`, `isPresetMode`, and `isDesignSystem`.

For high-frequency drag updates, use a small wrapper around `SlotText` that rate-limits only the visual text and shortens `duration` as `numericValue` changes faster. For preset mode, prefer a fixed short duration, a small stagger, `skipUnchanged`, and `interrupt` so token changes feel like status changes rather than raw numeric scrolling. The actual input value should keep updating immediately, while the overlay remains mounted for the whole drag so it is the single visual communication of value changes.

## Refusal States

Dragging beyond `min` / `max`, dragging past the first or last preset, or typing an invalid preset briefly applies `servly-number-input--reject` and emits `onReject`. The packaged CSS shakes the control and flashes a red state without committing a rejected value. Consumers can restyle that class or the slot classes if their design system needs a different refusal treatment.

Reject reasons are `min`, `max`, `preset-start`, `preset-end`, `invalid-preset`, `invalid-number`, and `invalid-custom`.

## Haptics

The styled `ServlyNumberInput` enables directional audio haptics by default. Set `haptics={false}` to silence one input. The adapter-driven `ServlyNumberInputCore` remains silent and dependency-free.

Import the extension directly when a product needs custom assets, envelope, or speed shaping; disable the built-in wiring to avoid composing the same sound twice.

```tsx
import { ServlyNumberInput } from '@servlyui/number-input';
import {
  DEFAULT_SERVLY_NUMBER_INPUT_HAPTIC_ASSETS,
  useServlyNumberInputHaptics,
} from '@servlyui/number-input/haptics';

const haptics = useServlyNumberInputHaptics({
  enabled,
  assets: DEFAULT_SERVLY_NUMBER_INPUT_HAPTIC_ASSETS,
  envelope: {
    attackMs: 8,
    holdMs: 24,
    releaseMs: 90,
    gain: 0.45,
  },
  speed: {
    windowMs: 140,
    minIntervalMs: 34,
    maxIntervalMs: 120,
    minPlaybackRate: 0.92,
    maxPlaybackRate: 1.12,
  },
});

<ServlyNumberInput
  haptics={false}
  {...haptics.handlers}
  value={value}
  onChange={(event) => setValue(event.value)}
/>;
```

The extension uses the browser Web Audio API, lazy-creates the audio context from drag/focus-driven events, caches decoded MP3 buffers, and no-ops safely when audio is unavailable. Consumers can override any default asset URL:

```tsx
useServlyNumberInputHaptics({
  assets: {
    increase: '/sounds/add.mp3',
    decrease: '/sounds/subtract.mp3',
    minimum: '/sounds/min.mp3',
    maximum: '/sounds/max.mp3',
    error: '/sounds/error.mp3',
  },
});
```

The hook uses `increase` and `decrease` for all value movement, including raw numbers and design-system presets. The older `number` and `preset` engine kinds are accepted as compatibility aliases, but new integrations should use directional assets.

When composing with your own drag or reject handlers, call both:

```tsx
<ServlyNumberInput
  onValueDrag={(event) => {
    haptics.handlers.onValueDrag?.(event);
    userOnValueDrag?.(event);
  }}
  onReject={(event) => {
    haptics.handlers.onReject?.(event);
    userOnReject?.(event);
  }}
/>;
```

## Migration From ServlyInput

- Rename imports/usages from `ServlyInput` to `ServlyNumberInput`.
- Use `allowCustomValue` instead of `allowText`.
- `allowText` is still accepted as a deprecated compatibility alias.
- Portal `SectionHoverContext` is not imported. Use `ServlyNumberInputProvider`, `isSectionHovered`, or `alwaysShowSuffix`.
- Tailwind-specific fields are now generic: use `isDesignSystem` and `designSystem`; `isTailwind` remains as a deprecated alias.
- The package emits a Servly-style change payload shape: `value`, `numericValue`, `unit`, `isDesignSystem`, `designSystem`, `isTailwind`, and `isDragOperation`.

## Development

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run pack:dry-run
```
