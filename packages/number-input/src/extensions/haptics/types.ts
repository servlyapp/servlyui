import type {
  ServlyNumberInputProps,
  ServlyNumberInputRejectEvent,
  ServlyNumberInputRejectReason,
  ServlyNumberInputValueDragEvent,
} from '../../types';

export type ServlyNumberInputHapticKind =
  | 'increase'
  | 'decrease'
  | 'minimum'
  | 'maximum'
  | 'error'
  /**
   * @deprecated Use increase or decrease. Kept as a compatibility alias.
   */
  | 'number'
  /**
   * @deprecated Use increase or decrease. Kept as a compatibility alias.
   */
  | 'preset';

export type ServlyNumberInputHapticAsset = string | URL | ArrayBuffer | AudioBuffer;

export type ServlyNumberInputHapticAssets = Partial<Record<ServlyNumberInputHapticKind, ServlyNumberInputHapticAsset>>;

export interface ServlyNumberInputHapticEnvelope {
  attackMs: number;
  holdMs: number;
  releaseMs: number;
  gain: number;
}

export interface ServlyNumberInputHapticSpeed {
  windowMs: number;
  minIntervalMs: number;
  maxIntervalMs: number;
  minPlaybackRate: number;
  maxPlaybackRate: number;
  compoundSpeed: number;
  minGainMultiplier: number;
  maxGainMultiplier: number;
}

export interface ServlyNumberInputHapticPlayEvent {
  numericValue?: number;
  steps?: number;
  timestamp?: number;
}

export interface ServlyNumberInputHapticEngineOptions {
  enabled?: boolean;
  assets?: ServlyNumberInputHapticAssets;
  envelope?: Partial<ServlyNumberInputHapticEnvelope>;
  speed?: Partial<ServlyNumberInputHapticSpeed>;
  audioContext?: AudioContext;
  fetcher?: typeof fetch;
  now?: () => number;
}

export interface ServlyNumberInputHapticEngineState {
  enabled: boolean;
  isSupported: boolean;
  loadedKinds: ServlyNumberInputHapticKind[];
}

export interface ServlyNumberInputHapticEngine {
  prime: () => Promise<void>;
  play: (kind: ServlyNumberInputHapticKind, event?: ServlyNumberInputHapticPlayEvent) => Promise<void>;
  updateOptions: (options?: ServlyNumberInputHapticEngineOptions) => void;
  dispose: () => void;
  getState: () => ServlyNumberInputHapticEngineState;
}

export type ServlyNumberInputHapticsHookOptions = ServlyNumberInputHapticEngineOptions;

export interface ServlyNumberInputHapticsHookResult {
  engine: ServlyNumberInputHapticEngine;
  handlers: Pick<ServlyNumberInputProps, 'onValueDragStart' | 'onValueDrag' | 'onValueDragEnd' | 'onReject'>;
}

export type { ServlyNumberInputRejectEvent, ServlyNumberInputRejectReason, ServlyNumberInputValueDragEvent };
