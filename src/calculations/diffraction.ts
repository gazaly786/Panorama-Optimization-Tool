import { CameraSpec, LensSpec } from '../types';
import { calculatePixelPitchUm } from './pixelPitch';

export interface DiffractionAssessment {
  aperture: number;
  airyDiskDiameterUm: number;
  pixelPitchUm: number;
  diffractionLimitOnsetAperture: number;
  status: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH';
  expectedSharpness: 'POOR' | 'MODERATE' | 'GOOD' | 'HIGH' | 'PEAK' | 'DIFFRACTION LIMITED';
  ratio: number;
  warning?: string;
  recommendationNote: string;
}

// Optical wavelength for middle green light (0.55 micrometers)
const GREEN_LIGHT_WAVELENGTH_UM = 0.55;

/**
 * Calculates Airy disk diameter:
 * d = 2.44 * lambda * N
 * where lambda = 0.55 um, N = aperture
 */
export function calculateAiryDiskUm(aperture: number): number {
  return 2.44 * GREEN_LIGHT_WAVELENGTH_UM * aperture;
}

/**
 * Calculates diffraction onset aperture where Airy disk radius equals pixel pitch.
 * N_limit = pixelPitch / (1.22 * lambda) = pixelPitch / 0.671
 */
export function calculateDiffractionLimitAperture(pixelPitchUm: number): number {
  const dla = pixelPitchUm / (1.22 * GREEN_LIGHT_WAVELENGTH_UM);
  return Math.round(dla * 10) / 10;
}

export function assessDiffraction(
  aperture: number,
  camera: CameraSpec,
  lens?: LensSpec
): DiffractionAssessment {
  const pixelPitch = calculatePixelPitchUm(camera);
  const airyDisk = calculateAiryDiskUm(aperture);
  const ratio = airyDisk / pixelPitch;
  const dla = calculateDiffractionLimitAperture(pixelPitch);

  let status: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH';
  let expectedSharpness: 'POOR' | 'MODERATE' | 'GOOD' | 'HIGH' | 'PEAK' | 'DIFFRACTION LIMITED';
  let warning: string | undefined;
  let recommendationNote = '';

  if (ratio < 2.2) {
    status = 'LOW';
    if (aperture <= 2.8) {
      expectedSharpness = 'GOOD'; // wide open optical aberrations
      recommendationNote = 'Lens aberrations predominate at wide aperture; stopping down improves corner sharpness.';
    } else if (aperture <= 5.6) {
      expectedSharpness = 'PEAK';
      recommendationNote = 'Near the optical sweet spot. Excellent micro-contrast and sensor-resolution transfer.';
    } else {
      expectedSharpness = 'HIGH';
      recommendationNote = 'Minimal diffraction penalty, very sharp across frame.';
    }
  } else if (ratio <= 3.6) {
    status = 'MODERATE';
    expectedSharpness = 'HIGH';
    recommendationNote = 'Optimal balance for panorama stitching: generous depth of field with negligible real-world softening.';
  } else if (ratio <= 5.5) {
    status = 'HIGH';
    expectedSharpness = 'MODERATE';
    warning = `Diffraction risk: Airy disk (${airyDisk.toFixed(1)}μm) spans ${ratio.toFixed(1)}x pixel pitch (${pixelPitch.toFixed(1)}μm). Fine architectural/texture details will soften slightly at 100% inspection.`;
    recommendationNote = 'Slight loss of pixel-level micro-contrast in exchange for expanded depth of field.';
  } else {
    status = 'VERY HIGH';
    expectedSharpness = 'DIFFRACTION LIMITED';
    warning = `High diffraction warning: Aperture f/${aperture} significantly exceeds the sensor's diffraction limit (f/${dla}). Softening will be visible in the final panorama. Consider f/8 or focus bracketing instead.`;
    recommendationNote = 'Significant diffraction blurring across the frame. Rarely worthwhile on high-density sensors.';
  }

  // Lens sweet-spot override if specified
  if (lens?.sweetSpotAperture && lens.sweetSpotAperture.includes(`f/${aperture}`)) {
    if (expectedSharpness !== 'DIFFRACTION LIMITED') {
      expectedSharpness = 'PEAK';
    }
  }

  return {
    aperture,
    airyDiskDiameterUm: Math.round(airyDisk * 100) / 100,
    pixelPitchUm: pixelPitch,
    diffractionLimitOnsetAperture: dla,
    status,
    expectedSharpness,
    ratio: Math.round(ratio * 10) / 10,
    warning,
    recommendationNote,
  };
}
