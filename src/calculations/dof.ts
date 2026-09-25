import { CameraSpec } from '../types';

/**
 * Returns sensor-dependent circle of confusion in millimeters.
 * Standard Zeiss criterion is diagonal / 1500.
 * For high-resolution sensors, photographers often use d / 1730 or pixel-pitch based CoC.
 */
export function getCircleOfConfusionMm(camera: CameraSpec, customCoCMm?: number): number {
  if (customCoCMm && customCoCMm > 0) {
    return customCoCMm;
  }
  // Formula: diagonal / 1500
  const d = camera.sensorDiagonalMm || Math.sqrt(camera.sensorWidthMm ** 2 + camera.sensorHeightMm ** 2);
  const coc = d / 1500;
  // Round to 4 decimal places (e.g. 0.0188 mm)
  return Math.round(coc * 10000) / 10000;
}

export interface DofResult {
  hyperfocalDistanceM: number;
  hyperfocalNearLimitM: number;
  focusDistanceM: number;
  nearLimitM: number;
  farLimitM: number | 'Infinity';
  totalDofM: number | 'Infinite';
  inFocusPercentage?: number;
  isHyperfocal: boolean;
  circleOfConfusionMm: number;
}

/**
 * Calculates depth of field limits based on optical parameters.
 * @param focalLengthMm Actual optical focal length of lens in mm
 * @param aperture f-number (e.g. 8 for f/8)
 * @param focusDistanceM Focus distance in meters
 * @param circleOfConfusionMm Circle of confusion in mm
 */
export function calculateDof(
  focalLengthMm: number,
  aperture: number,
  focusDistanceM: number,
  circleOfConfusionMm: number
): DofResult {
  const f = focalLengthMm;
  const N = aperture;
  const c = circleOfConfusionMm;

  // Hyperfocal distance: H = (f^2 / (N * c)) + f in mm
  const H_mm = (f * f) / (N * c) + f;
  const H_m = H_mm / 1000;
  const H_near_m = H_m / 2;

  // Convert focus distance to mm
  const s_mm = focusDistanceM * 1000;

  // If focus is at or beyond hyperfocal, far limit is infinity
  const isHyperfocal = Math.abs(focusDistanceM - H_m) < 0.1 || focusDistanceM >= H_m;

  let near_m: number;
  let far_m: number | 'Infinity';
  let total_m: number | 'Infinite';

  if (s_mm >= H_mm - f) {
    // Focus is at or beyond hyperfocal
    near_m = (s_mm * (H_mm - f)) / (H_mm + s_mm - 2 * f) / 1000;
    far_m = 'Infinity';
    total_m = 'Infinite';
  } else {
    const near_mm = (s_mm * (H_mm - f)) / (H_mm + s_mm - 2 * f);
    const far_mm = (s_mm * (H_mm - f)) / (H_mm - s_mm);
    near_m = near_mm / 1000;
    far_m = far_mm / 1000;
    total_m = far_m - near_m;
  }

  return {
    hyperfocalDistanceM: Math.round(H_m * 100) / 100,
    hyperfocalNearLimitM: Math.round(H_near_m * 100) / 100,
    focusDistanceM: Math.round(focusDistanceM * 100) / 100,
    nearLimitM: Math.max(0.05, Math.round(near_m * 100) / 100),
    farLimitM: typeof far_m === 'number' ? Math.round(far_m * 100) / 100 : 'Infinity',
    totalDofM: typeof total_m === 'number' ? Math.round(total_m * 100) / 100 : 'Infinite',
    isHyperfocal,
    circleOfConfusionMm: Math.round(c * 10000) / 10000,
  };
}
