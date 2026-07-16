import type {
  ServlyNumberInputLayoutContext,
  ServlyNumberInputLayoutPolicy,
  ServlyNumberInputSize,
  ServlyNumberInputTokenActionPlacement,
} from '../types';

const LAYOUT_METRICS: Record<
  ServlyNumberInputSize,
  { height: number; prefixWidth: number; suffixWidth: number; minimumValueWidth: number }
> = {
  xs: { height: 22, prefixWidth: 20, suffixWidth: 32, minimumValueWidth: 32 },
  sm: { height: 26, prefixWidth: 24, suffixWidth: 36, minimumValueWidth: 36 },
  md: { height: 32, prefixWidth: 30, suffixWidth: 46, minimumValueWidth: 40 },
  lg: { height: 40, prefixWidth: 38, suffixWidth: 56, minimumValueWidth: 48 },
};

export const createServlyNumberInputLayoutContext = (
  context: Omit<ServlyNumberInputLayoutContext, 'estimatedAvailableValueWidth' | 'minimumValueWidth'>
): ServlyNumberInputLayoutContext => {
  const metrics = LAYOUT_METRICS[context.size];
  const inlineTokenWidth = metrics.height - 3;
  const reservedWidth =
    (context.hasPrefix ? metrics.prefixWidth : 0) +
    (context.hasSuffixMenu ? metrics.suffixWidth : 0) +
    inlineTokenWidth;

  return {
    ...context,
    minimumValueWidth: metrics.minimumValueWidth,
    estimatedAvailableValueWidth:
      context.containerWidth === undefined ? undefined : Math.max(0, context.containerWidth - reservedWidth),
  };
};

export const resolveServlyNumberInputTokenActionPlacement = (
  context: ServlyNumberInputLayoutContext,
  layoutPolicy?: ServlyNumberInputLayoutPolicy
): ServlyNumberInputTokenActionPlacement => {
  const requestedPlacement = layoutPolicy?.(context)?.tokenActionPlacement;
  const defaultPlacement =
    context.estimatedAvailableValueWidth !== undefined &&
    context.estimatedAvailableValueWidth < context.minimumValueWidth
      ? 'suffix-menu'
      : 'inline';
  const placement = requestedPlacement ?? defaultPlacement;

  if (placement === 'suffix-menu' && !context.hasSuffixMenu) return 'inline';
  return placement;
};
