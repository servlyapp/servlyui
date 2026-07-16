/**
 * Converts between common CSS numeric units. Percent conversion is intentionally
 * context-free and therefore preserves the pixel-space value.
 */
export const convertUnit = (value: number, fromUnit: string, toUnit: string, basePixel = 16): number => {
  if (!fromUnit || !toUnit || fromUnit === toUnit) return value;

  let pixels: number;
  switch (fromUnit) {
    case 'rem':
    case 'em':
      pixels = value * basePixel;
      break;
    case '%':
    case 'px':
    default:
      pixels = value;
  }

  switch (toUnit) {
    case 'rem':
    case 'em':
      return pixels / basePixel;
    case '%':
    case 'px':
    default:
      return pixels;
  }
};
