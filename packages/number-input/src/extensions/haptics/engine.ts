import { DEFAULT_SERVLY_NUMBER_INPUT_HAPTIC_ASSETS } from './assets';
import type {
  ServlyNumberInputHapticAsset,
  ServlyNumberInputHapticAssets,
  ServlyNumberInputHapticEngine,
  ServlyNumberInputHapticEngineOptions,
  ServlyNumberInputHapticEnvelope,
  ServlyNumberInputHapticKind,
  ServlyNumberInputHapticPlayEvent,
  ServlyNumberInputHapticSpeed,
} from './types';
import type { ServlyNumberInputRejectReason } from '../../types';

const DEFAULT_ENVELOPE: ServlyNumberInputHapticEnvelope = {
  attackMs: 8,
  holdMs: 24,
  releaseMs: 90,
  gain: 0.45,
};

const DEFAULT_SPEED: ServlyNumberInputHapticSpeed = {
  windowMs: 140,
  minIntervalMs: 34,
  maxIntervalMs: 120,
  minPlaybackRate: 0.92,
  maxPlaybackRate: 1.12,
  compoundSpeed: 900,
  minGainMultiplier: 0.72,
  maxGainMultiplier: 1.16,
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

const getAudioContextConstructor = () => {
  if (typeof globalThis === 'undefined') return undefined;
  return globalThis.AudioContext || (globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
};

const isAudioBuffer = (asset: ServlyNumberInputHapticAsset): asset is AudioBuffer =>
  typeof AudioBuffer !== 'undefined' && asset instanceof AudioBuffer;

const mergeAssets = (assets?: ServlyNumberInputHapticAssets): Required<ServlyNumberInputHapticAssets> => ({
  ...DEFAULT_SERVLY_NUMBER_INPUT_HAPTIC_ASSETS,
  ...assets,
});

const getAssetKind = (kind: ServlyNumberInputHapticKind): ServlyNumberInputHapticKind => {
  if (kind === 'number' || kind === 'preset') return 'increase';
  return kind;
};

export const getServlyNumberInputHapticKindForRejectReason = (
  reason: ServlyNumberInputRejectReason
): ServlyNumberInputHapticKind => {
  if (reason === 'min' || reason === 'preset-start') return 'minimum';
  if (reason === 'max' || reason === 'preset-end') return 'maximum';
  return 'error';
};

export const createServlyNumberInputHapticEngine = (
  initialOptions: ServlyNumberInputHapticEngineOptions = {}
): ServlyNumberInputHapticEngine => {
  let options = initialOptions;
  let enabled = initialOptions.enabled ?? true;
  let assets = mergeAssets(initialOptions.assets);
  let envelope: ServlyNumberInputHapticEnvelope = { ...DEFAULT_ENVELOPE, ...initialOptions.envelope };
  let speed: ServlyNumberInputHapticSpeed = { ...DEFAULT_SPEED, ...initialOptions.speed };
  let audioContext: AudioContext | null = initialOptions.audioContext ?? null;
  let fetcher = initialOptions.fetcher;
  const buffers = new Map<ServlyNumberInputHapticKind, AudioBuffer>();
  const lastPlayedAt = new Map<ServlyNumberInputHapticKind, number>();
  const activeSources = new Set<AudioBufferSourceNode>();
  let lastMotion: { value: number; time: number } | null = null;

  const getNow = () => options.now?.() ?? (typeof performance !== 'undefined' ? performance.now() : Date.now());

  const getContext = () => {
    if (audioContext) return audioContext;
    const AudioContextConstructor = getAudioContextConstructor();
    if (!AudioContextConstructor) return null;
    audioContext = new AudioContextConstructor();
    return audioContext;
  };

  const loadBuffer = async (kind: ServlyNumberInputHapticKind, context: AudioContext) => {
    const assetKind = getAssetKind(kind);
    const cachedBuffer = buffers.get(assetKind);
    if (cachedBuffer) return cachedBuffer;

    const asset = assets[assetKind];
    if (isAudioBuffer(asset)) {
      buffers.set(assetKind, asset);
      return asset;
    }

    let arrayBuffer: ArrayBuffer;
    if (asset instanceof ArrayBuffer) {
      arrayBuffer = asset.slice(0);
    } else {
      const resolvedFetcher = fetcher ?? (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : undefined);
      if (!resolvedFetcher) return null;
      const response = await resolvedFetcher(String(asset));
      arrayBuffer = await response.arrayBuffer();
    }

    const decodedBuffer = await context.decodeAudioData(arrayBuffer.slice(0));
    buffers.set(assetKind, decodedBuffer);
    return decodedBuffer;
  };

  const getIntensity = (event?: ServlyNumberInputHapticPlayEvent) => {
    if (!event) return 0;

    const now = event.timestamp ?? getNow();
    let velocity = 0;

    if (typeof event.numericValue === 'number') {
      if (lastMotion) {
        const elapsedSeconds = Math.max(0.001, (now - lastMotion.time) / 1000);
        velocity = Math.abs(event.numericValue - lastMotion.value) / elapsedSeconds;
      }
      lastMotion = { value: event.numericValue, time: now };
    } else if (typeof event.steps === 'number') {
      velocity = Math.abs(event.steps) * (1000 / Math.max(1, speed.windowMs));
    }

    return clamp(velocity / Math.max(1, speed.compoundSpeed), 0, 1);
  };

  const prime = async () => {
    if (!enabled) return;
    const context = getContext();
    if (!context) return;
    if (context.state === 'suspended') await context.resume();
  };

  const play = async (kind: ServlyNumberInputHapticKind, event?: ServlyNumberInputHapticPlayEvent) => {
    if (!enabled) return;

    try {
      await prime();
      const context = getContext();
      if (!context) return;

      const assetKind = getAssetKind(kind);
      const nowMs = event?.timestamp ?? getNow();
      const intensity = getIntensity(event);
      const minimumInterval = lerp(speed.maxIntervalMs, speed.minIntervalMs, intensity);
      const previousPlay = lastPlayedAt.get(assetKind) ?? -Infinity;
      if (nowMs - previousPlay < minimumInterval) return;

      const buffer = await loadBuffer(assetKind, context);
      if (!buffer) return;

      lastPlayedAt.set(assetKind, nowMs);
      const audioNow = context.currentTime;
      const attackSeconds = envelope.attackMs / 1000;
      const holdSeconds = envelope.holdMs / 1000;
      const releaseSeconds = envelope.releaseMs / 1000;
      const peakGain = envelope.gain * lerp(speed.minGainMultiplier, speed.maxGainMultiplier, intensity);
      const playbackRate = lerp(speed.minPlaybackRate, speed.maxPlaybackRate, intensity);
      const source = context.createBufferSource();
      const gain = context.createGain();
      const releaseStart = audioNow + attackSeconds + holdSeconds;
      const stopAt = releaseStart + releaseSeconds + 0.04;

      source.buffer = buffer;
      source.playbackRate.setValueAtTime(playbackRate, audioNow);
      source.connect(gain);
      gain.connect(context.destination);
      gain.gain.cancelScheduledValues(audioNow);
      gain.gain.setValueAtTime(0, audioNow);
      gain.gain.linearRampToValueAtTime(peakGain, audioNow + attackSeconds);
      gain.gain.setValueAtTime(peakGain, releaseStart);
      gain.gain.linearRampToValueAtTime(0, releaseStart + releaseSeconds);

      activeSources.add(source);
      source.onended = () => activeSources.delete(source);
      source.start(audioNow);
      source.stop(stopAt);
    } catch {
      // Audio feedback should never break input interaction.
    }
  };

  const updateOptions = (nextOptions: ServlyNumberInputHapticEngineOptions = {}) => {
    options = nextOptions;
    enabled = nextOptions.enabled ?? true;
    assets = mergeAssets(nextOptions.assets);
    envelope = { ...DEFAULT_ENVELOPE, ...nextOptions.envelope };
    speed = { ...DEFAULT_SPEED, ...nextOptions.speed };
    fetcher = nextOptions.fetcher;
    if (nextOptions.audioContext && nextOptions.audioContext !== audioContext) {
      audioContext = nextOptions.audioContext;
      buffers.clear();
    }
  };

  const dispose = () => {
    activeSources.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Source may already be stopped.
      }
    });
    activeSources.clear();
    buffers.clear();
    lastPlayedAt.clear();
    lastMotion = null;
  };

  return {
    prime,
    play,
    updateOptions,
    dispose,
    getState: () => ({
      enabled,
      isSupported: Boolean(audioContext || getAudioContextConstructor()),
      loadedKinds: Array.from(buffers.keys()),
    }),
  };
};
