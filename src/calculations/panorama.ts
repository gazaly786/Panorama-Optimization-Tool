import { CameraSpec, LensSpec, PanoramaCoverage } from '../types';
import { calculateFov, FovResult } from './fov';

export interface PanoramaGeometryResult {
  // Field of view in camera shooting orientation (portrait recommended for panos)
  effectiveHfovDeg: number;
  effectiveVfovDeg: number;
  cameraOrientation: 'PORTRAIT' | 'LANDSCAPE';

  // Horizontal rotation
  overlapPct: number;
  overlapCategory: 'MINIMAL (10-15%)' | 'RECOMMENDED (20-35%)' | 'HIGH (35-50%)' | 'VERY HIGH (50%+)';
  recommendedRotationDeg: number;
  exactMathShots: number;
  shotsPerCircle: number;
  rotatorClickStopDeg: number;
  actualOverlapPct: number;

  // Multi-row and Vertical coverage
  coverageType: PanoramaCoverage;
  numRows: number;
  rowPitchesDeg: number[];
  shotsPerRow: number[];
  totalShots: number;
  zenithCovered: boolean;
  nadirCovered: boolean;
  nadirShotRecommended: boolean;
  zenithShotRecommended: boolean;

  // Estimated Resolution
  estimatedPanoWidthPx: number;
  estimatedPanoHeightPx: number;
  estimatedMegapixels: number;
  stitchingMarginAssessment: 'MARGINAL' | 'GOOD' | 'EXCELLENT' | 'EXCESSIVE';
}

// Common click-stop rotator detents on panoramic heads (e.g. Nodal Ninja, Fanotec, Leofoto)
const STANDARD_ROTATOR_STOPS = [90, 60, 45, 36, 30, 24, 20, 18, 15, 12, 10, 8, 6, 5];

/**
 * Calculates complete panorama shooting geometry, shot counts, rows, and estimated resolution.
 */
export function calculatePanoramaGeometry(
  camera: CameraSpec,
  lens: LensSpec,
  focalLengthMm: number,
  targetOverlapPct: number, // 0.10 to 0.50
  coverage: PanoramaCoverage = '360x180',
  preferPortraitOrientation = true,
  customShotsPerCircle?: number
): PanoramaGeometryResult {
  const fov = calculateFov(camera, lens, focalLengthMm);

  // In panorama photography, cameras are standardly mounted in PORTRAIT (vertical) orientation
  // on a panoramic head to maximize vertical coverage in a single horizontal row.
  let frameHfov: number;
  let frameVfov: number;

  if (fov.isFisheye && (lens.projectionType === 'fisheye_circular' || fov.horizontalDeg >= 130)) {
    // Fisheyes: frame orientation is usually horizontal or square-like coverage
    frameHfov = fov.horizontalDeg;
    frameVfov = fov.verticalDeg;
  } else if (preferPortraitOrientation) {
    // Portrait: camera turned 90 degrees
    frameHfov = fov.verticalDeg;
    frameVfov = fov.horizontalDeg;
  } else {
    frameHfov = fov.horizontalDeg;
    frameVfov = fov.verticalDeg;
  }

  // Ensure minimum realistic FOV
  frameHfov = Math.max(10, frameHfov);
  frameVfov = Math.max(10, frameVfov);

  // Theoretical rotation angle per shot:
  // Rotation angle = frameHfov * (1 - overlap)
  const clampedOverlap = Math.min(0.60, Math.max(0.10, targetOverlapPct));
  const rawAngle = frameHfov * (1 - clampedOverlap);
  const rawShots = 360 / rawAngle;

  // Find standard click stop that yields at least rawShots or safe practical count
  let shotsPerCircle = Math.ceil(rawShots);
  let bestStop = 360 / shotsPerCircle;

  // If user specified custom shots count (e.g. 4, 6, 8, etc.)
  if (customShotsPerCircle && customShotsPerCircle >= 3) {
    shotsPerCircle = Math.round(customShotsPerCircle);
    bestStop = Math.round((360 / shotsPerCircle) * 10) / 10;
  } else {
    // For fisheye lenses, standard practical counts are 3, 4, 6, or 8 shots around
    if (fov.isFisheye) {
      if (frameHfov >= 170) {
        shotsPerCircle = Math.max(3, shotsPerCircle);
      } else if (frameHfov >= 130) {
        // e.g. Sigma 8mm on APS-C (Canon 90D): 6 shots around @ 60 deg is gold standard
        shotsPerCircle = Math.max(6, shotsPerCircle);
      } else {
        shotsPerCircle = Math.max(6, shotsPerCircle);
      }
    }

    // Snap to nearest integer divisor of 360 if available
    bestStop = 360 / shotsPerCircle;
    for (const stop of STANDARD_ROTATOR_STOPS) {
      const candidateShots = 360 / stop;
      if (candidateShots >= shotsPerCircle) {
        bestStop = stop;
        shotsPerCircle = candidateShots;
        break;
      }
    }
  }

  // Exact rotation angle and resulting actual overlap
  const rotationDeg = Math.round((360 / shotsPerCircle) * 10) / 10;
  const actualOverlapPct = Math.round((1 - (rotationDeg / frameHfov)) * 100);

  // Overlap category
  let overlapCategory: PanoramaGeometryResult['overlapCategory'] = 'RECOMMENDED (20-35%)';
  if (actualOverlapPct < 20) overlapCategory = 'MINIMAL (10-15%)';
  else if (actualOverlapPct <= 35) overlapCategory = 'RECOMMENDED (20-35%)';
  else if (actualOverlapPct <= 50) overlapCategory = 'HIGH (35-50%)';
  else overlapCategory = 'VERY HIGH (50%+)';

  // Multi-row and Vertical Coverage Calculation
  // 360x180 spherical needs 180° vertical coverage (Zenith +90° to Nadir -90°)
  let numRows = 1;
  let rowPitchesDeg: number[] = [0];
  let shotsPerRow: number[] = [shotsPerCircle];
  let zenithCovered = false;
  let nadirCovered = false;
  let zenithShotRecommended = false;
  let nadirShotRecommended = true; // Always recommended for tripod removal patch

  if (coverage === '360x180') {
    if (frameVfov >= 170) {
      // Circular or full frame fisheye with huge VFOV
      numRows = 1;
      rowPitchesDeg = [0];
      shotsPerRow = [shotsPerCircle];
      zenithCovered = true;
      nadirCovered = true;
      zenithShotRecommended = false;
      nadirShotRecommended = true; // For tripod removal
    } else if (frameVfov >= 95) {
      // e.g. Sigma 8mm on APS-C (VFOV ~ 100°-110°)
      // 1 horizontal row at 0° covers from -50° to +50°.
      // Zenith needs +90° (1 shot), Nadir needs -90° (1-2 shots)
      numRows = 1;
      rowPitchesDeg = [0];
      shotsPerRow = [shotsPerCircle];
      zenithCovered = false;
      nadirCovered = false;
      zenithShotRecommended = true;
      nadirShotRecommended = true;
    } else {
      // Rectilinear wide-angle or short telephoto: requires multi-row!
      // Total vertical span required: 180 deg.
      // Vertical step with vertical overlap:
      const vStep = frameVfov * (1 - clampedOverlap);
      const neededRows = Math.ceil(180 / vStep);

      if (neededRows <= 2) {
        numRows = 2;
        rowPitchesDeg = [30, -30];
        shotsPerRow = [shotsPerCircle, shotsPerCircle];
        zenithShotRecommended = frameVfov < 60;
        nadirShotRecommended = true;
      } else if (neededRows <= 3) {
        numRows = 3;
        rowPitchesDeg = [45, 0, -45];
        shotsPerRow = [
          Math.max(4, Math.round(shotsPerCircle * 0.7)),
          shotsPerCircle,
          Math.max(4, Math.round(shotsPerCircle * 0.7)),
        ];
        zenithShotRecommended = true;
        nadirShotRecommended = true;
      } else {
        numRows = 5;
        rowPitchesDeg = [60, 30, 0, -30, -60];
        shotsPerRow = [
          Math.max(4, Math.round(shotsPerCircle * 0.5)),
          Math.max(6, Math.round(shotsPerCircle * 0.8)),
          shotsPerCircle,
          Math.max(6, Math.round(shotsPerCircle * 0.8)),
          Math.max(4, Math.round(shotsPerCircle * 0.5)),
        ];
        zenithShotRecommended = true;
        nadirShotRecommended = true;
      }
    }
  } else if (coverage === '360_cylindrical') {
    numRows = 1;
    rowPitchesDeg = [0];
    shotsPerRow = [shotsPerCircle];
    zenithCovered = false;
    nadirCovered = false;
    zenithShotRecommended = false;
    nadirShotRecommended = false;
  }

  // Total shots calculation
  let totalShots = shotsPerRow.reduce((acc, curr) => acc + curr, 0);
  if (zenithShotRecommended) totalShots += 1;
  if (nadirShotRecommended) totalShots += 1;

  // Stitching margin assessment
  let stitchingMargin: PanoramaGeometryResult['stitchingMarginAssessment'] = 'GOOD';
  if (actualOverlapPct < 18) stitchingMargin = 'MARGINAL';
  else if (actualOverlapPct <= 35) stitchingMargin = 'GOOD';
  else if (actualOverlapPct <= 50) stitchingMargin = 'EXCELLENT';
  else stitchingMargin = 'EXCESSIVE';

  // Estimated Panorama Resolution (Equirectangular 2:1)
  // Angular resolution calculation:
  // Center pixel angular pitch = 2 * atan(pixelPitchUm / (2 * focalLength * 1000))
  const [nativeW, nativeH] = camera.nativeResolution;
  const longerDim = preferPortraitOrientation ? nativeH : nativeW;
  const effectiveFocal = focalLengthMm * camera.cropFactor;

  // Equirectangular width = (360 / frameHfov) * longerDim * (1 - overlap_correction)
  // Or standard theoretical equirectangular 360 width:
  // Width ≈ 2 * PI * focalLength_in_pixels
  const focalInPixels = (longerDim / (camera.sensorWidthMm)) * focalLengthMm;
  const rawPanoWidth = Math.round(2 * Math.PI * focalInPixels * (fov.isFisheye ? 0.85 : 0.92));
  
  // Bound to realistic stitching software outputs (PTGui/Hugin)
  const panoWidth = Math.max(6000, Math.min(120000, Math.round(rawPanoWidth / 100) * 100));
  const panoHeight = Math.round(panoWidth / 2);
  const megapixels = Math.round((panoWidth * panoHeight) / 10000) / 100;

  return {
    effectiveHfovDeg: Math.round(frameHfov * 10) / 10,
    effectiveVfovDeg: Math.round(frameVfov * 10) / 10,
    cameraOrientation: preferPortraitOrientation ? 'PORTRAIT' : 'LANDSCAPE',
    overlapPct: Math.round(clampedOverlap * 100),
    overlapCategory,
    recommendedRotationDeg: Math.round(rotationDeg * 10) / 10,
    exactMathShots: Math.round(rawShots * 10) / 10,
    shotsPerCircle,
    rotatorClickStopDeg: bestStop,
    actualOverlapPct: Math.max(10, actualOverlapPct),
    coverageType: coverage,
    numRows,
    rowPitchesDeg,
    shotsPerRow,
    totalShots,
    zenithCovered,
    nadirCovered,
    zenithShotRecommended,
    nadirShotRecommended,
    estimatedPanoWidthPx: panoWidth,
    estimatedPanoHeightPx: panoHeight,
    estimatedMegapixels: megapixels,
    stitchingMarginAssessment: stitchingMargin,
  };
}
