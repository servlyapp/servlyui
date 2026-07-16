import React, { createContext, useContext, useMemo } from 'react';
import type {
  ServlyNumberInputAdapters,
  ServlyNumberInputProviderProps,
  ServlyNumberInputSize,
  ServlyNumberInputTheme,
  ServlyNumberInputThemeMode,
} from './types';

interface ServlyNumberInputContextValue {
  adapters?: Partial<ServlyNumberInputAdapters>;
  theme?: ServlyNumberInputThemeMode | ServlyNumberInputTheme;
  size?: ServlyNumberInputSize;
  isSectionHovered: boolean;
}

const ServlyNumberInputContext = createContext<ServlyNumberInputContextValue>({
  isSectionHovered: false,
});

export const useServlyNumberInputContext = () => useContext(ServlyNumberInputContext);

/**
 * Shares primitive adapters and section-hover state with ServlyNumberInput children.
 */
export const ServlyNumberInputProvider = ({
  adapters,
  theme,
  size,
  isSectionHovered = false,
  children,
}: ServlyNumberInputProviderProps) => {
  const value = useMemo(() => ({ adapters, theme, size, isSectionHovered }), [adapters, theme, size, isSectionHovered]);

  return <ServlyNumberInputContext.Provider value={value}>{children}</ServlyNumberInputContext.Provider>;
};
