/**
 * Dual Unit Conversion & Formatting Utility
 * Provides Metric (mm / m) and Imperial (inches / ft) standards for all optical measurements.
 * Automatically adapts calculations and displayed metrics according to the user's global unit preference.
 */

export type UnitPreference = 'metric' | 'imperial';

const STORAGE_KEY = 'panooptix_unit_preference';

let activeUnitPreference: UnitPreference = (() => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'imperial' || saved === 'inches') return 'imperial';
    } catch {
      // Fallback for restricted storage environments
    }
  }
  return 'metric';
})();

export function setGlobalUnitPreference(pref: UnitPreference) {
  activeUnitPreference = pref;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {
      // Fallback
    }
  }
}

export function getGlobalUnitPreference(): UnitPreference {
  return activeUnitPreference;
}

export function mmToInches(mm: number): number {
  return mm / 25.4;
}

export function inchesToMm(inches: number): number {
  return inches * 25.4;
}

export function metersToFeet(meters: number): number {
  return meters * 3.28084;
}

export function feetToMeters(feet: number): number {
  return feet / 3.28084;
}

export function metersToInches(meters: number): number {
  return meters * 39.3701;
}

/**
 * Formats a distance in meters into dual metric + imperial string:
 * When Metric is active: "2.00 m (6.6 ft)" or "0.50 m (1.64 ft / 19.7 in)"
 * When Imperial is active: "6.6 ft (2.00 m)" or "1.64 ft / 19.7 in (0.50 m)"
 */
export function formatDualDistance(
  meters: number | 'Infinite' | undefined,
  precision = 2,
  preference?: UnitPreference
): string {
  if (meters === undefined) return 'N/A';
  if (meters === 'Infinite' || meters === Infinity) return 'Infinity (∞)';
  if (meters <= 0) return preference === 'imperial' || (!preference && activeUnitPreference === 'imperial') ? '0 ft (0 m)' : '0 m (0 ft)';

  const pref = preference || activeUnitPreference;
  const feet = metersToFeet(meters);
  const inches = metersToInches(meters);

  if (pref === 'imperial') {
    if (meters < 1.0) {
      return `${feet.toFixed(2)} ft / ${inches.toFixed(1)} in (${meters.toFixed(precision)} m)`;
    }
    return `${feet.toFixed(1)} ft (${meters.toFixed(precision)} m)`;
  }

  // Metric default
  if (meters < 1.0) {
    return `${meters.toFixed(precision)} m (${feet.toFixed(2)} ft / ${inches.toFixed(1)} in)`;
  }
  return `${meters.toFixed(precision)} m (${feet.toFixed(1)} ft)`;
}

/**
 * Compact distance display:
 * When Metric: "2.0m / 6.6ft"
 * When Imperial: "6.6ft / 2.0m"
 */
export function formatCompactDistance(
  meters: number | 'Infinite' | undefined,
  preference?: UnitPreference
): string {
  if (meters === undefined) return 'N/A';
  if (meters === 'Infinite' || meters === Infinity) return '∞';
  const pref = preference || activeUnitPreference;
  const feet = metersToFeet(meters);

  if (pref === 'imperial') {
    return `${feet.toFixed(1)}ft / ${meters.toFixed(meters < 1 ? 2 : 1)}m`;
  }
  return `${meters.toFixed(meters < 1 ? 2 : 1)}m / ${feet.toFixed(1)}ft`;
}

/**
 * Formats millimeters to dual metric + imperial:
 * When Metric: "52.0 mm (2.05 in)"
 * When Imperial: "2.05 in (52.0 mm)"
 */
export function formatDualMm(
  mm: number | undefined,
  precision = 1,
  preference?: UnitPreference
): string {
  if (mm === undefined) return 'N/A';
  const pref = preference || activeUnitPreference;
  const inches = mmToInches(mm);
  const mmFormatted = mm % 1 === 0 ? mm.toString() : mm.toFixed(precision);

  if (pref === 'imperial') {
    return `${inches.toFixed(2)} in (${mmFormatted} mm)`;
  }
  return `${mmFormatted} mm (${inches.toFixed(2)} in)`;
}

/**
 * Compact mm display:
 * When Metric: "52mm / 2.05\""
 * When Imperial: "2.05\" / 52mm"
 */
export function formatCompactMm(mm: number | undefined, preference?: UnitPreference): string {
  if (mm === undefined) return 'N/A';
  const pref = preference || activeUnitPreference;
  const inches = mmToInches(mm);

  if (pref === 'imperial') {
    return `${inches.toFixed(2)}" / ${mm}mm`;
  }
  return `${mm}mm / ${inches.toFixed(2)}"`;
}

/**
 * Formats 2D dimensions in mm to dual metric + imperial:
 * When Metric: "35.9 × 23.9 mm (1.41 × 0.94 in)"
 * When Imperial: "1.41 × 0.94 in (35.9 × 23.9 mm)"
 */
export function formatDualDimensions(wMm: number, hMm: number, preference?: UnitPreference): string {
  const pref = preference || activeUnitPreference;
  const wIn = mmToInches(wMm);
  const hIn = mmToInches(hMm);

  if (pref === 'imperial') {
    return `${wIn.toFixed(2)} × ${hIn.toFixed(2)} in (${wMm.toFixed(1)} × ${hMm.toFixed(1)} mm)`;
  }
  return `${wMm.toFixed(1)} × ${hMm.toFixed(1)} mm (${wIn.toFixed(2)} × ${hIn.toFixed(2)} in)`;
}

/**
 * Formats Circle of Confusion:
 * When Metric: "0.019 mm (0.00075 in)"
 * When Imperial: "0.00075 in (0.019 mm)"
 */
export function formatDualCoC(cocMm: number, preference?: UnitPreference): string {
  const pref = preference || activeUnitPreference;
  const cocIn = mmToInches(cocMm);

  if (pref === 'imperial') {
    return `${cocIn.toFixed(5)} in (${cocMm.toFixed(3)} mm)`;
  }
  return `${cocMm.toFixed(3)} mm (${cocIn.toFixed(5)} in)`;
}

/**
 * Formats single primary measurement based on active unit preference:
 * e.g. "45 mm" vs "1.77 in"
 */
export function formatPrimaryLength(mm: number | undefined, precision = 1, preference?: UnitPreference): string {
  if (mm === undefined) return 'N/A';
  const pref = preference || activeUnitPreference;
  if (pref === 'imperial') {
    return `${mmToInches(mm).toFixed(2)} in`;
  }
  return `${mm % 1 === 0 ? mm : mm.toFixed(precision)} mm`;
}

/**
 * Formats single distance based on active unit preference:
 * e.g. "2.0 m" vs "6.6 ft"
 */
export function formatPrimaryDistance(meters: number | undefined, precision = 1, preference?: UnitPreference): string {
  if (meters === undefined) return 'N/A';
  const pref = preference || activeUnitPreference;
  if (pref === 'imperial') {
    return `${metersToFeet(meters).toFixed(precision)} ft`;
  }
  return `${meters.toFixed(precision)} m`;
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
