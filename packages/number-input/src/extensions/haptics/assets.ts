import type { ServlyNumberInputHapticAssets } from './types';
import maximumHaptic from '../../../assets/haptics/maximum_haptic.mp3';
import minimumHaptic from '../../../assets/haptics/minimum_haptic.mp3';
import decreaseHaptic from '../../../assets/haptics/soft_haptic.mp3';
import increaseHaptic from '../../../assets/haptics/soft_haptic_2.mp3';

export const DEFAULT_SERVLY_NUMBER_INPUT_HAPTIC_ASSETS: Required<ServlyNumberInputHapticAssets> = {
  increase: increaseHaptic,
  decrease: decreaseHaptic,
  minimum: minimumHaptic,
  maximum: maximumHaptic,
  error: maximumHaptic,
  number: decreaseHaptic,
  preset: decreaseHaptic,
};
