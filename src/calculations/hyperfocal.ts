import { CameraSpec } from '../types';
import { getCircleOfConfusionMm } from './dof';

export interface HyperfocalTableEntry {
  aperture: number;
  apertureLabel: string;
  hyperfocalM: number;
  nearLimitM: number;
  farLimit: string;
}

/**
 * Calculates exact hyperfocal distance in meters.
 * H = f^2 / (N * c) + f
 */
export function calculateHyperfocalDistanceM(
  focalLengthMm: number,
  aperture: number,
  circleOfConfusionMm: number
): number {
  const f = focalLengthMm;
  const N = aperture;
  const c = circleOfConfusionMm;
  const H_mm = (f * f) / (N * c) + f;
  return Math.round((H_mm / 1000) * 100) / 100;
}

/**
 * Generates a hyperfocal distance reference table across standard apertures.
 */
export function getHyperfocalTable(
  focalLengthMm: number,
  camera: CameraSpec,
  customCoCMm?: number
): HyperfocalTableEntry[] {
  const coc = getCircleOfConfusionMm(camera, customCoCMm);
  const apertures = [2.8, 4, 5.6, 8, 11, 16, 22];

  return apertures.map(N => {
    const H = calculateHyperfocalDistanceM(focalLengthMm, N, coc);
    const near = Math.round((H / 2) * 100) / 100;
    return {
      aperture: N,
      apertureLabel: `f/${N}`,
      hyperfocalM: H,
      nearLimitM: near,
      farLimit: 'Infinity (∞)',
    };
  });
}
