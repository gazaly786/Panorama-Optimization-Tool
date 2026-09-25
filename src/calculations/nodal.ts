import { CameraSpec, LensSpec } from '../types';

export interface NodalCalibrationResult {
  entrancePupilOffsetMm: number; // Distance from lens front element or mount
  entrancePupilReference: string;
  upperRailSettingMm: number;
  lowerRailSettingMm: number;
  parallaxSensitivityRating: 'EXTREME' | 'HIGH' | 'MODERATE' | 'LOW';
  parallaxExplanation: string;
  alignmentChecklist: string[];
}

/**
 * Calculates entrance pupil (no-parallax point) positioning and panoramic head rail guidelines.
 */
export function calculateNodalAlignment(
  camera: CameraSpec,
  lens: LensSpec,
  subjectDistanceM: number
): NodalCalibrationResult {
  // If the lens has a documented entrance pupil offset:
  // e.g. Sigma 8mm f/3.5 has entrance pupil approx 1.5 - 2.5 mm behind the gold ring / front element (~42mm from mount).
  const offsetMm = lens.entrancePupilOffsetMm || 45;

  // Upper rail sets the optical axis directly over the horizontal rotator axis.
  // Standard upper rail setting = distance from tripod socket to center of lens entrance pupil.
  const upperRail = offsetMm + 20;

  // Lower rail centers the lens optical axis over the vertical rotator.
  // Camera mount center to sensor center = approx camera.dimensionsMm[0] / 2 or sensorWidth/2 + standard flange offset (~45-55mm)
  const lowerRail = 52; // typical DSLR / Mirrorless center offset

  // Parallax sensitivity:
  // When foreground objects are close (< 1.5m), parallax error is devastating for stitching.
  let sensitivity: NodalCalibrationResult['parallaxSensitivityRating'] = 'MODERATE';
  if (subjectDistanceM <= 0.8) sensitivity = 'EXTREME';
  else if (subjectDistanceM <= 1.8) sensitivity = 'HIGH';
  else if (subjectDistanceM <= 5) sensitivity = 'MODERATE';
  else sensitivity = 'LOW';

  const explanation = sensitivity === 'EXTREME' || sensitivity === 'HIGH'
    ? `At ${subjectDistanceM.toFixed(1)}m subject distance, foreground parallax displacement is severe. If the camera rotates around the tripod screw instead of the lens entrance pupil, foreground doorframes or table edges will jump across background walls, causing ghosting and seam tearing in PTGui/Hugin.`
    : `At ${subjectDistanceM.toFixed(1)}m, parallax displacement is moderate. Accurate entrance pupil alignment ensures clean automatic control-point generation without manual seam masking.`;

  return {
    entrancePupilOffsetMm: offsetMm,
    entrancePupilReference: 'Measured from lens front / gold index band',
    upperRailSettingMm: upperRail,
    lowerRailSettingMm: lowerRail,
    parallaxSensitivityRating: sensitivity,
    parallaxExplanation: explanation,
    alignmentChecklist: [
      'Mount camera in portrait orientation on the panoramic head vertical arm.',
      'Align lower rail so lens centerline is centered directly over the panoramic panning base.',
      'Place a vertical foreground reference (e.g. window frame or vertical tape) 1m away, and a background reference 5m away.',
      'Rotate panoramic head left and right through the viewfinder / live view.',
      'Slide the upper rail forward/backward until the foreground and background references do not shift relative to each other.',
      'Tighten all rail thumb-screws and lock detent rotator ring.',
    ],
  };
}
