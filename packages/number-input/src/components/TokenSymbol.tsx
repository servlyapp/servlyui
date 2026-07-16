import React from 'react';
import type { ServlyNumberInputTokenSymbolName } from '../types';

export interface ServlyNumberInputTokenSymbolProps {
  symbol: ServlyNumberInputTokenSymbolName;
  size?: number;
  className?: string;
}

/** Dependency-free semantic symbol used by default token picker rows. */
export const ServlyNumberInputTokenSymbol = ({
  symbol,
  size = 14,
  className,
}: ServlyNumberInputTokenSymbolProps) => {
  const common = { stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  return (
    <svg className={className} width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" data-symbol={symbol}>
      {symbol === 'number' ? (
        <>
          <path d="M5.5 2.5 4.5 13.5M11.5 2.5l-1 11" {...common} />
          <path d="M2.5 6h11M2 10h11" {...common} />
        </>
      ) : null}
      {symbol === 'spacing' ? (
        <>
          <path d="M2 3v10M14 3v10M3 8h10" {...common} />
          <path d="m5 6-2 2 2 2M11 6l2 2-2 2" {...common} />
        </>
      ) : null}
      {symbol === 'size' ? <rect x="3" y="3" width="10" height="10" rx="1.5" {...common} /> : null}
      {symbol === 'radius' ? <path d="M3 13V8a5 5 0 0 1 5-5h5M6 13H3v-3" {...common} /> : null}
      {symbol === 'opacity' ? <path d="M8 2.25c2.4 3.1 4 5.2 4 7.1a4 4 0 0 1-8 0c0-1.9 1.6-4 4-7.1Z" {...common} /> : null}
    </svg>
  );
};
