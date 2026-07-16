import { useEffect, useMemo, useRef, useState } from 'react';
import { createServlyNumberInputHapticEngine, getServlyNumberInputHapticKindForRejectReason } from './engine';
import type { ServlyNumberInputHapticsHookOptions, ServlyNumberInputHapticsHookResult } from './types';

const getAudibleValueKey = (event: { suffix: string; displayValue: unknown }) =>
  `${event.suffix}:${String(event.displayValue)}`;

export const useServlyNumberInputHaptics = (
  options: ServlyNumberInputHapticsHookOptions = {}
): ServlyNumberInputHapticsHookResult => {
  const [engine] = useState(() => createServlyNumberInputHapticEngine(options));
  const previousAudibleValueKeyRef = useRef<string | null>(null);
  const previousAudibleNumericValueRef = useRef<number | null>(null);

  useEffect(() => {
    engine.updateOptions(options);
  }, [engine, options]);

  useEffect(
    () => () => {
      engine.dispose();
    },
    [engine]
  );

  const handlers = useMemo<ServlyNumberInputHapticsHookResult['handlers']>(
    () => ({
      onValueDragStart: (event) => {
        previousAudibleNumericValueRef.current = event.numericValue;
        previousAudibleValueKeyRef.current = getAudibleValueKey(event);
        void engine.prime();
      },
      onValueDrag: (event) => {
        const valueKey = getAudibleValueKey(event);
        if (valueKey === previousAudibleValueKeyRef.current) {
          return;
        }

        const direction =
          typeof event.steps === 'number' && event.steps !== 0
            ? event.steps > 0
              ? 'increase'
              : 'decrease'
            : previousAudibleNumericValueRef.current !== null && event.numericValue < previousAudibleNumericValueRef.current
              ? 'decrease'
              : 'increase';

        previousAudibleNumericValueRef.current = event.numericValue;
        previousAudibleValueKeyRef.current = valueKey;

        void engine.play(direction, {
          numericValue: event.numericValue,
          steps: event.steps,
        });
      },
      onValueDragEnd: () => {
        previousAudibleNumericValueRef.current = null;
        previousAudibleValueKeyRef.current = null;
      },
      onReject: (event) => {
        void engine.play(getServlyNumberInputHapticKindForRejectReason(event.reason), {
          numericValue: event.numericValue,
        });
      },
    }),
    [engine]
  );

  return {
    engine,
    handlers,
  };
};
