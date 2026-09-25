import { CameraSpec, LensSpec, ProjectionType } from '../types';

export interface FovResult {
  horizontalDeg: number;
  verticalDeg: number;
  diagonalDeg: number;
  isFisheye: boolean;
  effectiveFocalLengthMm: number;
  cropFactor: number;
  projectionDescription: string;
}

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

/**
 * Calculates accurate Field of View for Rectilinear and Fisheye lenses.
 * Accounts for sensor dimensions (crop factor) and lens projection model.
 */
export function calculateFov(
  camera: CameraSpec,
  lens: LensSpec,
  currentFocalLengthMm?: number
): FovResult {
  const f = currentFocalLengthMm || lens.focalLengthMinMm;
  const sw = camera.sensorWidthMm;
  const sh = camera.sensorHeightMm;
  const sd = camera.sensorDiagonalMm;
  const crop = camera.cropFactor;
  const effFocal = f * crop;

  const isFisheye = lens.projectionType.startsWith('fisheye');

  if (!isFisheye) {
    // Standard rectilinear projection: r = f * tan(theta) => theta = atan(r / f)
    // Dimension is full width/height/diagonal, so angle = 2 * atan(dim / (2 * f))
    const hDeg = 2 * Math.atan(sw / (2 * f)) * RAD_TO_DEG;
    const vDeg = 2 * Math.atan(sh / (2 * f)) * RAD_TO_DEG;
    const dDeg = 2 * Math.atan(sd / (2 * f)) * RAD_TO_DEG;

    return {
      horizontalDeg: Math.min(179, Math.round(hDeg * 10) / 10),
      verticalDeg: Math.min(179, Math.round(vDeg * 10) / 10),
      diagonalDeg: Math.min(179, Math.round(dDeg * 10) / 10),
      isFisheye: false,
      effectiveFocalLengthMm: Math.round(effFocal * 10) / 10,
      cropFactor: crop,
      projectionDescription: 'Rectilinear (Standard Perspective)',
    };
  }

  // Fisheye calculations
  // If manufacturer specifies explicit FOV on this format or full frame, use optical mapping:
  const proj = lens.projectionType;
  let hAngle = 0;
  let vAngle = 0;
  let dAngle = 0;
  let desc = 'Fisheye';

  if (proj === 'fisheye_equisolid' || proj === 'fisheye_fullframe') {
    // Equisolid: r = 2 * f * sin(theta / 2)  =>  theta = 2 * asin(r / (2*f))
    desc = 'Fisheye (Equisolid Angle Projection)';
    const calcTheta = (r: number) => {
      const val = r / (2 * f);
      if (val >= 1) return 180;
      return 2 * Math.asin(val) * RAD_TO_DEG;
    };
    hAngle = calcTheta(sw / 2) * 2;
    vAngle = calcTheta(sh / 2) * 2;
    dAngle = calcTheta(sd / 2) * 2;
  } else if (proj === 'fisheye_equidistant' || proj === 'fisheye_circular') {
    // Equidistant: r = f * theta  =>  theta = r / f
    desc = 'Fisheye (Equidistant Projection)';
    const calcTheta = (r: number) => (r / f) * RAD_TO_DEG;
    hAngle = calcTheta(sw / 2) * 2;
    vAngle = calcTheta(sh / 2) * 2;
    dAngle = calcTheta(sd / 2) * 2;
  } else if (proj === 'fisheye_stereographic') {
    // Stereographic: r = 2 * f * tan(theta / 2)  =>  theta = 2 * atan(r / (2*f))
    desc = 'Fisheye (Stereographic Conformal Projection)';
    const calcTheta = (r: number) => 2 * Math.atan(r / (2 * f)) * RAD_TO_DEG;
    hAngle = calcTheta(sw / 2) * 2;
    vAngle = calcTheta(sh / 2) * 2;
    dAngle = calcTheta(sd / 2) * 2;
  } else if (proj === 'fisheye_orthographic') {
    // Orthographic: r = f * sin(theta)  =>  theta = asin(r / f)
    desc = 'Fisheye (Orthographic Projection)';
    const calcTheta = (r: number) => {
      const val = r / f;
      if (val >= 1) return 90;
      return Math.asin(val) * RAD_TO_DEG;
    };
    hAngle = calcTheta(sw / 2) * 2;
    vAngle = calcTheta(sh / 2) * 2;
    dAngle = calcTheta(sd / 2) * 2;
  } else {
    // Default fisheye estimation based on equisolid
    desc = 'Fisheye (Optical Estimate)';
    const calcTheta = (r: number) => {
      const val = r / (2 * f);
      if (val >= 1) return 180;
      return 2 * Math.asin(val) * RAD_TO_DEG;
    };
    hAngle = calcTheta(sw / 2) * 2;
    vAngle = calcTheta(sh / 2) * 2;
    dAngle = calcTheta(sd / 2) * 2;
  }

  // Adjust for circular fisheyes where full-circle angle is 180° across a specific diameter
  if (proj === 'fisheye_circular' && lens.manufacturerDFOV && lens.manufacturerDFOV >= 180) {
    // For 8mm circular fisheye (like Sigma 8mm), diagonal on full frame produces full circle of 180°
    // On APS-C (e.g. Canon 90D sw=22.3mm, sh=14.9mm), circle diameter is approx 12-14mm
    // Max angle is bounded by 180°
    hAngle = Math.min(180, Math.max(hAngle, 130));
    vAngle = Math.min(180, Math.max(vAngle, 90));
    dAngle = Math.min(180, Math.max(dAngle, 170));
  }

  // Bound fisheye angles to optical limits (typically max 180°-220°)
  const maxAllowable = 190;
  return {
    horizontalDeg: Math.min(maxAllowable, Math.round(hAngle * 10) / 10),
    verticalDeg: Math.min(maxAllowable, Math.round(vAngle * 10) / 10),
    diagonalDeg: Math.min(maxAllowable, Math.round(dAngle * 10) / 10),
    isFisheye: true,
    effectiveFocalLengthMm: Math.round(effFocal * 10) / 10,
    cropFactor: crop,
    projectionDescription: desc,
  };
}
