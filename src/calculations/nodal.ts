import { CameraSpec, LensSpec, PanoHeadSpec } from '../types';

export interface NodalCalibrationResult {
  entrancePupilOffsetMm: number; // Distance from lens front element or mount
  entrancePupilReference: string;
  upperRailSettingMm: number;
  lowerRailSettingMm: number;
  railWarning?: string;
  parallaxSensitivityRating: 'EXTREME' | 'HIGH' | 'MODERATE' | 'LOW';
  parallaxExplanation: string;
  alignmentChecklist: string[];
}

export interface NodalEstimationInput {
  focalLengthMm: number;
  cropFactor: number;
  projectionType: string;
  lensMount?: string;
  measuredOffsetMm?: number;
  cameraSocketOffsetMm?: number;
}

export interface NodalEstimationOutput {
  estimatedEpdMountMm: number;
  isDatabaseKnown: boolean;
  opticalGroupLocation: string;
  physicalLandmark: string;
  flangeFocalDistanceMm: number;
  entrancePupilFromSensorMm: number;
  upperRailByPanoHead: {
    manfrotto303Mm: number;
    nodalNinja4Mm: number;
    nodalNinja3Mm: number;
    nodalNinja6Mm: number;
    sunwayfotoCr30Mm: number;
    genericMm: number;
  };
  lowerRailCenteringMm: number;
  parallaxErrorAt1mFor5mmOffsetPx: number;
  parallaxErrorAtHalfMeterFor5mmOffsetPx: number;
}

/**
 * Standard Flange Focal Distances (FFD) in mm
 */
export const MOUNT_FLANGE_DISTANCES: Record<string, number> = {
  'Canon EF': 44.0,
  'Canon EF-S': 44.0,
  'Canon RF': 20.0,
  'Canon EF-M': 18.0,
  'Nikon F': 46.5,
  'Nikon Z': 16.0,
  'Sony E': 18.0,
  'Sony FE': 18.0,
  'Sony A': 44.5,
  'Micro Four Thirds': 19.25,
  'MFT': 19.25,
  'Fujifilm X': 17.7,
  'Fuji X': 17.7,
  'Leica L': 20.0,
  'Pentax K': 45.46,
};

/**
 * Estimates the No-Parallax Point (Entrance Pupil) and panoramic head rail coordinates
 * based on lens focal length, optical projection type, sensor crop factor, and lens mount.
 */
export function estimateNodalPoint(input: NodalEstimationInput): NodalEstimationOutput {
  const {
    focalLengthMm,
    cropFactor,
    projectionType,
    lensMount = 'Canon EF',
    measuredOffsetMm,
  } = input;

  const ffd = MOUNT_FLANGE_DISTANCES[lensMount] || 44.0;
  const isDatabaseKnown = typeof measuredOffsetMm === 'number' && measuredOffsetMm > 0;

  let epdMountMm = 42;
  let physicalLandmark = '';
  let opticalGroupLocation = '';

  const proj = (projectionType || '').toUpperCase();

  if (isDatabaseKnown) {
    epdMountMm = measuredOffsetMm;
    if (proj.includes('FISHEYE') && proj.includes('CIRCULAR')) {
      physicalLandmark = 'Approximately 1.5mm behind the front gold ring / front outer crown';
      opticalGroupLocation = 'Entrance pupil sits immediately behind the curved front element';
    } else if (proj.includes('FISHEYE')) {
      physicalLandmark = 'Approximately 4mm - 8mm behind the outer front glass surface';
      opticalGroupLocation = 'Forward entrance pupil shifting slightly with extreme diagonal angles';
    } else {
      physicalLandmark = 'Inside front third of lens barrel behind the filter thread';
      opticalGroupLocation = 'Retrofocus virtual pupil inside front diverging optical group';
    }
  } else {
    // Optical physics formula based on focal length and crop factor:
    if (proj.includes('FISHEYE') && (proj.includes('CIRCULAR') || focalLengthMm <= 8.5)) {
      epdMountMm = Math.max(20, Math.round((38 + (focalLengthMm - 8) * 1.5) * 10) / 10);
      physicalLandmark = '1.0 - 2.5 mm behind the front curved glass surface (near the front gold ring)';
      opticalGroupLocation = 'Virtual pupil located right at the front entrance aperture behind outer meniscus';
    } else if (proj.includes('FISHEYE')) {
      epdMountMm = Math.max(25, Math.round((42 + (focalLengthMm - 10) * 1.8 + (cropFactor - 1.0) * 3) * 10) / 10);
      physicalLandmark = 'Around 4 - 8 mm behind the front element crown';
      opticalGroupLocation = 'Forward optical center, shifting slightly forward at steep diagonal incident rays';
    } else if (focalLengthMm <= 18) {
      // Ultra-Wide Rectilinear
      epdMountMm = Math.max(30, Math.round((ffd * 0.22 + focalLengthMm * 3.1 + (cropFactor - 1.0) * 3.5) * 10) / 10);
      physicalLandmark = 'Inside the barrel, typically 25 - 45 mm behind the front filter ring';
      opticalGroupLocation = 'Retrofocus virtual pupil inside the front diverging optical group';
    } else {
      // Standard Wide to Normal
      epdMountMm = Math.max(35, Math.round((28 + focalLengthMm * 1.4) * 10) / 10);
      physicalLandmark = 'Approximately mid-barrel between aperture diaphragm and front element';
      opticalGroupLocation = 'Near physical iris diaphragm plane';
    }
  }

  // Calculate rail positions across leading panoramic heads
  const manfrotto303Mm = Math.round(epdMountMm);
  const nodalNinja4Mm = Math.round(epdMountMm + (ffd >= 40 ? 0 : 4));
  const nodalNinja3Mm = Math.round(epdMountMm - (ffd >= 40 ? 2 : -2));
  const nodalNinja6Mm = Math.round(epdMountMm + 2);
  const sunwayfotoCr30Mm = Math.round(epdMountMm);
  const genericMm = Math.round(epdMountMm + 15);

  // Parallax error calculation:
  // For 5mm rail misalignment at 45 deg pan:
  const misalignedMm = 5;
  const sin45 = Math.sin((45 * Math.PI) / 180);
  const dy = misalignedMm * sin45; // 3.535 mm lateral offset

  // Parallax angular error at 1.0m foreground vs 5.0m background:
  const angleRad1m = Math.atan2(dy, 1000) - Math.atan2(dy, 5000);
  const angleDeg1m = (angleRad1m * 180) / Math.PI;

  // Parallax angular error at 0.5m foreground vs 5.0m background:
  const angleRadHalfM = Math.atan2(dy, 500) - Math.atan2(dy, 5000);
  const angleDegHalfM = (angleRadHalfM * 180) / Math.PI;

  // Typical image: 6000px sensor with 110 deg HFOV:
  const pxPerDeg = 6000 / 110;
  const pxError1m = Math.round(angleDeg1m * pxPerDeg * 10) / 10;
  const pxErrorHalfM = Math.round(angleDegHalfM * pxPerDeg * 10) / 10;

  return {
    estimatedEpdMountMm: epdMountMm,
    isDatabaseKnown,
    opticalGroupLocation,
    physicalLandmark,
    flangeFocalDistanceMm: ffd,
    entrancePupilFromSensorMm: Math.round((epdMountMm + ffd) * 10) / 10,
    upperRailByPanoHead: {
      manfrotto303Mm,
      nodalNinja4Mm,
      nodalNinja3Mm,
      nodalNinja6Mm,
      sunwayfotoCr30Mm,
      genericMm,
    },
    lowerRailCenteringMm: 52,
    parallaxErrorAt1mFor5mmOffsetPx: pxError1m,
    parallaxErrorAtHalfMeterFor5mmOffsetPx: pxErrorHalfM,
  };
}

/**
 * Calculates entrance pupil (no-parallax point) positioning and panoramic head rail guidelines.
 */
export function calculateNodalAlignment(
  camera: CameraSpec,
  lens: LensSpec,
  subjectDistanceM: number = 0.5,
  panoHead?: PanoHeadSpec
): NodalCalibrationResult {
  // If the lens has a documented entrance pupil offset:
  const offsetMm = lens.entrancePupilOffsetMm || 45;

  let upperRail = offsetMm + 20;
  let lowerRail = 52; // typical DSLR / Mirrorless center offset
  let reference = 'Measured from lens front / gold index band';
  let railWarning: string | undefined;

  let checklist: string[] = [
    'Mount camera in portrait orientation on the panoramic head vertical arm.',
    'Align lower rail so lens centerline is centered directly over the panoramic panning base.',
    'Place a vertical foreground reference (e.g. window frame or vertical tape) 1m away, and a background reference 5m away.',
    'Rotate panoramic head left and right through the viewfinder / live view.',
    'Slide the upper rail forward/backward until the foreground and background references do not shift relative to each other.',
    'Tighten all rail thumb-screws and lock detent rotator ring.',
  ];

  if (panoHead) {
    if (panoHead.isRingClamp) {
      upperRail = 0;
      lowerRail = 0;
      reference = `Custom lens collar clamp set directly to ${lens.model} NPP`;
      checklist = [
        `Fit the ${panoHead.model} custom ring clamp around the lens barrel at the NPP index line.`,
        'Mount the ring clamp directly onto the indexing rotator base.',
        'No rail measurements required; entrance pupil is factory pre-centered over the pivot.',
        `Configure the detent rotator to ${panoHead.rotatorDetentOptions}.`,
        'Rotate through shots with zero parallax risk on nearby subjects.',
      ];
    } else if (panoHead.isSlant) {
      reference = `Slant 60° elevation arm with entrance pupil on optical axis`;
      checklist = [
        `Mount camera onto the ${panoHead.model} 60° pre-angled slant bracket.`,
        'Set upper sliding rail so lens front entrance pupil is aligned with the slant pivot axis.',
        'The 60° angle projects sensor corner FOV upward and downward simultaneously.',
        'Take 3 to 4 shots around to cover the entire 360° × 180° sphere with minimal zenith/nadir patching.',
        'Tighten all angle lock screws before starting exposure sequence.',
      ];
    } else {
      if (panoHead.upperRailMaxMm && upperRail > panoHead.upperRailMaxMm) {
        railWarning = `Warning: Calculated upper rail offset (${upperRail}mm) approaches or exceeds maximum rail length (${panoHead.upperRailMaxMm}mm) on ${panoHead.model}. A rail extender plate may be required for long lenses.`;
      }
      checklist = [
        `Mount camera in portrait orientation on the ${panoHead.brand} ${panoHead.model} vertical arm.`,
        `Set lower rail to approx. ${lowerRail}mm to center lens optical axis directly over the rotator pivot.`,
        `Slide upper rail to approx. ${upperRail}mm (${panoHead.setupMethod}).`,
        `Select appropriate detent click-stop ring on rotator (${panoHead.rotatorDetentOptions}).`,
        'Verify alignment by panning between near reference (doorframe) and far reference (wall).',
        'Lock all thumb-screws and Arca clamps securely before rotation.',
      ];
    }
  }

  // Parallax sensitivity:
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
    entrancePupilReference: reference,
    upperRailSettingMm: upperRail,
    lowerRailSettingMm: lowerRail,
    railWarning,
    parallaxSensitivityRating: sensitivity,
    parallaxExplanation: explanation,
    alignmentChecklist: checklist,
  };
}
