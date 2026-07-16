import { describe, expect, it } from 'vitest';
import { antdServlyNumberInputAdapters, createAntdServlyNumberInputAdapters } from '../adapters/antd';

describe('AntD adapter entrypoint', () => {
  it('creates a complete adapter set', () => {
    const created = createAntdServlyNumberInputAdapters();

    expect(created.Tooltip).toBeTypeOf('function');
    expect(created.Popover).toBeTypeOf('function');
    expect(created.Dropdown).toBeTypeOf('function');
    expect(created.DraggableNumberInput).toBeTypeOf('function');
    expect(created.CaretDownIcon).toBeTypeOf('function');
    expect(created.CheckIcon).toBeTypeOf('function');
    expect(created.CloseIcon).toBeTypeOf('function');
    expect(antdServlyNumberInputAdapters.Tooltip).toBeTypeOf('function');
  });
});
