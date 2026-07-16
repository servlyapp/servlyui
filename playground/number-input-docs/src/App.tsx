import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SlotText } from 'slot-text/react';
import { chromatic, type SlotOptions } from 'slot-text';
import {
  ServlyNumberInput,
  ServlyNumberInputProvider,
  type ServlyNumberInputChangeEvent,
  type ServlyNumberInputDesignSystem,
  type ServlyNumberInputDisplayValueContext,
  type ServlyNumberInputSize,
  type ServlyNumberInputSuffixOption,
  type ServlyNumberInputTheme,
} from '@servlyui/number-input';

type LogEntry = {
  id: number;
  source: string;
  value: string;
  unit: string;
  numericValue: number;
  designSystem: string;
};

const metricSuffixes: ServlyNumberInputSuffixOption[] = [
  { value: 'px', type: 'metric', label: 'Pixels' },
  { value: 'rem', type: 'metric', label: 'REM' },
  { value: 'em', type: 'metric', label: 'EM' },
  { value: '%', type: 'metric', label: 'Percent' },
];

const mixedSuffixes: ServlyNumberInputSuffixOption[] = [
  ...metricSuffixes,
  { value: 'tailwind', type: 'option', label: 'Tailwind', marker: 'TW', metaLabel: 'Spacing token' },
  { value: 'auto', type: 'keyword', label: 'Auto', metaLabel: 'Tailwind keyword' },
  { value: 'full', type: 'keyword', label: 'Full', metaLabel: 'Tailwind keyword' },
];

const numberSuffixes: ServlyNumberInputSuffixOption[] = [
  { value: '#', type: 'number', label: 'Number' },
  { value: 'px', type: 'metric', label: 'Pixels' },
];

const acmeDesignSystem: ServlyNumberInputDesignSystem = {
  id: 'acme',
  label: 'Acme',
  presetMap: { xs: 4, sm: 8, md: 16, lg: 32, xl: 48, hero: 72, top: 27, bottom: 62, opacity: 60 },
  keywords: ['fluid', 'content'],
  libraries: [
    {
      id: 'ios-26',
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
        {
          id: 'glass',
          label: 'Liquid Glass',
          tokens: [
            { value: 'hero', label: 'Blur Radius', numericValue: 72, metaLabel: '72', symbol: 'radius' },
            {
              value: 'opacity',
              label: 'Opacity',
              numericValue: 60,
              metaLabel: '60',
              symbol: 'opacity',
              icon: <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" alt="Acme opacity" />,
            },
          ],
        },
      ],
    },
  ],
  defaultPreset: 'md',
  marker: 'A',
  metaLabel: 'Acme token',
  className: 'acme-number-input',
  inputClassName: 'acme-number-input__field',
  suffixClassName: 'acme-number-input__suffix',
  suggestionClassName: 'acme-number-input__suggestion',
};

const acmeSuffixes: ServlyNumberInputSuffixOption[] = [
  { value: 'px', type: 'metric', label: 'Pixels' },
  { value: 'rem', type: 'metric', label: 'REM' },
  { value: 'acme', type: 'design-system', label: 'Acme', marker: 'A', metaLabel: 'Design token' },
  { value: 'fluid', type: 'keyword', label: 'Fluid', metaLabel: 'Acme keyword' },
  { value: 'content', type: 'keyword', label: 'Content', metaLabel: 'Acme keyword' },
];

const codeSample = `<ServlyNumberInput
  value={value}
  suffixOptionList={suffixes}
  designSystem={acmeDesignSystem}
  theme="light"
  size="md"
  haptics={hapticsEnabled}
  classNames={{ root: 'token-input', suffix: 'token-suffix' }}
  styles={{ root: { width: 156 } }}
  renderDisplayValue={(context) => <AdaptiveSlotDisplay context={context} />}
  onChange={(event) => setValue(event.value)}
/>`;

const orangeChromatic = chromatic({ from: 28, spread: 30, saturation: 92, lightness: 58 });

const customPlaygroundTheme: ServlyNumberInputTheme = {
  mode: 'light',
  className: 'citrus-number-theme',
  tokens: {
    background: '#fff7ed',
    backgroundHover: '#ffedd5',
    filterBackground: '#fed7aa',
    text: '#431407',
    mutedText: '#9a3412',
    fieldBorder: '#fdba74',
    valuePillBackground: '#ffffff',
    valuePillBorder: '#fed7aa',
    selectedTextBackground: '#fed7aa',
    tokenValueText: '#9a3412',
    activeBorder: '#ea580c',
    invalidBorder: '#dc2626',
    accent: '#f97316',
    tokenIcon: '#9a3412',
    tokenIconHover: '#431407',
    overlayBackground: '#fffbeb',
    overlayBorder: '#fdba74',
    overlayShadow: '0 12px 28px rgba(154, 52, 18, 0.18)',
    optionBackground: '#fff7ed',
    optionHoverBackground: '#ffedd5',
    pickerRowHoverBackground: '#ffedd5',
    pickerSectionText: '#7c2d12',
    pickerMutedValueText: '#c2410c',
    selectedRing: '#f97316',
    dangerText: '#b91c1c',
  },
};

const getPresetSlotOptions = (direction: SlotOptions['direction']): SlotOptions => ({
  direction,
  duration: 120,
  stagger: 14,
  exitOffset: 22,
  bounce: 0.1,
  color: orangeChromatic,
  colorFade: 220,
  skipUnchanged: true,
  interrupt: true,
});

const getAdaptiveSlotOptions = (speed: number, direction: SlotOptions['direction'], isPresetMode: boolean): SlotOptions => {
  if (isPresetMode) return getPresetSlotOptions(direction);

  if (speed > 900) {
    return {
      direction,
      duration: 95,
      stagger: 3,
      exitOffset: 14,
      bounce: 0.08,
      color: orangeChromatic,
      colorFade: 180,
      skipUnchanged: true,
      interrupt: true,
    };
  }

  if (speed > 250) {
    return {
      direction,
      duration: 125,
      stagger: 5,
      exitOffset: 20,
      bounce: 0.12,
      color: orangeChromatic,
      colorFade: 220,
      skipUnchanged: true,
      interrupt: true,
    };
  }

  return {
    direction,
    duration: 170,
    stagger: 8,
    exitOffset: 28,
    bounce: 0.18,
    color: orangeChromatic,
    colorFade: 260,
    skipUnchanged: true,
    interrupt: true,
  };
};

const idleSlotOptions: SlotOptions = {
  direction: 'down',
  duration: 180,
  stagger: 8,
  exitOffset: 28,
  bounce: 0.2,
  color: orangeChromatic,
  colorFade: 220,
  skipUnchanged: true,
  interrupt: true,
};

function AdaptiveSlotDisplay({
  context,
  forcePreview = false,
}: {
  context: ServlyNumberInputDisplayValueContext;
  forcePreview?: boolean;
}) {
  const incomingText = String(context.displayValue);
  const [visualText, setVisualText] = useState(incomingText);
  const [options, setOptions] = useState<SlotOptions>(idleSlotOptions);
  const lastCommitRef = useRef({
    text: incomingText,
    value: context.numericValue,
    time: performance.now(),
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const now = performance.now();
    const nextValue = context.numericValue;
    const elapsed = Math.max(1, now - lastCommitRef.current.time);
    const delta = nextValue - lastCommitRef.current.value;
    const textChanged = incomingText !== lastCommitRef.current.text;
    const speed = Math.abs(delta) > 0 ? Math.abs(delta) / (elapsed / 1000) : textChanged ? (context.isPresetMode ? 420 : 280) : 0;
    const nextOptions = context.isDragging
      ? getAdaptiveSlotOptions(speed, delta >= 0 ? 'up' : 'down', context.isPresetMode)
      : idleSlotOptions;

    const commit = () => {
      setOptions(nextOptions);
      setVisualText(incomingText);
      lastCommitRef.current = {
        text: incomingText,
        value: nextValue,
        time: performance.now(),
      };
    };

    if (!context.isDragging || forcePreview) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      commit();
      return;
    }

    if (!textChanged) return;

    const minimumFrameMs = context.isPresetMode ? 72 : speed > 900 ? 34 : speed > 250 ? 44 : 58;
    const wait = minimumFrameMs - elapsed;

    if (wait <= 0) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      commit();
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(commit, wait);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [context.isDragging, context.isPresetMode, context.numericValue, forcePreview, incomingText]);

  return <SlotText className="slot-display-text" text={visualText} options={options} />;
}

export function App() {
  const [width, setWidth] = useState<string | number>(16.5);
  const [spacing, setSpacing] = useState<string | number>('4');
  const [acmeToken, setAcmeToken] = useState<string | number>('md');
  const [figmaWidth, setFigmaWidth] = useState<string | number>(947);
  const [figmaToken, setFigmaToken] = useState<string | number>('bottom');
  const [integerCount, setIntegerCount] = useState<string | number>(8);
  const [decimalRatio, setDecimalRatio] = useState<string | number>(1.25);
  const [iconWidth, setIconWidth] = useState<string | number>(120);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [demoTheme, setDemoTheme] = useState<'dark' | 'light' | 'custom'>('dark');
  const [demoSize, setDemoSize] = useState<ServlyNumberInputSize>('sm');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const selectedTheme = demoTheme === 'custom' ? customPlaygroundTheme : demoTheme;

  const handleChange = (source: string, setter: (value: string | number) => void) => (event: ServlyNumberInputChangeEvent) => {
    setter(event.value === '' ? '' : event.value);
    setLogs((currentLogs) => [
      {
        id: Date.now() + Math.random(),
        source,
        value: String(event.value),
        unit: event.unit || '-',
        numericValue: event.numericValue,
        designSystem: event.designSystem || (event.isDesignSystem ? 'default' : '-'),
      },
      ...currentLogs,
    ].slice(0, 6));
  };
  const handleCreateVariable = (source: string) => ({ draft }: { draft: { name: string; value: string | number | '' } }) => {
    const tokenName = draft.name.trim() || `number-${String(draft.value)}`;
    setLogs((currentLogs) => [
      {
        id: Date.now() + Math.random(),
        source,
        value: tokenName,
        unit: 'variable',
        numericValue: Number.parseFloat(String(draft.value)) || 0,
        designSystem: 'created',
      },
      ...currentLogs,
    ].slice(0, 6));
    return { value: tokenName, label: tokenName, metaLabel: String(draft.value) };
  };

  const renderSlotDisplay = useCallback(
    (context: ServlyNumberInputDisplayValueContext) => {
      return context.isDragging ? <AdaptiveSlotDisplay context={context} /> : null;
    },
    []
  );

  const computedPreview = useMemo(
    () => ({
      width: typeof width === 'number' ? `${width}px` : String(width || '0'),
      padding: typeof spacing === 'number' ? `${spacing}px` : `${spacing}`,
      acme: String(acmeToken || 'md'),
      count: String(integerCount || 0),
      ratio: String(decimalRatio || 0),
    }),
    [acmeToken, decimalRatio, integerCount, spacing, width]
  );

  return (
    <main className="docs-shell">
      <aside className="docs-sidebar">
        <div>
          <p className="eyebrow">Servly UI</p>
          <h1>Number Input</h1>
        </div>
        <nav aria-label="Demo sections">
          <a href="#metric">Metric</a>
          <a href="#design-system">Design system</a>
          <a href="#numbers">Number modes</a>
          <a href="#styling">Styling hooks</a>
        </nav>
      </aside>

      <section className="docs-content">
        <header className="docs-header">
          <div>
            <p className="eyebrow">Local package demo</p>
            <h2>Test ServlyNumberInput without publishing</h2>
          </div>
          <div className="status-strip" aria-label="Package status">
            <span>Source alias</span>
            <strong>@servlyui/number-input</strong>
          </div>
          <label className="slot-preview-control">
            <input
              type="checkbox"
              checked={hapticsEnabled}
              onChange={(event) => setHapticsEnabled(event.target.checked)}
            />
            <span>Haptics</span>
          </label>
          <div className="control-cluster" aria-label="Theme and size controls">
            <div className="segmented-control" aria-label="Theme">
              {(['dark', 'light', 'custom'] as const).map((themeOption) => (
                <button
                  key={themeOption}
                  type="button"
                  className={demoTheme === themeOption ? 'is-selected' : undefined}
                  onClick={() => setDemoTheme(themeOption)}
                >
                  {themeOption}
                </button>
              ))}
            </div>
            <div className="segmented-control" aria-label="Size">
              {(['xs', 'sm', 'md', 'lg'] as const).map((sizeOption) => (
                <button
                  key={sizeOption}
                  type="button"
                  className={demoSize === sizeOption ? 'is-selected' : undefined}
                  onClick={() => setDemoSize(sizeOption)}
                >
                  {sizeOption}
                </button>
              ))}
            </div>
          </div>
        </header>

        <ServlyNumberInputProvider theme={selectedTheme} size={demoSize}>
          <section className="demo-grid" aria-label="Interactive examples">
            <article className="demo-card" id="metric">
            <div className="demo-card__header">
              <div>
                <p className="eyebrow">CSS units</p>
                <h3>Metric value</h3>
              </div>
              <span className="pill">decimal ready</span>
            </div>
            <ServlyNumberInput
              value={width}
              prefixLabelText="W"
              suffixOptionList={mixedSuffixes}
              unitOfMeasurement="px"
              alwaysShowSuffix
              min={0}
              max={640}
              step={0.5}
              haptics={hapticsEnabled}
              onChange={handleChange('Metric width', setWidth)}
              renderDisplayValue={renderSlotDisplay}
              classNames={{ root: 'demo-number-input' }}
            />
            <p className="field-note">Drag the W prefix horizontally to show the animated value overlay.</p>
          </article>

          <article className="demo-card">
            <div className="demo-card__header">
              <div>
                <p className="eyebrow">Tailwind default</p>
                <h3>Preset spacing</h3>
              </div>
              <span className="pill pill--green">tokens</span>
            </div>
            <ServlyNumberInput
              value={spacing}
              prefixLabelText="P"
              suffixOptionList={mixedSuffixes}
              unitOfMeasurement="tailwind"
              alwaysShowSuffix
              haptics={hapticsEnabled}
              onChange={handleChange('Tailwind spacing', setSpacing)}
              renderDisplayValue={renderSlotDisplay}
              classNames={{ root: 'demo-number-input' }}
            />
            <p className="field-note">Drag the P prefix horizontally to traverse tokens with the same display extension.</p>
          </article>

          <article className="demo-card demo-card--wide">
            <div className="demo-card__header">
              <div>
                <p className="eyebrow">Theme surface</p>
                <h3>Dropdown and suggestions</h3>
              </div>
              <span className="pill pill--orange">{demoTheme} / {demoSize}</span>
            </div>
            <ServlyNumberInput
              value={spacing}
              prefixLabelText="T"
              suffixOptionList={mixedSuffixes}
              unitOfMeasurement="tailwind"
              alwaysShowSuffix
              haptics={hapticsEnabled}
              onChange={handleChange('Theme surface', setSpacing)}
              renderDisplayValue={renderSlotDisplay}
              classNames={{ root: 'demo-number-input demo-number-input--wide' }}
            />
            <p className="field-note">Open the suffix dropdown or press Ctrl Space while focused; both overlays follow the selected theme.</p>
          </article>

          <article className="demo-card demo-card--wide figma-demo-card">
            <div className="demo-card__header">
              <div>
                <p className="eyebrow">Figma style</p>
                <h3>Variable token input</h3>
              </div>
              <span className="pill pill--green">token picker</span>
            </div>
            <div className="figma-demo-stack">
              <ServlyNumberInput
                value={figmaWidth}
                prefixLabelText="W"
                suffixOptionList={acmeSuffixes}
                unitOfMeasurement="px"
                designSystem={acmeDesignSystem}
                theme="light"
                size="md"
                alwaysShowSuffix
                tokenPicker={{
                  libraryControl: 'dropdown',
                  closeBehavior: 'selection',
                  maxSearchItems: 2,
                  createVariable: {
                    defaultName: 'Number 2',
                    onSubmit: handleCreateVariable('Figma variable'),
                  },
                }}
                min={0}
                max={1200}
                haptics={hapticsEnabled}
                onChange={handleChange('Figma width', setFigmaWidth)}
                renderDisplayValue={renderSlotDisplay}
                classNames={{ root: 'figma-number-input' }}
              />
              <ServlyNumberInput
                value={figmaToken}
                prefixLabelText="W"
                suffixOptionList={acmeSuffixes}
                unitOfMeasurement="acme"
                designSystem={acmeDesignSystem}
                theme="light"
                size="md"
                alwaysShowSuffix
                tokenPicker={{
                  libraryControl: 'dropdown',
                  closeBehavior: 'selection',
                  maxSearchItems: 2,
                  showSearchItems: 'auto',
                }}
                haptics={hapticsEnabled}
                onChange={handleChange('Figma token', setFigmaToken)}
                renderDisplayValue={renderSlotDisplay}
                classNames={{ root: 'figma-number-input' }}
              />
            </div>
            <p className="field-note">The picker closes after token selection, supports semantic symbols, and clears search with Escape or the inline clear icon.</p>
          </article>

          <article className="demo-card demo-card--wide" id="design-system">
            <div className="demo-card__header">
              <div>
                <p className="eyebrow">Injected scale</p>
                <h3>Custom design system</h3>
              </div>
              <span className="pill pill--orange">Acme tokens</span>
            </div>
            <ServlyNumberInput
              value={acmeToken}
              prefixLabelText="G"
              suffixOptionList={acmeSuffixes}
              unitOfMeasurement="acme"
              designSystem={acmeDesignSystem}
              alwaysShowSuffix
              haptics={hapticsEnabled}
              onChange={handleChange('Acme token', setAcmeToken)}
              renderDisplayValue={renderSlotDisplay}
              classNames={{ root: 'demo-number-input acme-doc-input', suffix: 'acme-doc-suffix' }}
              styles={{ root: { maxWidth: 220 } }}
            />
            <p className="field-note">This field uses named tokens like xs, sm, md, lg, plus Acme keywords.</p>
          </article>

          <article className="demo-card" id="numbers">
            <div className="demo-card__header">
              <div>
                <p className="eyebrow">Strict mode</p>
                <h3>Integer value</h3>
              </div>
              <span className="pill">integer</span>
            </div>
            <ServlyNumberInput
              value={integerCount}
              prefixLabelText="N"
              suffixOptionList={numberSuffixes}
              unitOfMeasurement="#"
              numberMode="integer"
              alwaysShowSuffix
              min={0}
              max={99}
              haptics={hapticsEnabled}
              onChange={handleChange('Integer count', setIntegerCount)}
              renderDisplayValue={renderSlotDisplay}
              classNames={{ root: 'demo-number-input' }}
            />
            <p className="field-note">Decimals are rejected here because numberMode is set to integer.</p>
          </article>

          <article className="demo-card">
            <div className="demo-card__header">
              <div>
                <p className="eyebrow">Default mode</p>
                <h3>Decimal value</h3>
              </div>
              <span className="pill pill--green">any</span>
            </div>
            <ServlyNumberInput
              value={decimalRatio}
              prefixLabelText="R"
              suffixOptionList={numberSuffixes}
              unitOfMeasurement="#"
              numberMode="any"
              alwaysShowSuffix
              min={-10}
              max={10}
              step={0.25}
              haptics={hapticsEnabled}
              onChange={handleChange('Decimal ratio', setDecimalRatio)}
              renderDisplayValue={renderSlotDisplay}
              classNames={{ root: 'demo-number-input' }}
            />
            <p className="field-note">The raw number suffix accepts integers and decimals by default.</p>
          </article>

          <article className="demo-card" id="styling-example">
            <div className="demo-card__header">
              <div>
                <p className="eyebrow">Icon prefix</p>
                <h3>Fixed 120px input</h3>
              </div>
              <span className="pill pill--orange">120px</span>
            </div>
            <ServlyNumberInput
              value={iconWidth}
              prefixIcon={
                <svg className="icon-prefix-example" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M2.25 8h11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  <path d="M4.75 5.5 2.25 8l2.5 2.5M11.25 5.5l2.5 2.5-2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6.5 3.25h3M6.5 12.75h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              }
              suffixOptionList={acmeSuffixes}
              unitOfMeasurement="px"
              designSystem={acmeDesignSystem}
              alwaysShowSuffix
              min={0}
              max={400}
              step={1}
              haptics={hapticsEnabled}
              onChange={handleChange('Icon prefix width', setIconWidth)}
              renderDisplayValue={renderSlotDisplay}
              classNames={{ root: 'icon-prefix-number-input' }}
              styles={{ root: { width: 120 } }}
            />
            <p className="field-note">Uses `prefixIcon`, token linking, and a root width of 120px to show compact layout behavior.</p>
          </article>

          <article className="demo-card demo-card--wide">
            <div className="demo-card__header">
              <div>
                <p className="eyebrow">Responsive token action</p>
                <h3>Compact width comparison</h3>
              </div>
              <span className="pill pill--green">xs / sm / md / lg</span>
            </div>
            <div className="compact-width-comparison">
              {([120, 130] as const).map((controlWidth) => (
                <div className="compact-width-row" key={controlWidth}>
                  <strong>{controlWidth}px</strong>
                  <div className="compact-size-grid">
                    {(['xs', 'sm', 'md', 'lg'] as const).map((sizeOption) => (
                      <label key={sizeOption} className="compact-size-sample">
                        <span>{sizeOption}</span>
                        <ServlyNumberInput
                          value={iconWidth}
                          prefixLabelText="P"
                          suffixOptionList={acmeSuffixes}
                          unitOfMeasurement="px"
                          designSystem={acmeDesignSystem}
                          size={sizeOption}
                          alwaysShowSuffix
                          haptics={hapticsEnabled}
                          onChange={handleChange(`Responsive ${controlWidth}px ${sizeOption}`, setIconWidth)}
                          renderDisplayValue={renderSlotDisplay}
                          classNames={{ root: 'compact-preset-input' }}
                          styles={{ root: { width: controlWidth } }}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="field-note">At compact widths, md and lg move “Apply variable” into the suffix menu while xs and sm keep the inline trigger when it still fits.</p>
          </article>
          </section>
        </ServlyNumberInputProvider>

        <section className="preview-band" aria-label="Live preview">
          <div className="preview-band__main">
            <p className="eyebrow">Live output</p>
            <div
              className="preview-object"
              style={{
                width: typeof width === 'number' ? Math.max(80, Math.min(width * 4, 520)) : 180,
                padding: typeof spacing === 'number' ? Math.max(8, spacing) : 20,
              }}
            >
              <span>{computedPreview.acme}</span>
            </div>
          </div>
          <dl className="preview-metrics">
            <div>
              <dt>Width</dt>
              <dd>{computedPreview.width}</dd>
            </div>
            <div>
              <dt>Spacing</dt>
              <dd>{computedPreview.padding}</dd>
            </div>
            <div>
              <dt>Count</dt>
              <dd>{computedPreview.count}</dd>
            </div>
            <div>
              <dt>Ratio</dt>
              <dd>{computedPreview.ratio}</dd>
            </div>
          </dl>
        </section>

        <section className="reference-grid" id="styling">
          <article className="reference-panel">
            <p className="eyebrow">Styling hooks</p>
            <h3>Slot classes and styles</h3>
            <p>
              The playground uses `classNames`, `styles`, and an injected `designSystem` to show how another product can layer its own UI
              language on top of the packaged Servly styles.
            </p>
            <pre><code>{codeSample}</code></pre>
          </article>

          <article className="reference-panel">
            <p className="eyebrow">Change events</p>
            <h3>Recent output</h3>
            <div className="event-log" role="log" aria-live="polite">
              {logs.length === 0 ? (
                <p className="empty-log">Interact with any field to see event payloads.</p>
              ) : (
                logs.map((log) => (
                  <div className="event-row" key={log.id}>
                    <strong>{log.source}</strong>
                    <span>value {log.value}</span>
                    <span>unit {log.unit}</span>
                    <span>numeric {log.numericValue}</span>
                    <span>system {log.designSystem}</span>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
