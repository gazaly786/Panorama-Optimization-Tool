export type SensorFormat = 
  | 'Full-Frame'
  | 'APS-C Canon'
  | 'APS-C (Nikon/Sony/Fuji)'
  | 'Micro Four Thirds'
  | '1 inch'
  | 'Medium Format 44x33';

export type ProjectionType = 
  | 'rectilinear'
  | 'fisheye_circular'
  | 'fisheye_fullframe'
  | 'fisheye_equidistant'
  | 'fisheye_equisolid'
  | 'fisheye_stereographic'
  | 'fisheye_orthographic';

export type VerificationStatus = 
  | 'MANUFACTURER DATA'
  | 'CALCULATED'
  | 'USER VERIFIED'
  | 'ESTIMATED OPTICAL MODEL'
  | 'MEASURED LENS DATA'
  | 'AI-INFERRED';

export interface ProvenanceInfo {
  source: string;
  sourceUrl?: string;
  dateVerified?: string;
  status: VerificationStatus;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface CameraSpec {
  id: string;
  brand: string;
  model: string;
  cameraType: 'DSLR' | 'Mirrorless' | 'Medium Format' | 'Compact';
  sensorFormat: SensorFormat;
  sensorWidthMm: number;
  sensorHeightMm: number;
  sensorDiagonalMm: number;
  cropFactor: number;
  megapixels: number;
  nativeResolution: [number, number]; // [width, height]
  pixelPitchUm: number;
  isoRange: [number, number]; // [min, max]
  nativeIso: number;
  extendedIso?: [number, number];
  dynamicRangeEv?: number;
  rawSupport: boolean;
  rawBitDepth?: number;
  ibis: boolean;
  mechanicalShutter: boolean;
  electronicShutter: boolean;
  maxShutterSpeed: string; // e.g. "1/8000" or "1/16000"
  minShutterSpeed: string; // e.g. "30s"
  aebCapability: boolean;
  maxAebRangeEv: number; // e.g. 3 for +/- 3 EV
  maxAebFrameCount: number; // e.g. 7 frames
  mirrorLockUp: boolean;
  efcs: boolean; // Electronic Front Curtain Shutter
  selfTimerSeconds: number[]; // e.g. [2, 10]
  remoteTriggerSupport: boolean;
  lensMount: string;
  dimensionsMm?: [number, number, number]; // [W, H, D]
  weightG?: number;
  isCustom?: boolean;
  provenance: ProvenanceInfo;
}

export interface LensSpec {
  id: string;
  brand: string;
  model: string;
  focalLengthMinMm: number;
  focalLengthMaxMm: number; // same as min for primes
  maxAperture: number; // e.g. 3.5
  minAperture: number; // e.g. 22
  lensMount: string;
  sensorCompatibility: SensorFormat[];
  projectionType: ProjectionType;
  manufacturerHFOV?: number; // degrees
  manufacturerVFOV?: number; // degrees
  manufacturerDFOV?: number; // degrees
  minFocusDistanceM: number;
  maxMagnification?: number;
  filterSupport: boolean;
  filterThreadMm?: number | null;
  opticalStabilization: boolean;
  weightG?: number;
  dimensionsMm?: [number, number]; // [diameter, length]
  sweetSpotAperture?: string; // e.g. "f/5.6 - f/8"
  sharpnessProfile?: Record<string, 'fair' | 'good' | 'high' | 'peak' | 'diffraction_reduced'>;
  entrancePupilOffsetMm?: number; // Entrance pupil / nodal point distance from lens front or mount
  isCustom?: boolean;
  provenance: ProvenanceInfo;
}

export interface PanoramaScenario {
  id: string;
  name: string;
  category: 'Interior' | 'Exterior' | 'Commercial' | 'Landscape' | 'Specialty';
  description: string;
  defaultSubjectDistanceM: number;
  lightLevelEv: number; // Approximate EV100
  recommendedAeb: { frames: number; evStep: number; enabled: boolean };
  qualityPriority: 'FAST' | 'BALANCED' | 'MAXIMUM_QUALITY';
  focusStrategy: 'HYPERFOCAL' | 'MANUAL_LOCKED' | 'SAFE_DISTANCE';
  recommendedOverlapPct: number;
  tripodRequired: boolean;
  notes: string;
}

export type QualityPriority = 'FAST' | 'BALANCED' | 'MAXIMUM_QUALITY';
export type PanoramaCoverage = '360x180' | '360_cylindrical' | 'partial_horizontal' | 'custom';
export type ExposureDialMode = 'M' | 'Tv' | 'Av' | 'P' | 'AUTO_SPORTS';

export interface UserRigPreset {
  id: string;
  name: string;
  description?: string;
  cameraId: string;
  lensId: string;
  focalLengthMm: number;
  scenarioId: string;
  subjectDistanceM: number;
  focusDistanceM?: number;
  aperture?: number;
  iso?: number;
  shutterSpeed?: string;
  overlapPct: number;
  qualityPriority: QualityPriority;
  tripodOn: boolean;
  panoramicHeadModel?: string;
  upperRailOffsetMm?: number;
  lowerRailOffsetMm?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OpticalCalculationResults {
  // Field of view
  effectiveFocalLengthMm: number;
  horizontalFovDeg: number;
  verticalFovDeg: number;
  diagonalFovDeg: number;
  isFisheye: boolean;

  // Depth of field & sharpness
  circleOfConfusionMm: number;
  hyperfocalDistanceM: number;
  hyperfocalNearLimitM: number;
  nearLimitM: number;
  farLimitM: number; // Infinity if beyond hyperfocal
  totalDofM: number | 'Infinite';
  focusDistanceM: number;
  recommendedFocusDistanceM: number;
  focusMode: 'MANUAL + LOCK' | 'HYPERFOCAL LOCK' | 'CONFIRM AF THEN LOCK MF';

  // Diffraction & Pixel Pitch
  pixelPitchUm: number;
  airyDiskDiameterUm: number;
  diffractionLimitAperture: number;
  diffractionStatus: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH';
  diffractionWarning?: string;
  expectedSharpness: 'POOR' | 'MODERATE' | 'GOOD' | 'HIGH' | 'PEAK' | 'DIFFRACTION LIMITED';

  // Panorama geometry
  shotsPerCircle: number;
  rotationIncrementDeg: number;
  numRows: number;
  rowPitchesDeg: number[];
  shotsPerRow: number[];
  totalShots: number;
  overlapPct: number;
  effectiveCoverageH: number;
  effectiveCoverageV: number;
  zenithCovered: boolean;
  nadirCovered: boolean;
  nadirShotRecommended: boolean;
  estimatedPanoWidthPx: number;
  estimatedPanoHeightPx: number;
  estimatedMegapixels: number;

  // Exposure & Stability
  recommendedAperture: number;
  recommendedApertureString: string;
  recommendedIso: number;
  recommendedShutterSpeed: string;
  recommendedShutterSeconds: number;
  evScene: number;
  whiteBalance: string;
  aebFrames: number;
  aebEvStep: number;
  aebRecommended: boolean;
  tripodMode: boolean;
  vibrationMitigation: {
    mirrorLockUp: boolean;
    efcs: boolean;
    electronicShutter: boolean;
    selfTimerSeconds: number;
    remoteShutter: boolean;
    stabilizationOff: boolean;
  };

  // Explanations & Checklist
  explanations: {
    aperture: { value: string; why: string; tradeOff: string; alternative: string };
    focus: { value: string; why: string; tradeOff: string; alternative: string };
    iso: { value: string; why: string; tradeOff: string; alternative: string };
    shutter: { value: string; why: string; tradeOff: string; alternative: string };
    shotsAndRotation: { value: string; why: string; tradeOff: string; alternative: string };
    overlap: { value: string; why: string; tradeOff: string; alternative: string };
    aeb: { value: string; why: string; tradeOff: string; alternative: string };
    workflow: { value: string; why: string; tradeOff: string; alternative: string };
  };
  checklist: string[];
  warnings: string[];
}
