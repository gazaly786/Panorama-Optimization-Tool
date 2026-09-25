import {
  CameraSpec,
  LensSpec,
  PanoramaScenario,
  QualityPriority,
  OpticalCalculationResults,
} from '../types';
import { calculateFov } from './fov';
import { calculateDof, getCircleOfConfusionMm } from './dof';
import { calculateHyperfocalDistanceM } from './hyperfocal';
import { assessDiffraction, calculateAiryDiskUm } from './diffraction';
import { calculatePixelPitchUm } from './pixelPitch';
import { calculatePanoramaGeometry } from './panorama';
import { calculateExposure } from './exposure';

export interface OptimizerInputs {
  camera: CameraSpec;
  lens: LensSpec;
  scenario: PanoramaScenario;
  focalLengthMm?: number;
  subjectDistanceM?: number;
  targetOverlapPct?: number; // e.g. 0.30
  qualityPriority?: QualityPriority;
  tripodOn?: boolean;
  customAperture?: number;
  customIso?: number;
  customFocusDistanceM?: number;
  customCoCMm?: number;
}

/**
 * Core Optimization Engine:
 * Combines Camera + Lens + Scenario + Distance + Light + Quality Priority
 * to produce fully deterministic, optically justified panorama configurations.
 */
export function optimizePanoramaSettings(inputs: OptimizerInputs): OpticalCalculationResults {
  const {
    camera,
    lens,
    scenario,
    tripodOn = true,
    qualityPriority = scenario.qualityPriority || 'MAXIMUM_QUALITY',
    customCoCMm,
  } = inputs;

  const focalLengthMm = inputs.focalLengthMm || lens.focalLengthMinMm;
  const subjectDistanceM = inputs.subjectDistanceM !== undefined ? inputs.subjectDistanceM : scenario.defaultSubjectDistanceM;
  const targetOverlap = inputs.targetOverlapPct !== undefined ? inputs.targetOverlapPct : (scenario.recommendedOverlapPct / 100);

  // 1. Circle of Confusion and Pixel Pitch
  const cocMm = getCircleOfConfusionMm(camera, customCoCMm);
  const pixelPitchUm = calculatePixelPitchUm(camera);

  // 2. Determine Optimal Aperture
  // Test candidate apertures [f/4, f/5.6, f/8, f/11, f/16]
  let recommendedAperture: number;

  if (inputs.customAperture && inputs.customAperture > 0) {
    recommendedAperture = inputs.customAperture;
  } else {
    // For wide/fisheye lenses (<= 12mm), depth of field at f/8 is already immense (often near limit < 0.6m).
    // f/16 causes severe diffraction on modern dense sensors (like 90D with 3.2um pixels).
    // Therefore f/8 or f/5.6 is the optical sweet spot.
    if (focalLengthMm <= 10) {
      if (qualityPriority === 'MAXIMUM_QUALITY') {
        recommendedAperture = 8.0; // Perfect balance of DOF + sharpness for 8mm fisheyes
      } else if (qualityPriority === 'FAST') {
        recommendedAperture = 5.6; // Slightly more light, faster shutter
      } else {
        recommendedAperture = 8.0;
      }
    } else if (focalLengthMm <= 18) {
      recommendedAperture = 8.0;
    } else if (focalLengthMm <= 35) {
      recommendedAperture = qualityPriority === 'MAXIMUM_QUALITY' ? 11.0 : 8.0;
    } else {
      recommendedAperture = 11.0;
    }
  }

  // 3. Hyperfocal and Focus Distance
  const H_m = calculateHyperfocalDistanceM(focalLengthMm, recommendedAperture, cocMm);
  const H_near_m = H_m / 2;

  let focusDistanceM: number;
  if (inputs.customFocusDistanceM && inputs.customFocusDistanceM > 0) {
    focusDistanceM = inputs.customFocusDistanceM;
  } else {
    // Recommendation strategy:
    // If subject is very close (e.g. 1.0m) and H is short (like 0.5m on 8mm),
    // focusing at ~1.2m ensures foreground at 0.5m is sharp while infinity remains razor sharp!
    if (focalLengthMm <= 10) {
      // For ultra-wide / fisheye (Sigma 8mm, etc.), 1.2m to 1.5m is the sweet-spot focus
      focusDistanceM = Math.max(1.2, Math.min(subjectDistanceM, H_m * 1.5));
    } else {
      // For longer lenses, focus at hyperfocal or slightly beyond foreground
      focusDistanceM = Math.min(Math.max(subjectDistanceM, H_m), 15);
    }
  }

  // 4. Calculate Depth of Field
  const dof = calculateDof(focalLengthMm, recommendedAperture, focusDistanceM, cocMm);

  // 5. Diffraction Assessment
  const diffraction = assessDiffraction(recommendedAperture, camera, lens);

  // 6. Panorama Field of View and Rotation Geometry
  const fov = calculateFov(camera, lens, focalLengthMm);
  const panoGeo = calculatePanoramaGeometry(
    camera,
    lens,
    focalLengthMm,
    targetOverlap,
    '360x180',
    true // portrait orientation
  );

  // 7. Exposure, ISO, Shutter, Vibration
  const exposure = calculateExposure(
    camera,
    recommendedAperture,
    scenario.lightLevelEv,
    tripodOn,
    scenario.name.includes('People'),
    qualityPriority,
    inputs.customIso
  );

  // 8. HDR / AEB Strategy
  // If scenario has windows or high contrast (Interior, Sunset, Hotel) and camera supports AEB
  let aebRecommended = false;
  let aebFrames = 1;
  let aebEvStep = 2;

  if (scenario.recommendedAeb.enabled && camera.aebCapability) {
    aebRecommended = true;
    if (qualityPriority === 'MAXIMUM_QUALITY') {
      aebFrames = Math.min(camera.maxAebFrameCount >= 5 ? 5 : 3, 5);
      aebEvStep = Math.min(camera.maxAebRangeEv >= 2 ? 2 : 1, 2);
    } else {
      aebFrames = 3;
      aebEvStep = Math.min(camera.maxAebRangeEv >= 2 ? 2 : 1, 2);
    }
  }

  // 9. Warnings & Advisory Checks
  const warnings: string[] = [];
  if (diffraction.warning) warnings.push(diffraction.warning);
  if (exposure.handheldBlurWarning) warnings.push(exposure.handheldBlurWarning);
  if (exposure.subjectMotionWarning) warnings.push(exposure.subjectMotionWarning);
  if (panoGeo.stitchingMarginAssessment === 'MARGINAL') {
    warnings.push('Low overlap warning: Actual overlap is under 18%. Featureless ceilings or plain walls may fail to stitch automatically.');
  }
  if (focusDistanceM < H_near_m) {
    warnings.push(`Focus distance (${focusDistanceM.toFixed(2)}m) is closer than the near hyperfocal limit (${H_near_m.toFixed(2)}m). Background elements at infinity will not be critically sharp.`);
  }

  // 10. Clear Explanations
  const explanations = {
    aperture: {
      value: `f/${recommendedAperture}`,
      why: focalLengthMm <= 10
        ? `Provides vast depth of field (${dof.nearLimitM}m to ${dof.farLimitM === 'Infinity' ? '∞' : dof.farLimitM + 'm'}) while maintaining low diffraction on the ${camera.megapixels}MP sensor.`
        : `Provides necessary depth of field to keep the room in focus while avoiding excessive diffraction blurring.`,
      tradeOff: `Using f/16 would increase diffraction blurring on the ${pixelPitchUm.toFixed(1)}μm pixels without meaningful gain in foreground sharpness. Using f/4 would soften the edges and narrow the depth of field.`,
      alternative: `f/5.6 if shooting in low light without a tripod; f/11 only if critical foreground elements are closer than 0.5m.`,
    },
    focus: {
      value: `~${focusDistanceM.toFixed(1)} m`,
      why: `Focusing at ~${focusDistanceM.toFixed(1)}m places the near limit of sharpness at ${dof.nearLimitM}m and carries critical sharpness all the way to infinity.`,
      tradeOff: `Focusing directly on infinity wastes the near depth of field. Focusing too close softens distant walls and ceilings.`,
      alternative: `Focus at hyperfocal distance (${H_m.toFixed(2)}m) or use Live View 10x magnification on a subject 1.5m away, then lock to Manual Focus.`,
    },
    iso: {
      value: `${exposure.iso}`,
      why: `Base native ISO (${exposure.iso}) ensures the highest dynamic range, maximum color depth, and cleanest shadow recovery across stitched frames.`,
      tradeOff: `Requires a stable tripod and longer shutter time (${exposure.shutterSpeedFraction}).`,
      alternative: `ISO 400 - 800 only if shooting handheld or if people/curtains are moving rapidly.`,
    },
    shutter: {
      value: `${exposure.shutterSpeedFraction}`,
      why: `Correct exposure for scene brightness (EV ${scenario.lightLevelEv}) at f/${recommendedAperture} and ISO ${exposure.iso}.`,
      tradeOff: `Longer exposures require vibration suppression (self-timer, remote trigger, or electronic shutter).`,
      alternative: `Increase ISO or widen aperture if subject movement causes motion blur.`,
    },
    shotsAndRotation: {
      value: `${panoGeo.shotsPerCircle} shots around (${panoGeo.rotatorClickStopDeg}° detent)`,
      why: `With an effective horizontal angle of view of ${panoGeo.effectiveHfovDeg}°, ${panoGeo.shotsPerCircle} shots yields ~${panoGeo.actualOverlapPct}% overlap, perfectly matching the ${panoGeo.rotatorClickStopDeg}° click-stop on standard panoramic rotators.`,
      tradeOff: `Fewer shots risks stitching gaps or poor control point matching; more shots increases capture and stitching processing time.`,
      alternative: `8 shots around (45° detent) for extra safety in texture-poor white rooms.`,
    },
    overlap: {
      value: `~${panoGeo.actualOverlapPct}%`,
      why: `Provides sufficient redundant image area for stitching algorithms (PTGui, Hugin) to identify feature keypoints and blend exposure seamlessly.`,
      tradeOff: `Overlaps below 20% risk stitch failures on plain walls. Overlaps above 45% increase file count and processing time unnecessarily.`,
      alternative: `35–40% if the room has blank, painted white walls or smooth ceilings.`,
    },
    aeb: {
      value: aebRecommended ? `${aebFrames} frames ±${aebEvStep} EV` : 'OFF (Single Frame RAW)',
      why: aebRecommended
        ? `The scene's dynamic range (e.g. windows vs dark interior corners) exceeds a single sensor exposure. Exposure bracketing captures highlight window views and deep shadows.`
        : `Single frame RAW capture provides sufficient dynamic range under even lighting without ghosting.`,
      tradeOff: `AEB triples file count and storage; requires HDR merging software.`,
      alternative: `5 frames ±2 EV for high-contrast architectural exteriors with backlit windows.`,
    },
    workflow: {
      value: 'TRIPOD + MANUAL LOCK',
      why: `Consistent exposure, locked white balance, and locked manual focus are mandatory so adjacent tiles blend without visible exposure seams or color shifts.`,
      tradeOff: `Requires manual setup on location; eliminates the convenience of automatic camera modes.`,
      alternative: `None. Automatic exposure or autofocus between panorama tiles is the #1 cause of ruined panoramas.`,
    },
  };

  // 11. Step-by-Step Shooting Checklist
  const checklist: string[] = [
    `Mount ${camera.model} securely on the panoramic tripod head in portrait orientation.`,
    'Level the tripod base using the bubble level before attaching or rotating the camera.',
    `Set panoramic head upper rail to the lens entrance pupil offset (~${inputs.lens.entrancePupilOffsetMm || 45}mm) to eliminate parallax.`,
    `Set camera Exposure Mode to MANUAL (M). Set shutter to ${exposure.shutterSpeedFraction}, aperture to f/${recommendedAperture}, ISO to ${exposure.iso}.`,
    `Lock White Balance to ${exposure.whiteBalanceDescription}. Never use Auto White Balance.`,
    `Focus at approx ${focusDistanceM.toFixed(1)}m using Live View 10x magnification.`,
    'Switch lens/camera focus switch to MANUAL FOCUS (MF). Tape focus ring if necessary to prevent accidental shifts.',
    camera.ibis ? 'Turn OFF In-Body Image Stabilization (IBIS) and Lens Optical Stabilization to prevent sensor drift.' : 'Ensure stabilization is off on tripod.',
    aebRecommended ? `Enable Auto Exposure Bracketing (AEB): ${aebFrames} shots spaced ±${aebEvStep} EV.` : 'Ensure single-shot RAW capture is selected.',
    camera.selfTimerSeconds.includes(2) ? 'Set Self-Timer to 2 seconds or use a remote shutter release to eliminate finger vibration.' : 'Use remote trigger or cable release.',
    `Rotate the rotator to 0° and take the first shot (or bracket sequence).`,
    `Rotate by ${panoGeo.rotatorClickStopDeg}° for each subsequent shot around the 360° circle (total ${panoGeo.shotsPerCircle} positions).`,
    panoGeo.zenithShotRecommended ? 'Tilt head up to +90° and take 1 Zenith shot to cap the ceiling/sky.' : 'Verify ceiling coverage in standard row.',
    panoGeo.nadirShotRecommended ? 'Tilt head down to -90° (Nadir) or step aside and shoot a handheld/offset ground patch for clean tripod removal.' : 'Verify ground coverage.',
    'Inspect histogram of first and last shot on LCD to verify no clipped highlights and consistent exposure.',
  ];

  return {
    effectiveFocalLengthMm: fov.effectiveFocalLengthMm,
    horizontalFovDeg: panoGeo.effectiveHfovDeg,
    verticalFovDeg: panoGeo.effectiveVfovDeg,
    diagonalFovDeg: fov.diagonalDeg,
    isFisheye: fov.isFisheye,

    circleOfConfusionMm: cocMm,
    hyperfocalDistanceM: H_m,
    hyperfocalNearLimitM: H_near_m,
    nearLimitM: typeof dof.nearLimitM === 'number' ? dof.nearLimitM : 0.5,
    farLimitM: typeof dof.farLimitM === 'number' ? dof.farLimitM : 999,
    totalDofM: dof.totalDofM,
    focusDistanceM,
    recommendedFocusDistanceM: focusDistanceM,
    focusMode: 'MANUAL + LOCK',

    pixelPitchUm,
    airyDiskDiameterUm: diffraction.airyDiskDiameterUm,
    diffractionLimitAperture: diffraction.diffractionLimitOnsetAperture,
    diffractionStatus: diffraction.status,
    diffractionWarning: diffraction.warning,
    expectedSharpness: diffraction.expectedSharpness,

    shotsPerCircle: panoGeo.shotsPerCircle,
    rotationIncrementDeg: panoGeo.rotatorClickStopDeg,
    numRows: panoGeo.numRows,
    rowPitchesDeg: panoGeo.rowPitchesDeg,
    shotsPerRow: panoGeo.shotsPerRow,
    totalShots: panoGeo.totalShots,
    overlapPct: panoGeo.actualOverlapPct,
    effectiveCoverageH: 360,
    effectiveCoverageV: panoGeo.numRows === 1 && fov.isFisheye ? 180 : 180,
    zenithCovered: panoGeo.zenithCovered,
    nadirCovered: panoGeo.nadirCovered,
    nadirShotRecommended: panoGeo.nadirShotRecommended,
    estimatedPanoWidthPx: panoGeo.estimatedPanoWidthPx,
    estimatedPanoHeightPx: panoGeo.estimatedPanoHeightPx,
    estimatedMegapixels: panoGeo.estimatedMegapixels,

    recommendedAperture,
    recommendedApertureString: `f/${recommendedAperture}`,
    recommendedIso: exposure.iso,
    recommendedShutterSpeed: exposure.shutterSpeedFraction,
    recommendedShutterSeconds: exposure.shutterSeconds,
    evScene: scenario.lightLevelEv,
    whiteBalance: exposure.whiteBalanceDescription,
    aebFrames,
    aebEvStep,
    aebRecommended,
    tripodMode: tripodOn,
    vibrationMitigation: exposure.vibrationMitigation,

    explanations,
    checklist,
    warnings,
  };
}
