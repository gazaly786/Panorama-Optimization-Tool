/**
 * Dual Unit Conversion & Formatting Utility
 * Provides simultaneous Metric (SI) and Imperial / US Customary standards for all optical measurements.
 */

export function mmToInches(mm: number): number {
  return mm / 25.4;
}

export function metersToFeet(meters: number): number {
  return meters * 3.28084;
}

export function metersToInches(meters: number): number {
  return meters * 39.3701;
}

/**
 * Formats a distance in meters into dual metric + imperial string:
 * e.g. "0.50 m (1.64 ft / 19.7 in)" or "2.0 m (6.56 ft)"
 */
export function formatDualDistance(meters: number | 'Infinite' | undefined, precision = 2): string {
  if (meters === undefined) return 'N/A';
  if (meters === 'Infinite' || meters === Infinity) return 'Infinity (∞)';
  if (meters <= 0) return '0 m (0 ft)';

  const feet = metersToFeet(meters);
  const inches = metersToInches(meters);

  if (meters < 1.0) {
    return `${meters.toFixed(precision)} m (${feet.toFixed(2)} ft / ${inches.toFixed(1)} in)`;
  }
  return `${meters.toFixed(precision)} m (${feet.toFixed(1)} ft)`;
}

/**
 * Compact distance display: e.g. "0.5m / 1.6ft"
 */
export function formatCompactDistance(meters: number | 'Infinite' | undefined): string {
  if (meters === undefined) return 'N/A';
  if (meters === 'Infinite' || meters === Infinity) return '∞';
  const feet = metersToFeet(meters);
  return `${meters.toFixed(meters < 1 ? 2 : 1)}m / ${feet.toFixed(1)}ft`;
}

/**
 * Formats millimeters to dual metric + imperial:
 * e.g. "52.0 mm (2.05 in)" or "8 mm (0.31 in)"
 */
export function formatDualMm(mm: number | undefined, precision = 1): string {
  if (mm === undefined) return 'N/A';
  const inches = mmToInches(mm);
  return `${mm % 1 === 0 ? mm : mm.toFixed(precision)} mm (${inches.toFixed(2)} in)`;
}

/**
 * Compact mm display: e.g. "52mm / 2.05\""
 */
export function formatCompactMm(mm: number | undefined): string {
  if (mm === undefined) return 'N/A';
  const inches = mmToInches(mm);
  return `${mm}mm / ${inches.toFixed(2)}"`;
}

/**
 * Formats 2D dimensions in mm to dual metric + imperial:
 * e.g. "35.9 × 23.9 mm (1.41 × 0.94 in)"
 */
export function formatDualDimensions(wMm: number, hMm: number): string {
  const wIn = mmToInches(wMm);
  const hIn = mmToInches(hMm);
  return `${wMm.toFixed(1)} × ${hMm.toFixed(1)} mm (${wIn.toFixed(2)} × ${hIn.toFixed(2)} in)`;
}

/**
 * Formats Circle of Confusion: e.g. "0.019 mm (0.00075 in)"
 */
export function formatDualCoC(cocMm: number): string {
  const cocIn = mmToInches(cocMm);
  return `${cocMm.toFixed(3)} mm (${cocIn.toFixed(5)} in)`;
}

/**
 * Formats angle with rotation direction details: e.g. "90° (0°, 90°, 180°, 270°)"
 */
export function formatDetentAngles(shots: number): number[] {
  if (shots <= 0) return [];
  const step = 360 / shots;
  const angles: number[] = [];
  for (let i = 0; i < shots; i++) {
    angles.push(Math.round(i * step * 10) / 10);
  }
  return angles;
}
