import React, { forwardRef, useMemo } from 'react';
import { antdServlyNumberInputAdapters } from './adapters/antd';
import { useServlyNumberInputHaptics } from './extensions/haptics/react';
import { ServlyNumberInputCore } from './ServlyNumberInputCore';
import type { ServlyNumberInputProps, ServlyNumberInputRef } from './types';

/**
 * Styled Servly number input using the default AntD/react-icons/drag adapters.
 */
export const ServlyNumberInput = forwardRef<ServlyNumberInputRef, ServlyNumberInputProps>(
  (
    {
      haptics: hapticsEnabled = true,
      onValueDragStart,
      onValueDrag,
      onValueDragEnd,
      onReject,
      ...props
    },
    ref
  ) => {
    const hapticOptions = useMemo(() => ({ enabled: hapticsEnabled }), [hapticsEnabled]);
    const haptics = useServlyNumberInputHaptics(hapticOptions);

    return (
      <ServlyNumberInputCore
        {...props}
        ref={ref}
        defaultAdapters={antdServlyNumberInputAdapters}
        onValueDragStart={(event) => {
          haptics.handlers.onValueDragStart?.(event);
          onValueDragStart?.(event);
        }}
        onValueDrag={(event) => {
          haptics.handlers.onValueDrag?.(event);
          onValueDrag?.(event);
        }}
        onValueDragEnd={(event) => {
          haptics.handlers.onValueDragEnd?.(event);
          onValueDragEnd?.(event);
        }}
        onReject={(event) => {
          haptics.handlers.onReject?.(event);
          onReject?.(event);
        }}
      />
    );
  }
);

ServlyNumberInput.displayName = 'ServlyNumberInput';

export default ServlyNumberInput;
