import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CameraSpec,
  LensSpec,
  PanoHeadSpec,
  PanoramaScenario,
  QualityPriority,
  UserRigPreset,
  OpticalCalculationResults,
  PanoramaCoverage,
  ExposureDialMode,
} from '../types';
import { INITIAL_CAMERAS } from '../data/cameras';
import { INITIAL_LENSES } from '../data/lenses';
import { INITIAL_PANO_HEADS } from '../data/panoHeads';
import { PANORAMA_SCENARIOS } from '../data/scenarios';
import { optimizePanoramaSettings, OptimizerInputs } from '../calculations/recommendations';

interface PanoramaContextType {
  // Equipment lists
  cameras: CameraSpec[];
  lenses: LensSpec[];
  panoHeads: PanoHeadSpec[];
  scenarios: PanoramaScenario[];
  savedSetups: UserRigPreset[];

  // Active selections
  selectedCamera: CameraSpec;
  selectedLens: LensSpec;
  selectedPanoHead: PanoHeadSpec;
  selectedScenario: PanoramaScenario;
  currentFocalLengthMm: number;
  subjectDistanceM: number;
  focusDistanceM?: number;
  customAperture?: number;
  customIso?: number;
  targetOverlapPct: number;
  qualityPriority: QualityPriority;
  tripodOn: boolean;
  coverage: PanoramaCoverage;
  customCoCMm?: number;
  exposureDialMode: ExposureDialMode;
  customSceneEv?: number;
  customAebEnabled?: boolean;
  customAebFrames?: number;
  customAebEvStep?: number;
  customShotsPerCircle?: number;

  // Comparison selections
  comparisonCameraIds: string[];
  comparisonLensIds: string[];

  // Calculation results
  results: OpticalCalculationResults;

  // Setters
  setSelectedCamera: (camera: CameraSpec) => void;
  setSelectedLens: (lens: LensSpec) => void;
  setSelectedPanoHead: (head: PanoHeadSpec) => void;
  setSelectedScenario: (scenario: PanoramaScenario) => void;
  setCurrentFocalLengthMm: (fl: number) => void;
  setSubjectDistanceM: (dist: number) => void;
  setFocusDistanceM: (dist?: number) => void;
  setCustomAperture: (ap?: number) => void;
  setCustomIso: (iso?: number) => void;
  setTargetOverlapPct: (overlap: number) => void;
  setQualityPriority: (priority: QualityPriority) => void;
  setTripodOn: (on: boolean) => void;
  setCoverage: (cov: PanoramaCoverage) => void;
  setCustomCoCMm: (coc?: number) => void;
  setExposureDialMode: (mode: ExposureDialMode) => void;
  setCustomSceneEv: (ev?: number) => void;
  setCustomAebEnabled: (enabled?: boolean) => void;
  setCustomAebFrames: (frames?: number) => void;
  setCustomAebEvStep: (step?: number) => void;
  setCustomShotsPerCircle: (shots?: number) => void;
  upperRailOffsetMm: number;
  setUpperRailOffsetMm: (offset: number) => void;

  // Comparison actions
  toggleCameraComparison: (cameraId: string) => void;
  toggleLensComparison: (lensId: string) => void;

  // Database CRUD operations
  addCamera: (cam: CameraSpec) => void;
  updateCamera: (cam: CameraSpec) => void;
  deleteCamera: (id: string) => void;
  addLens: (lens: LensSpec) => void;
  updateLens: (lens: LensSpec) => void;
  deleteLens: (id: string) => void;
  addPanoHead: (head: PanoHeadSpec) => void;
  updatePanoHead: (head: PanoHeadSpec) => void;
  deletePanoHead: (id: string) => void;
  resetPanoHeadsToDefault: () => void;
  applyPanoHeadRecommendedSettings: (head?: PanoHeadSpec) => void;

  // Preset operations
  saveCurrentSetup: (name: string, description?: string) => void;
  loadSetup: (preset: UserRigPreset) => void;
  deleteSetup: (id: string) => void;
  clearAllSetups: () => void;
  resetSetupsToDefault: () => void;
  exportDatabaseJson: () => string;
  exportDatabaseCsv: () => { camerasCsv: string; lensesCsv: string; panoHeadsCsv: string };
  importDatabaseJson: (jsonString: string) => boolean;

  // Theme
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const PanoramaContext = createContext<PanoramaContextType | null>(null);

const STORAGE_KEYS = {
  CAMERAS: 'pano_optix_cameras',
  LENSES: 'pano_optix_lenses',
  PANO_HEADS: 'pano_optix_pano_heads',
  PRESETS: 'pano_optix_presets',
  THEME: 'pano_optix_theme',
  CURRENT_STATE: 'pano_optix_state',
};

const DEFAULT_PRESET: UserRigPreset = {
  id: 'preset-gazaly-canon90d-sigma8mm',
  name: 'Gazaly — Canon 90D + Sigma 8mm',
  description: 'Golden reference 360° panorama setup for high quality interior and real estate tours.',
  cameraId: 'canon-90d',
  lensId: 'sigma-8mm-f35-fisheye',
  focalLengthMm: 8,
  scenarioId: 'real-estate-interior',
  subjectDistanceM: 0.5,
  focusDistanceM: 1.2,
  aperture: 8,
  iso: 100,
  overlapPct: 30,
  qualityPriority: 'MAXIMUM_QUALITY',
  tripodOn: true,
  panoramicHeadModel: 'Manfrotto 303SPH',
  upperRailOffsetMm: 42,
  lowerRailOffsetMm: 52,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

export const PanoramaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initialize Cameras
  const [cameras, setCameras] = useState<CameraSpec[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CAMERAS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse cameras from local storage', e);
    }
    return INITIAL_CAMERAS;
  });

  // 2. Initialize Lenses
  const [lenses, setLenses] = useState<LensSpec[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LENSES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse lenses from local storage', e);
    }
    return INITIAL_LENSES;
  });

  // 3. Initialize Panoramic Heads Database
  const [panoHeads, setPanoHeads] = useState<PanoHeadSpec[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PANO_HEADS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse pano heads from local storage', e);
    }
    return INITIAL_PANO_HEADS;
  });

  // 4. Initialize Presets
  const [savedSetups, setSavedSetups] = useState<UserRigPreset[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PRESETS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse presets from local storage', e);
    }
    return [DEFAULT_PRESET];
  });

  // 5. Default selections: Canon 90D + Sigma 8mm Fisheye + Nodal Ninja 4
  const [selectedCamera, setSelectedCameraState] = useState<CameraSpec>(() => {
    return cameras.find(c => c.id === 'canon-90d') || cameras[0];
  });

  const [selectedLens, setSelectedLensState] = useState<LensSpec>(() => {
    return lenses.find(l => l.id === 'sigma-8mm-f35-fisheye') || lenses[0];
  });

  const [selectedPanoHead, setSelectedPanoHeadState] = useState<PanoHeadSpec>(() => {
    return panoHeads.find(h => h.id === 'manfrotto-303sph') || panoHeads.find(h => h.model.includes('303SPH')) || panoHeads[0] || INITIAL_PANO_HEADS[0];
  });

  const [selectedScenario, setSelectedScenario] = useState<PanoramaScenario>(() => {
    return PANORAMA_SCENARIOS[0]; // Real Estate Interior
  });

  const [currentFocalLengthMm, setCurrentFocalLengthMm] = useState<number>(8);
  const [subjectDistanceM, setSubjectDistanceM] = useState<number>(0.5);
  const [focusDistanceM, setFocusDistanceM] = useState<number | undefined>(undefined);
  const [customAperture, setCustomAperture] = useState<number | undefined>(undefined);
  const [customIso, setCustomIso] = useState<number | undefined>(undefined);
  const [targetOverlapPct, setTargetOverlapPct] = useState<number>(0.30);
  const [qualityPriority, setQualityPriority] = useState<QualityPriority>('MAXIMUM_QUALITY');
  const [tripodOn, setTripodOn] = useState<boolean>(true);
  const [coverage, setCoverage] = useState<PanoramaCoverage>('360x180');
  const [customCoCMm, setCustomCoCMm] = useState<number | undefined>(undefined);
  const [exposureDialMode, setExposureDialMode] = useState<ExposureDialMode>('M');
  const [customSceneEv, setCustomSceneEv] = useState<number | undefined>(undefined);
  const [customAebEnabled, setCustomAebEnabled] = useState<boolean | undefined>(true);
  const [customAebFrames, setCustomAebFrames] = useState<number | undefined>(3);
  const [customAebEvStep, setCustomAebEvStep] = useState<number | undefined>(2);
  const [customShotsPerCircle, setCustomShotsPerCircle] = useState<number | undefined>(4);
  const [customUpperRailOffsetMm, setCustomUpperRailOffsetMm] = useState<number | undefined>(undefined);
  const upperRailOffsetMm = customUpperRailOffsetMm ?? (selectedLens.entrancePupilOffsetMm || 42);

  // Comparison State
  const [comparisonCameraIds, setComparisonCameraIds] = useState<string[]>(['canon-90d', 'sony-a7iv']);
  const [comparisonLensIds, setComparisonLensIds] = useState<string[]>(['sigma-8mm-f35-fisheye', 'canon-efs-10-18mm']);

  // Theme
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.THEME);
    if (stored) return stored === 'dark';
    return true; // Default to professional photography dark room theme
  });

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEYS.THEME, next ? 'dark' : 'light');
      return next;
    });
  };

  // Sync to Local Storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CAMERAS, JSON.stringify(cameras));
  }, [cameras]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LENSES, JSON.stringify(lenses));
  }, [lenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PANO_HEADS, JSON.stringify(panoHeads));
  }, [panoHeads]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(savedSetups));
  }, [savedSetups]);

  // Optical Calculations Engine Execution
  const optimizerInputs: OptimizerInputs = {
    camera: selectedCamera,
    lens: selectedLens,
    focalLengthMm: currentFocalLengthMm,
    scenario: selectedScenario,
    subjectDistanceM,
    customFocusDistanceM: focusDistanceM,
    customAperture,
    customIso,
    targetOverlapPct,
    qualityPriority,
    tripodOn,
    customCoCMm,
    customSceneEv,
    customAebEnabled,
    customAebFrames,
    customAebEvStep,
    customShotsPerCircle,
  };

  const results: OpticalCalculationResults = optimizePanoramaSettings(optimizerInputs);

  // Setter Wrappers with Constraints
  const setSelectedCamera = (camera: CameraSpec) => {
    setSelectedCameraState(camera);
  };

  const setSelectedLens = (lens: LensSpec) => {
    setSelectedLensState(lens);
    if (currentFocalLengthMm < lens.focalLengthMinMm || currentFocalLengthMm > lens.focalLengthMaxMm) {
      setCurrentFocalLengthMm(lens.focalLengthMinMm);
    }
  };

  const applyPanoHeadRecommendedSettings = (headToApply?: PanoHeadSpec) => {
    const head = headToApply || selectedPanoHead;
    if (!head || !head.supportedShots || head.supportedShots.length === 0) return;

    if (head.isSlant) {
      // Slant head (e.g. Novoflex VR-System Slant): pre-angled 60° bracket optimized for 4 or 3 shots
      const chosen = head.supportedShots.includes(4) ? 4 : head.supportedShots[0];
      setCustomShotsPerCircle(chosen);
      return;
    }

    if (head.isRingClamp) {
      // Ring clamp (e.g. Fanotec R1/R10/R20 or Tom Shot 360)
      let chosen = 4;
      if (results.horizontalFovDeg >= 160 && head.supportedShots.includes(3)) {
        chosen = 3;
      } else if (results.horizontalFovDeg < 105 && head.supportedShots.includes(6)) {
        chosen = 6;
      } else if (head.supportedShots.includes(4)) {
        chosen = 4;
      } else {
        chosen = head.supportedShots[0];
      }
      setCustomShotsPerCircle(chosen);
      return;
    }

    // Standard multi-row or single-row spherical head:
    // Determine minimum shots to guarantee adequate stitching overlap (>= 25%)
    const effectiveHFOV = Math.max(15, results.horizontalFovDeg);
    const targetOverlap = Math.max(0.20, targetOverlapPct);
    const requiredShots = Math.ceil(360 / (effectiveHFOV * (1 - targetOverlap)));

    // Find the smallest supported stop on this head that gives at least requiredShots
    const validStops = [...head.supportedShots].sort((a, b) => a - b).filter(s => s >= requiredShots);
    if (validStops.length > 0) {
      setCustomShotsPerCircle(validStops[0]);
    } else {
      const maxShots = Math.max(...head.supportedShots);
      setCustomShotsPerCircle(maxShots);
    }
  };

  const setSelectedPanoHead = (head: PanoHeadSpec) => {
    setSelectedPanoHeadState(head);
    // Align panorama setting to this panohead's native detent stops
    applyPanoHeadRecommendedSettings(head);
  };

  // Comparison Handlers
  const toggleCameraComparison = (cameraId: string) => {
    setComparisonCameraIds(prev =>
      prev.includes(cameraId)
        ? prev.filter(id => id !== cameraId)
        : prev.length < 3
        ? [...prev, cameraId]
        : [prev[1], prev[2], cameraId]
    );
  };

  const toggleLensComparison = (lensId: string) => {
    setComparisonLensIds(prev =>
      prev.includes(lensId)
        ? prev.filter(id => id !== lensId)
        : prev.length < 3
        ? [...prev, lensId]
        : [prev[1], prev[2], lensId]
    );
  };

  // Database CRUD Handlers
  const addCamera = (cam: CameraSpec) => {
    setCameras(prev => [cam, ...prev]);
  };

  const updateCamera = (cam: CameraSpec) => {
    setCameras(prev => prev.map(c => (c.id === cam.id ? cam : c)));
    if (selectedCamera.id === cam.id) {
      setSelectedCameraState(cam);
    }
  };

  const deleteCamera = (id: string) => {
    setCameras(prev => prev.filter(c => c.id !== id));
    if (selectedCamera.id === id) {
      setSelectedCameraState(cameras.find(c => c.id !== id) || INITIAL_CAMERAS[0]);
    }
  };

  const addLens = (lens: LensSpec) => {
    setLenses(prev => [lens, ...prev]);
  };

  const updateLens = (lens: LensSpec) => {
    setLenses(prev => prev.map(l => (l.id === lens.id ? lens : l)));
    if (selectedLens.id === lens.id) {
      setSelectedLensState(lens);
    }
  };

  const deleteLens = (id: string) => {
    setLenses(prev => prev.filter(l => l.id !== id));
    if (selectedLens.id === id) {
      setSelectedLensState(lenses.find(l => l.id !== id) || INITIAL_LENSES[0]);
    }
  };

  const addPanoHead = (head: PanoHeadSpec) => {
    setPanoHeads(prev => [head, ...prev]);
  };

  const updatePanoHead = (head: PanoHeadSpec) => {
    setPanoHeads(prev => prev.map(h => (h.id === head.id ? head : h)));
    if (selectedPanoHead.id === head.id) {
      setSelectedPanoHeadState(head);
    }
  };

  const deletePanoHead = (id: string) => {
    setPanoHeads(prev => prev.filter(h => h.id !== id));
    if (selectedPanoHead.id === id) {
      setSelectedPanoHeadState(panoHeads.find(h => h.id !== id) || INITIAL_PANO_HEADS[0]);
    }
  };

  const resetPanoHeadsToDefault = () => {
    setPanoHeads(INITIAL_PANO_HEADS);
    setSelectedPanoHeadState(INITIAL_PANO_HEADS[1] || INITIAL_PANO_HEADS[0]);
  };

  // Preset Handlers
  const saveCurrentSetup = (name: string, description?: string) => {
    const newPreset: UserRigPreset = {
      id: `rig-${Date.now()}`,
      name: name || `${selectedCamera.brand} ${selectedCamera.model} + ${selectedLens.brand} ${selectedLens.model}`,
      description: description || `Optimized for ${selectedScenario.name}`,
      cameraId: selectedCamera.id,
      lensId: selectedLens.id,
      focalLengthMm: currentFocalLengthMm,
      scenarioId: selectedScenario.id,
      subjectDistanceM,
      focusDistanceM: results.focusDistanceM,
      aperture: results.recommendedAperture,
      iso: results.recommendedIso,
      shutterSpeed: results.recommendedShutterSpeed,
      overlapPct: results.overlapPct,
      qualityPriority,
      tripodOn,
      panoramicHeadModel: selectedPanoHead.model,
      upperRailOffsetMm: selectedLens.entrancePupilOffsetMm || 42,
      lowerRailOffsetMm: 52,
      customSceneEv,
      aebEnabled: customAebEnabled !== undefined ? customAebEnabled : results.aebRecommended,
      aebFrames: results.aebFrames,
      aebEvStep: results.aebEvStep,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSavedSetups(prev => [newPreset, ...prev]);
  };

  const loadSetup = (preset: UserRigPreset) => {
    const cam = cameras.find(c => c.id === preset.cameraId);
    if (cam) setSelectedCameraState(cam);

    const l = lenses.find(item => item.id === preset.lensId);
    if (l) {
      setSelectedLensState(l);
      setCurrentFocalLengthMm(preset.focalLengthMm || l.focalLengthMinMm);
    }

    if (preset.panoramicHeadModel) {
      const ph = panoHeads.find(h => h.model === preset.panoramicHeadModel || `${h.brand} ${h.model}` === preset.panoramicHeadModel);
      if (ph) setSelectedPanoHeadState(ph);
    }

    const sc = PANORAMA_SCENARIOS.find(s => s.id === preset.scenarioId);
    if (sc) setSelectedScenario(sc);

    if (preset.subjectDistanceM !== undefined) setSubjectDistanceM(preset.subjectDistanceM);
    if (preset.focusDistanceM !== undefined) setFocusDistanceM(preset.focusDistanceM);
    if (preset.aperture !== undefined) setCustomAperture(preset.aperture);
    if (preset.iso !== undefined) setCustomIso(preset.iso);
    if (preset.overlapPct !== undefined) setTargetOverlapPct(preset.overlapPct / 100);
    if (preset.qualityPriority) setQualityPriority(preset.qualityPriority);
    if (preset.tripodOn !== undefined) setTripodOn(preset.tripodOn);
    if (preset.customSceneEv !== undefined) setCustomSceneEv(preset.customSceneEv);
    if (preset.aebEnabled !== undefined) setCustomAebEnabled(preset.aebEnabled);
    if (preset.aebFrames !== undefined) setCustomAebFrames(preset.aebFrames);
    if (preset.aebEvStep !== undefined) setCustomAebEvStep(preset.aebEvStep);
  };

  const deleteSetup = (id: string) => {
    setSavedSetups(prev => prev.filter(p => p.id !== id));
  };

  const clearAllSetups = () => {
    setSavedSetups([]);
  };

  const resetSetupsToDefault = () => {
    setSavedSetups([DEFAULT_PRESET]);
  };

  const exportDatabaseJson = () => {
    const data = {
      cameras,
      lenses,
      panoHeads,
      presets: savedSetups,
      exportedAt: new Date().toISOString(),
      version: '2.4.0',
    };
    return JSON.stringify(data, null, 2);
  };

  const exportDatabaseCsv = () => {
    // Generate CSV for cameras
    const camHeaders = [
      'id', 'brand', 'model', 'cameraType', 'sensorFormat', 'sensorWidthMm',
      'sensorHeightMm', 'cropFactor', 'megapixels', 'nativeResolution',
      'pixelPitchUm', 'nativeIso', 'maxShutterSpeed', 'aebCapability',
      'mirrorLockUp', 'efcs', 'lensMount', 'weightG', 'provenance_status'
    ];
    const camRows = cameras.map(c => [
      c.id, `"${c.brand}"`, `"${c.model}"`, c.cameraType, `"${c.sensorFormat}"`,
      c.sensorWidthMm, c.sensorHeightMm, c.cropFactor, c.megapixels,
      `"${c.nativeResolution.join('x')}"`, c.pixelPitchUm, c.nativeIso,
      `"${c.maxShutterSpeed}"`, c.aebCapability, c.mirrorLockUp, c.efcs,
      `"${c.lensMount}"`, c.weightG || '', c.provenance.status
    ]);
    const camerasCsv = [camHeaders.join(','), ...camRows.map(r => r.join(','))].join('\n');

    // Generate CSV for lenses
    const lensHeaders = [
      'id', 'brand', 'model', 'focalLengthMinMm', 'focalLengthMaxMm',
      'maxAperture', 'minAperture', 'projectionType', 'lensMount',
      'minFocusDistanceM', 'opticalStabilization', 'weightG', 'sweetSpotAperture',
      'entrancePupilOffsetMm', 'provenance_status'
    ];
    const lensRows = lenses.map(l => [
      l.id, `"${l.brand}"`, `"${l.model}"`, l.focalLengthMinMm, l.focalLengthMaxMm,
      l.maxAperture, l.minAperture, l.projectionType, `"${l.lensMount}"`,
      l.minFocusDistanceM, l.opticalStabilization, l.weightG || '',
      `"${l.sweetSpotAperture || ''}"`, l.entrancePupilOffsetMm || '', l.provenance.status
    ]);
    const lensesCsv = [lensHeaders.join(','), ...lensRows.map(r => r.join(','))].join('\n');

    // Generate CSV for panoramic heads
    const panoHeaders = [
      'Brand/Manufacturer', 'Model', 'Type', 'Load Capacity', 'Rotator Detent Options',
      'Setup Method', 'Camera/Lens Compatibility', 'Status'
    ];
    const panoRows = panoHeads.map(h => [
      `"${h.brand}"`, `"${h.model}"`, `"${h.type}"`, `"${h.loadCapacity}"`,
      `"${h.rotatorDetentOptions}"`, `"${h.setupMethod}"`, `"${h.compatibility}"`, `"${h.status}"`
    ]);
    const panoHeadsCsv = [panoHeaders.join(','), ...panoRows.map(r => r.join(','))].join('\n');

    return { camerasCsv, lensesCsv, panoHeadsCsv };
  };

  const importDatabaseJson = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.cameras && Array.isArray(data.cameras)) {
        setCameras(data.cameras);
      }
      if (data.lenses && Array.isArray(data.lenses)) {
        setLenses(data.lenses);
      }
      if (data.panoHeads && Array.isArray(data.panoHeads)) {
        setPanoHeads(data.panoHeads);
      }
      if (data.presets && Array.isArray(data.presets)) {
        setSavedSetups(data.presets);
      }
      return true;
    } catch (e) {
      console.error('Failed to import database JSON', e);
      return false;
    }
  };

  return (
    <PanoramaContext.Provider
      value={{
        cameras,
        lenses,
        panoHeads,
        scenarios: PANORAMA_SCENARIOS,
        savedSetups,
        selectedCamera,
        selectedLens,
        selectedPanoHead,
        selectedScenario,
        currentFocalLengthMm,
        subjectDistanceM,
        focusDistanceM,
        customAperture,
        customIso,
        targetOverlapPct,
        qualityPriority,
        tripodOn,
        coverage,
        customCoCMm,
        exposureDialMode,
        customSceneEv,
        customAebEnabled,
        customAebFrames,
        customAebEvStep,
        customShotsPerCircle,
        upperRailOffsetMm,
        comparisonCameraIds,
        comparisonLensIds,
        results,
        setSelectedCamera,
        setSelectedLens,
        setSelectedPanoHead,
        setSelectedScenario,
        setCurrentFocalLengthMm,
        setSubjectDistanceM,
        setFocusDistanceM,
        setCustomAperture,
        setCustomIso,
        setTargetOverlapPct,
        setQualityPriority,
        setTripodOn,
        setCoverage,
        setCustomCoCMm,
        setExposureDialMode,
        setCustomSceneEv,
        setCustomAebEnabled,
        setCustomAebFrames,
        setCustomAebEvStep,
        setCustomShotsPerCircle,
        setUpperRailOffsetMm: (offset: number) => setCustomUpperRailOffsetMm(offset),
        toggleCameraComparison,
        toggleLensComparison,
        addCamera,
        updateCamera,
        deleteCamera,
        addLens,
        updateLens,
        deleteLens,
        addPanoHead,
        updatePanoHead,
        deletePanoHead,
        resetPanoHeadsToDefault,
        applyPanoHeadRecommendedSettings,
        saveCurrentSetup,
        loadSetup,
        deleteSetup,
        clearAllSetups,
        resetSetupsToDefault,
        exportDatabaseJson,
        exportDatabaseCsv,
        importDatabaseJson,
        isDarkMode,
        toggleTheme,
      }}
    >
      {children}
    </PanoramaContext.Provider>
  );
};

export const usePanorama = () => {
  const context = useContext(PanoramaContext);
  if (!context) {
    throw new Error('usePanorama must be used within a PanoramaProvider');
  }
  return context;
};
