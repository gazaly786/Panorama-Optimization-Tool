import { CameraSpec, QualityPriority, BracketedFrame } from '../types';

export interface ExposureResult {
  sceneEv100: number;
  aperture: number;
  iso: number;
  shutterSeconds: number;
  shutterSpeedFraction: string;
  tripodRecommended: boolean;
  handheldBlurWarning?: string;
  subjectMotionWarning?: string;
  vibrationMitigation: {
    mirrorLockUp: boolean;
    efcs: boolean;
    electronicShutter: boolean;
    selfTimerSeconds: number;
    remoteShutter: boolean;
    stabilizationOff: boolean;
  };
  exposureMode: 'MANUAL';
  whiteBalanceMode: 'LOCKED_DAYLIGHT' | 'LOCKED_CUSTOM_KELVIN' | 'LOCKED_TUNGSTEN';
  whiteBalanceDescription: string;
}

export const STANDARD_SHUTTER_STEPS: { sec: number; label: string }[] = [
  { sec: 1 / 8000, label: '1/8000s' },
  { sec: 1 / 4000, label: '1/4000s' },
  { sec: 1 / 2000, label: '1/2000s' },
  { sec: 1 / 1000, label: '1/1000s' },
  { sec: 1 / 500, label: '1/500s' },
  { sec: 1 / 250, label: '1/250s' },
  { sec: 1 / 160, label: '1/160s' },
  { sec: 1 / 125, label: '1/125s' },
  { sec: 1 / 100, label: '1/100s' },
  { sec: 1 / 80, label: '1/80s' },
  { sec: 1 / 60, label: '1/60s' },
  { sec: 1 / 50, label: '1/50s' },
  { sec: 1 / 40, label: '1/40s' },
  { sec: 1 / 30, label: '1/30s' },
  { sec: 1 / 20, label: '1/20s' },
  { sec: 1 / 15, label: '1/15s' },
  { sec: 1 / 10, label: '1/10s' },
  { sec: 1 / 8, label: '1/8s' },
  { sec: 1 / 4, label: '1/4s' },
  { sec: 0.5, label: '0.5s' },
  { sec: 1, label: '1.0s' },
  { sec: 2, label: '2.0s' },
  { sec: 4, label: '4.0s' },
  { sec: 8, label: '8.0s' },
  { sec: 15, label: '15s' },
  { sec: 30, label: '30s' },
];

/**
 * Maps any raw shutter duration in seconds to the closest standard camera shutter step.
 */
export function findClosestShutterSpeed(rawSeconds: number): { sec: number; label: string } {
  let closestStep = STANDARD_SHUTTER_STEPS[0];
  let minDiff = Infinity;
  for (const step of STANDARD_SHUTTER_STEPS) {
    const diff = Math.abs(Math.log(step.sec) - Math.log(rawSeconds));
    if (diff < minDiff) {
      minDiff = diff;
      closestStep = step;
    }
  }
  return closestStep;
}

/**
 * Calculates exposure settings for panorama photography.
 * Prioritizes base ISO on tripod, accounts for camera and subject motion.
 */
export function calculateExposure(
  camera: CameraSpec,
  aperture: number,
  sceneEv100: number,
  tripodOn = true,
  peoplePresent = false,
  qualityPriority: QualityPriority = 'MAXIMUM_QUALITY',
  customIso?: number
): ExposureResult {
  // Determine ISO:
  // For panorama work on a tripod, base ISO is strongly preferred (ISO 100 or nativeIso)
  // to maximize dynamic range, color fidelity, and avoid noise across stitched frames.
  let iso = customIso || camera.nativeIso || 100;

  if (!tripodOn) {
    // Handheld: boost ISO if necessary to keep shutter above 1 / (eff_focal)
    if (sceneEv100 <= 7) iso = Math.max(iso, 800);
    else if (sceneEv100 <= 9) iso = Math.max(iso, 400);
  }

  // Shutter time formula:
  // EV = log2(N^2 / t) + log2(ISO / 100)
  // 2^(EV - log2(ISO/100)) = N^2 / t
  // t = (N^2) / (2^(EV) * (ISO / 100))
  const evISO = sceneEv100 + Math.log2(iso / 100);
  const rawShutterSec = (aperture * aperture) / Math.pow(2, evISO);

  const closestStep = findClosestShutterSpeed(rawShutterSec);

  // Warnings
  let handheldBlurWarning: string | undefined;
  let subjectMotionWarning: string | undefined;

  if (!tripodOn && closestStep.sec > 1 / 60) {
    handheldBlurWarning = `Slow shutter warning: ${closestStep.label} without a tripod introduces high camera-shake blur risk. Use a leveled panoramic tripod head.`;
  }

  if (peoplePresent && closestStep.sec > 1 / 60) {
    subjectMotionWarning = `Subject motion warning: ${closestStep.label} may blur moving people in the scene. Increase ISO to achieve at least 1/125s or ensure subjects remain still.`;
  }

  // Vibration suppression based on camera capabilities
  const mirrorLockUp = tripodOn && camera.mirrorLockUp && closestStep.sec >= 1 / 30 && closestStep.sec <= 2;
  const efcs = tripodOn && camera.efcs;
  const electronicShutter = tripodOn && camera.electronicShutter && !peoplePresent;
  const selfTimerSeconds = tripodOn && camera.selfTimerSeconds.includes(2) ? 2 : 0;
  const remoteShutter = tripodOn && camera.remoteTriggerSupport;
  const stabilizationOff = tripodOn && camera.ibis;

  // White balance
  let whiteBalanceMode: ExposureResult['whiteBalanceMode'] = 'LOCKED_DAYLIGHT';
  let wbDesc = 'LOCKED — Daylight 5500K (Prevents tile-to-tile color shifting)';
  if (sceneEv100 <= 6) {
    whiteBalanceMode = 'LOCKED_CUSTOM_KELVIN';
    wbDesc = 'LOCKED — Custom Kelvin (3200K - 4000K Interior Lock)';
  }

  return {
    sceneEv100,
    aperture,
    iso,
    shutterSeconds: closestStep.sec,
    shutterSpeedFraction: closestStep.label,
    tripodRecommended: true,
    handheldBlurWarning,
    subjectMotionWarning,
    vibrationMitigation: {
      mirrorLockUp,
      efcs,
      electronicShutter,
      selfTimerSeconds,
      remoteShutter,
      stabilizationOff,
    },
    exposureMode: 'MANUAL',
    whiteBalanceMode,
    whiteBalanceDescription: wbDesc,
  };
}

/**
 * Calculates discrete bracketed exposure frames for High Dynamic Range (HDR) panoramas.
 * Returns exact shutter speed, EV offset, and photographic purpose for each frame.
 */
export function calculateBracketedFrames(
  baseShutterSeconds: number,
  frames: number, // 1, 3, 5, 7
  evStep: number, // 0.7, 1.0, 1.5, 2.0, 3.0
  sceneEv100: number
): BracketedFrame[] {
  if (frames <= 1) {
    const closest = findClosestShutterSpeed(baseShutterSeconds);
    return [
      {
        index: 1,
        evOffset: 0,
        ev100: sceneEv100,
        shutterSeconds: closest.sec,
        shutterFraction: closest.label,
        purpose: 'Single Baseline Exposure (Standard Dynamic Range)',
      },
    ];
  }

  const half = Math.floor(frames / 2);
  const offsets: number[] = [];
  for (let i = -half; i <= half; i++) {
    offsets.push(Math.round(i * evStep * 10) / 10);
  }

  return offsets.map((offset, idx) => {
    // offset < 0 is underexposed (faster shutter, preserves highlights)
    // offset > 0 is overexposed (longer shutter, reveals shadow details)
    const targetSeconds = baseShutterSeconds * Math.pow(2, offset);
    const closest = findClosestShutterSpeed(targetSeconds);

    let purpose = 'Ambient Midtone Baseline';
    if (offset < 0) {
      if (Math.abs(offset) >= 3) {
        purpose = 'Deep Highlight Recovery (Direct Sun / Bare Bulbs)';
      } else {
        purpose = 'Highlight Protection (Window Views / Blue Skies)';
      }
    } else if (offset > 0) {
      if (offset >= 3) {
        purpose = 'Deep Shadow Recovery (Under-furniture / Dark Alcoves)';
      } else {
        purpose = 'Shadow Detail (Interior Textures / Dark Corners)';
      }
    }

    return {
      index: idx + 1,
      evOffset: offset,
      ev100: Math.round((sceneEv100 - offset) * 10) / 10,
      shutterSeconds: closest.sec,
      shutterFraction: closest.label,
      purpose,
    };
  });
}
