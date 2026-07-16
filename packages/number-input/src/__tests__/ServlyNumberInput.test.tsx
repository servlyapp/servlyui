import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { useServlyNumberInputHaptics } = vi.hoisted(() => ({
  useServlyNumberInputHaptics: vi.fn(() => ({
    engine: {},
    handlers: {},
  })),
}));

vi.mock('../extensions/haptics/react', () => ({ useServlyNumberInputHaptics }));

import { ServlyNumberInput } from '../ServlyNumberInput';

describe('ServlyNumberInput styled entrypoint', () => {
  it('enables built-in haptics by default and supports opting out', () => {
    const { rerender } = render(<ServlyNumberInput value={12} />);

    expect(useServlyNumberInputHaptics).toHaveBeenLastCalledWith({ enabled: true });

    rerender(<ServlyNumberInput value={12} haptics={false} />);

    expect(useServlyNumberInputHaptics).toHaveBeenLastCalledWith({ enabled: false });
  });
});
