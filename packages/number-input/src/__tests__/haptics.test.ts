import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import {
  createServlyNumberInputHapticEngine,
  getServlyNumberInputHapticKindForRejectReason,
  useServlyNumberInputHaptics,
} from '../haptics';
import type { ServlyNumberInputValueDragEvent } from '../types';

class FakeAudioParam {
  cancelScheduledValues = vi.fn();
  setValueAtTime = vi.fn();
  linearRampToValueAtTime = vi.fn();
}

class FakeGainNode {
  gain = new FakeAudioParam();
  connect = vi.fn();
}

class FakeBufferSource {
  buffer: AudioBuffer | null = null;
  playbackRate = new FakeAudioParam();
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
  onended: (() => void) | null = null;
}

class FakeAudioContext {
  state: AudioContextState = 'suspended';
  currentTime = 1;
  destination = {};
  decodedBuffer = { duration: 0.2 } as AudioBuffer;
  gains: FakeGainNode[] = [];
  sources: FakeBufferSource[] = [];
  resume = vi.fn(async () => {
    this.state = 'running';
  });
  close = vi.fn();
  decodeAudioData = vi.fn(async () => this.decodedBuffer);
  createGain = vi.fn(() => {
    const gain = new FakeGainNode();
    this.gains.push(gain);
    return gain;
  });
  createBufferSource = vi.fn(() => {
    const source = new FakeBufferSource();
    this.sources.push(source);
    return source;
  });
}

const createFetcher = () =>
  vi.fn(async () => ({
    arrayBuffer: async () => new ArrayBuffer(8),
  })) as unknown as typeof fetch;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ServlyNumberInput haptics', () => {
  const createDragEvent = (
    value: string | number,
    numericValue: number,
    displayValue: string | number = value
  ): ServlyNumberInputValueDragEvent => ({
    value,
    displayValue,
    numericValue,
    unit: 'px',
    suffix: 'px',
    isDragging: true,
    isActive: false,
    isValid: true,
    isPresetMode: false,
    isDesignSystem: false,
    phase: 'move',
  });

  it('only plays drag haptics when the displayed value interval changes', async () => {
    const audioContext = new FakeAudioContext();
    const { result } = renderHook(() =>
      useServlyNumberInputHaptics({
        audioContext: audioContext as unknown as AudioContext,
        fetcher: createFetcher(),
        assets: { increase: '/increase.mp3' },
        speed: { minIntervalMs: 0, maxIntervalMs: 0 },
      })
    );

    await act(async () => {
      result.current.handlers.onValueDragStart?.({ ...createDragEvent(0, 0), phase: 'start' });
      result.current.handlers.onValueDrag?.(createDragEvent(0.5, 0.5));
      result.current.handlers.onValueDrag?.(createDragEvent(0.5, 0.54));
      result.current.handlers.onValueDrag?.(createDragEvent(1, 1));
    });

    await waitFor(() => expect(audioContext.sources).toHaveLength(2));
  });

  it('does not play when token identity changes but the displayed interval stays the same', async () => {
    const audioContext = new FakeAudioContext();
    const { result } = renderHook(() =>
      useServlyNumberInputHaptics({
        audioContext: audioContext as unknown as AudioContext,
        fetcher: createFetcher(),
        assets: { increase: '/increase.mp3' },
        speed: { minIntervalMs: 0, maxIntervalMs: 0 },
      })
    );

    await act(async () => {
      result.current.handlers.onValueDragStart?.({ ...createDragEvent('preset-a', 4, 4), phase: 'start' });
      result.current.handlers.onValueDrag?.(createDragEvent('preset-b', 4, 4));
      result.current.handlers.onValueDrag?.(createDragEvent('preset-c', 8, 8));
    });

    await waitFor(() => expect(audioContext.sources).toHaveLength(1));
  });

  it('loads and caches haptic assets per kind', async () => {
    const audioContext = new FakeAudioContext();
    const fetcher = createFetcher();
    const engine = createServlyNumberInputHapticEngine({
      audioContext: audioContext as unknown as AudioContext,
      fetcher,
      assets: { increase: '/increase.mp3' },
      speed: { minIntervalMs: 0, maxIntervalMs: 0 },
    });

    await engine.play('increase', { numericValue: 1, timestamp: 0 });
    await engine.play('increase', { numericValue: 2, timestamp: 200 });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(audioContext.decodeAudioData).toHaveBeenCalledTimes(1);
    expect(audioContext.sources).toHaveLength(2);
    expect(engine.getState().loadedKinds).toEqual(['increase']);
  });

  it('applies envelope gain scheduling and playback-rate shaping', async () => {
    const audioContext = new FakeAudioContext();
    const engine = createServlyNumberInputHapticEngine({
      audioContext: audioContext as unknown as AudioContext,
      fetcher: createFetcher(),
      assets: { increase: '/increase.mp3' },
      envelope: { attackMs: 10, holdMs: 20, releaseMs: 30, gain: 0.5 },
      speed: { minIntervalMs: 0, maxIntervalMs: 0, minPlaybackRate: 0.9, maxPlaybackRate: 1.1 },
    });

    await engine.play('increase', { numericValue: 1, timestamp: 0 });
    await engine.play('increase', { numericValue: 901, timestamp: 1000 });

    const gain = audioContext.gains[1].gain;
    expect(gain.setValueAtTime).toHaveBeenCalledWith(0, 1);
    expect(gain.linearRampToValueAtTime).toHaveBeenCalledWith(expect.any(Number), 1.01);
    expect(gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, 1.06);
    expect(audioContext.sources[1].playbackRate.setValueAtTime).toHaveBeenCalledWith(1.1, 1);
  });

  it('throttles rapid repeated haptics', async () => {
    const audioContext = new FakeAudioContext();
    const engine = createServlyNumberInputHapticEngine({
      audioContext: audioContext as unknown as AudioContext,
      fetcher: createFetcher(),
      assets: { decrease: '/decrease.mp3' },
      speed: { minIntervalMs: 50, maxIntervalMs: 100 },
    });

    await engine.play('decrease', { steps: -1, timestamp: 0 });
    await engine.play('decrease', { steps: -1, timestamp: 10 });

    expect(audioContext.sources).toHaveLength(1);
  });

  it('treats legacy number and preset kinds as increase aliases', async () => {
    const audioContext = new FakeAudioContext();
    const fetcher = createFetcher();
    const engine = createServlyNumberInputHapticEngine({
      audioContext: audioContext as unknown as AudioContext,
      fetcher,
      assets: { increase: '/increase.mp3' },
      speed: { minIntervalMs: 0, maxIntervalMs: 0 },
    });

    await engine.play('number', { numericValue: 1, timestamp: 0 });
    await engine.play('preset', { steps: 1, timestamp: 200 });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(engine.getState().loadedKinds).toEqual(['increase']);
  });

  it('maps reject reasons to minimum, maximum, and error sounds', () => {
    expect(getServlyNumberInputHapticKindForRejectReason('min')).toBe('minimum');
    expect(getServlyNumberInputHapticKindForRejectReason('preset-start')).toBe('minimum');
    expect(getServlyNumberInputHapticKindForRejectReason('max')).toBe('maximum');
    expect(getServlyNumberInputHapticKindForRejectReason('preset-end')).toBe('maximum');
    expect(getServlyNumberInputHapticKindForRejectReason('invalid-preset')).toBe('error');
  });

  it('disposes active sources and clears loaded state', async () => {
    const audioContext = new FakeAudioContext();
    const engine = createServlyNumberInputHapticEngine({
      audioContext: audioContext as unknown as AudioContext,
      fetcher: createFetcher(),
      assets: { increase: '/increase.mp3' },
    });

    await engine.play('increase', { numericValue: 1, timestamp: 0 });
    engine.dispose();

    expect(audioContext.sources[0].stop).toHaveBeenCalled();
    expect(engine.getState().loadedKinds).toEqual([]);
  });

  it('no-ops when disabled or unsupported', async () => {
    const audioContext = new FakeAudioContext();
    const disabledFetcher = createFetcher();
    const disabledEngine = createServlyNumberInputHapticEngine({
      enabled: false,
      audioContext: audioContext as unknown as AudioContext,
      fetcher: disabledFetcher,
    });

    await disabledEngine.play('increase');
    expect(disabledFetcher).not.toHaveBeenCalled();

    const unsupportedFetcher = createFetcher();
    vi.stubGlobal('AudioContext', undefined);
    vi.stubGlobal('webkitAudioContext', undefined);
    const unsupportedEngine = createServlyNumberInputHapticEngine({ fetcher: unsupportedFetcher });

    await unsupportedEngine.play('increase');
    expect(unsupportedFetcher).not.toHaveBeenCalled();
  });
});
