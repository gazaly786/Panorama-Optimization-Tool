import { CameraSpec } from '../types';

/**
 * Calculates sensor pixel pitch in micrometers (μm).
 * Formula: (sensorWidthMm / pixelWidth) * 1000
 */
export function calculatePixelPitchUm(camera: CameraSpec): number {
  if (camera.pixelPitchUm && camera.pixelPitchUm > 0) {
    return camera.pixelPitchUm;
  }
  const [pixelWidth] = camera.nativeResolution;
  if (!pixelWidth || pixelWidth <= 0) return 4.0; // fallback standard

  const pitch = (camera.sensorWidthMm / pixelWidth) * 1000;
  return Math.round(pitch * 100) / 100;
}
