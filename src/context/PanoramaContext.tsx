import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CameraSpec,
  LensSpec,
  PanoramaScenario,
  QualityPriority,
  UserRigPreset,
  OpticalCalculationResults,
  PanoramaCoverage,
  ExposureDialMode,
} from '../types';
import { INITIAL_CAMERAS } from '../data/cameras';
import { INITIAL_LENSES } from '../data/lenses';
import { PANORAMA_SCENARIOS } from '../data/scenarios';
import { optimizePanoramaSettings, OptimizerInputs } from '../calculations/recommendations';

interface PanoramaContextType {
  // Equipment lists
  cameras: CameraSpec[];
  lenses: LensSpec[];
  scenarios: PanoramaScenario[];
  savedSetups: UserRigPreset[];

  // Active selections
  selectedCamera: CameraSpec;
  selectedLens: LensSpec;
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

  // Comparison selections
  comparisonCameraIds: string[];
  comparisonLensIds: string[];

  // Calculation results
  results: OpticalCalculationResults;

  // Setters
  setSelectedCamera: (camera: CameraSpec) => void;
  setSelectedLens: (lens: LensSpec) => void;
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

  // Preset operations
  saveCurrentSetup: (name: string, description?: string) => void;
  loadSetup: (preset: UserRigPreset) => void;
  deleteSetup: (id: string) => void;
  exportDatabaseJson: () => string;
  exportDatabaseCsv: () => { camerasCsv: string; lensesCsv: string };
  importDatabaseJson: (jsonString: string) => boolean;

  // Theme
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const PanoramaContext = createContext<PanoramaContextType | null>(null);

const STORAGE_KEYS = {
  CAMERAS: 'pano_optix_cameras',
  LENSES: 'pano_optix_lenses',
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
  subjectDistanceM: 2.0,
  focusDistanceM: 1.2,
  aperture: 8,
  iso: 100,
  overlapPct: 30,
  qualityPriority: 'MAXIMUM_QUALITY',
  tripodOn: true,
  panoramicHeadModel: 'Nodal Ninja 4',
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

  // 3. Initialize Presets
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

  // 4. Default selections: Canon 90D + Sigma 8mm Fisheye (Prompt requirement 6, 8, 78)
  const [selectedCamera, setSelectedCameraState] = useState<CameraSpec>(() => {
    return cameras.find(c => c.id === 'canon-90d') || cameras[0];
  });

  const [selectedLens, setSelectedLensState] = useState<LensSpec>(() => {
    return lenses.find(l => l.id === 'sigma-8mm-f35-fisheye') || lenses[0];
  });

  const [selectedScenario, setSelectedScenario] = useState<PanoramaScenario>(() => {
    return PANORAMA_SCENARIOS[0]; // Real Estate Interior
  });

  const [currentFocalLengthMm, setCurrentFocalLengthMm] = useState<number>(8);
  const [subjectDistanceM, setSubjectDistanceM] = useState<number>(2.0);
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
  const [customAebEnabled, setCustomAebEnabled] = useState<boolean | undefined>(undefined);
  const [customAebFrames, setCustomAebFrames] = useState<number | undefined>(undefined);
  const [customAebEvStep, setCustomAebEvStep] = useState<number | undefined>(undefined);

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

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CAMERAS, JSON.stringify(cameras));
    } catch (e) {
      console.error(e);
    }
  }, [cameras]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LENSES, JSON.stringify(lenses));
    } catch (e) {
      console.error(e);
    }
  }, [lenses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(savedSetups));
    } catch (e) {
      console.error(e);
    }
  }, [savedSetups]);

  // When selected lens changes, sync default focal length
  const setSelectedLens = (lens: LensSpec) => {
    setSelectedLensState(lens);
    setCurrentFocalLengthMm(lens.focalLengthMinMm);
  };

  const setSelectedCamera = (camera: CameraSpec) => {
    setSelectedCameraState(camera);
  };

  // Comparisons toggle
  const toggleCameraComparison = (id: string) => {
    setComparisonCameraIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev.slice(-2), id]
    );
  };

  const toggleLensComparison = (id: string) => {
    setComparisonLensIds(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev.slice(-2), id]
    );
  };

  // Run calculation engine
  const calculationInputs: OptimizerInputs = {
    camera: selectedCamera,
    lens: selectedLens,
    scenario: selectedScenario,
    focalLengthMm: currentFocalLengthMm,
    subjectDistanceM,
    targetOverlapPct,
    qualityPriority,
    tripodOn,
    customAperture,
    customIso,
    customFocusDistanceM: focusDistanceM,
    customCoCMm,
    customSceneEv,
    customAebEnabled,
    customAebFrames,
    customAebEvStep,
  };

  const results = optimizePanoramaSettings(calculationInputs);

  // CRUD actions
  const addCamera = (cam: CameraSpec) => {
    setCameras(prev => [cam, ...prev]);
  };

  const updateCamera = (cam: CameraSpec) => {
    setCameras(prev => prev.map(c => (c.id === cam.id ? cam : c)));
    if (selectedCamera.id === cam.id) setSelectedCameraState(cam);
  };

  const deleteCamera = (id: string) => {
    setCameras(prev => prev.filter(c => c.id !== id));
    if (selectedCamera.id === id) {
      const remaining = cameras.filter(c => c.id !== id);
      if (remaining.length > 0) setSelectedCameraState(remaining[0]);
    }
  };

  const addLens = (lens: LensSpec) => {
    setLenses(prev => [lens, ...prev]);
  };

  const updateLens = (lens: LensSpec) => {
    setLenses(prev => prev.map(l => (l.id === lens.id ? lens : l)));
    if (selectedLens.id === lens.id) setSelectedLensState(lens);
  };

  const deleteLens = (id: string) => {
    setLenses(prev => prev.filter(l => l.id !== id));
    if (selectedLens.id === id) {
      const remaining = lenses.filter(l => l.id !== id);
      if (remaining.length > 0) setSelectedLensState(remaining[0]);
    }
  };

  // Preset operations
  const saveCurrentSetup = (name: string, description?: string) => {
    const newPreset: UserRigPreset = {
      id: `preset-${Date.now()}`,
      name,
      description,
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
      panoramicHeadModel: 'Panoramic Head (Standard)',
      upperRailOffsetMm: selectedLens.entrancePupilOffsetMm || 45,
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

  const exportDatabaseJson = () => {
    const data = {
      cameras,
      lenses,
      presets: savedSetups,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
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

    return { camerasCsv, lensesCsv };
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
        scenarios: PANORAMA_SCENARIOS,
        savedSetups,
        selectedCamera,
        selectedLens,
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
        comparisonCameraIds,
        comparisonLensIds,
        results,
        setSelectedCamera,
        setSelectedLens,
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
        toggleCameraComparison,
        toggleLensComparison,
        addCamera,
        updateCamera,
        deleteCamera,
        addLens,
        updateLens,
        deleteLens,
        saveCurrentSetup,
        loadSetup,
        deleteSetup,
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
