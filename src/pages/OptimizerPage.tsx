import React, { useState } from 'react';
import { usePanorama } from '../context/PanoramaContext';
import { ResultCard } from '../components/ResultCard';
import { PanoramaVisualizer360 } from '../components/PanoramaVisualizer360';
import { VerticalRowVisualizer } from '../components/VerticalRowVisualizer';
import { ParallaxVisualizer } from '../components/ParallaxVisualizer';
import { ExposureBracketingPanel } from '../components/ExposureBracketingPanel';
import { SliderControl } from '../components/SliderControl';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import {
  Camera,
  Layers,
  Sparkles,
  Zap,
  Sliders,
  ChevronDown,
  Info,
  CheckCircle,
  Shield,
  HelpCircle,
  Eye,
  Crosshair,
  Compass,
  AlertCircle,
  Focus,
  Gauge,
  Lock,
  Sun,
} from 'lucide-react';
import { QualityPriority, ExposureDialMode } from '../types';

export const OptimizerPage: React.FC = () => {
  const {
    cameras,
    lenses,
    scenarios,
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
    exposureDialMode,
    setExposureDialMode,
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
    saveCurrentSetup,
  } = usePanorama();

  const [mode, setMode] = useState<'SIMPLE' | 'ADVANCED'>('SIMPLE');
  const [activeVisualizer, setActiveVisualizer] = useState<'360' | 'ROWS' | 'PARALLAX' | 'EXPOSURE_AEB'>('360');
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [presetName, setPresetName] = useState('');

  const isZoom = selectedLens.focalLengthMaxMm > selectedLens.focalLengthMinMm;

  // Preset Mode Buttons
  const applySharpnessFirst = () => {
    setQualityPriority('MAXIMUM_QUALITY');
    setTargetOverlapPct(0.30);
    setTripodOn(true);
    setCustomAperture(undefined); // let optical engine pick sweet spot (f/8 or f/5.6)
  };

  const applyMaxResolution = () => {
    setQualityPriority('MAXIMUM_QUALITY');
    setTargetOverlapPct(0.35);
    setTripodOn(true);
    if (isZoom) setCurrentFocalLengthMm(selectedLens.focalLengthMaxMm);
    setCustomAperture(8.0);
  };

  const applyFastWorkflow = () => {
    setQualityPriority('FAST');
    setTargetOverlapPct(0.20);
    setTripodOn(true);
    setCustomAperture(5.6);
  };

  const handleSaveRig = () => {
    if (!presetName.trim()) {
      saveCurrentSetup(`${selectedCamera.model} + ${selectedLens.model}`);
    } else {
      saveCurrentSetup(presetName.trim());
    }
    setSaveModalOpen(false);
    setPresetName('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Workflow Step Indicator Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto text-xs font-mono font-bold">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
            <span>1. CAMERA</span>
          </div>
          <span className="text-slate-600">→</span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
            <span>2. LENS</span>
          </div>
          <span className="text-slate-600">→</span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
            <span>3. SCENARIO</span>
          </div>
          <span className="text-slate-600">→</span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
            <span>4. DISTANCE</span>
          </div>
          <span className="text-slate-600">→</span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
            <span>5. OPTIMIZED SETTINGS</span>
          </div>
        </div>

        {/* Simple vs Advanced Toggle */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center">
            <button
              type="button"
              onClick={() => setMode('SIMPLE')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                mode === 'SIMPLE'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Simple Mode
            </button>
            <button
              type="button"
              onClick={() => setMode('ADVANCED')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                mode === 'ADVANCED'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Advanced Mode
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout: Controls on Left, Results & Visualizers on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Equipment & Optical Inputs (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Quick Photography Intent Modes */}
          <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={applySharpnessFirst}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                qualityPriority === 'MAXIMUM_QUALITY' && targetOverlapPct === 0.30
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Prioritizes lens sweet-spot aperture, optimal DOF, base ISO, and zero-vibration"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Sharpness First</span>
            </button>

            <button
              type="button"
              onClick={applyMaxResolution}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                qualityPriority === 'MAXIMUM_QUALITY' && targetOverlapPct > 0.30
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Maximizes final gigapixel panorama dimensions and safety overlap"
            >
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              <span>Max Resolution</span>
            </button>

            <button
              type="button"
              onClick={applyFastWorkflow}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                qualityPriority === 'FAST'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Minimizes number of shots and bracket overhead for rapid commercial coverage"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Fast Workflow</span>
            </button>
          </div>

          {/* Primary Equipment Pickers Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-amber-400" />
              <span>Selected Camera & Lens Equipment</span>
            </h3>

            {/* Camera Select */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">1. Camera Body:</span>
                <ConfidenceBadge status={selectedCamera.provenance.status} source={selectedCamera.provenance.source} />
              </div>
              <div className="relative">
                <select
                  value={selectedCamera.id}
                  onChange={(e) => {
                    const cam = cameras.find((c) => c.id === e.target.value);
                    if (cam) setSelectedCamera(cam);
                  }}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none pr-10"
                >
                  {cameras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.brand} {c.model} ({c.sensorFormat} · {c.megapixels}MP)
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                <span>Crop: {selectedCamera.cropFactor}x ({selectedCamera.sensorFormat})</span>
                <span>Pitch: {results.pixelPitchUm.toFixed(2)}μm</span>
                <span>Native: ISO {selectedCamera.nativeIso}</span>
              </div>
            </div>

            {/* Lens Select */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">2. Lens:</span>
                <ConfidenceBadge status={selectedLens.provenance.status} source={selectedLens.provenance.source} />
              </div>
              <div className="relative">
                <select
                  value={selectedLens.id}
                  onChange={(e) => {
                    const l = lenses.find((item) => item.id === e.target.value);
                    if (l) setSelectedLens(l);
                  }}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none pr-10"
                >
                  {lenses.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.brand} {l.model} [{l.projectionType.replace('_', ' ')}]
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                <span className="text-amber-400 font-semibold">{results.isFisheye ? 'Fisheye Model' : 'Rectilinear'}</span>
                <span>Sweet Spot: {selectedLens.sweetSpotAperture || 'f/5.6 - f/8'}</span>
                <span>Entrance Pupil: ~{selectedLens.entrancePupilOffsetMm || 45}mm</span>
              </div>
            </div>

            {/* Zoom Slider if Zoom Lens */}
            {isZoom && (
              <SliderControl
                label="Lens Focal Length (Zoom)"
                value={currentFocalLengthMm}
                min={selectedLens.focalLengthMinMm}
                max={selectedLens.focalLengthMaxMm}
                step={1}
                unit="mm"
                onChange={setCurrentFocalLengthMm}
                helperText={`Effective full-frame focal length: ${results.effectiveFocalLengthMm}mm`}
              />
            )}

            {/* Scenario Preset Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-300 font-medium">3. Shooting Scenario / Preset:</label>
              <div className="relative">
                <select
                  value={selectedScenario.id}
                  onChange={(e) => {
                    const sc = scenarios.find((s) => s.id === e.target.value);
                    if (sc) setSelectedScenario(sc);
                  }}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none pr-10"
                >
                  {scenarios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category} · EV {s.lightLevelEv})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-400 px-1 leading-relaxed">
                {selectedScenario.description}
              </p>
            </div>
          </div>

          {/* Camera Mode Dial Selector & Advisory (Manual vs Tv vs Av vs Sports) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-amber-400" />
                <span>Camera Exposure Mode Dial</span>
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                exposureDialMode === 'M'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}>
                {exposureDialMode === 'M' ? 'GOLD STANDARD: MANUAL' : 'WARNING: NOT RECOMMENDED'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setExposureDialMode('M')}
                className={`py-2 px-2 rounded-xl text-xs font-mono font-bold flex flex-col items-center justify-center transition border ${
                  exposureDialMode === 'M'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md border-emerald-400'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>M (Manual)</span>
                <span className="text-[9px] opacity-80">Locked Best</span>
              </button>

              <button
                type="button"
                onClick={() => setExposureDialMode('Tv')}
                className={`py-2 px-2 rounded-xl text-xs font-mono font-bold flex flex-col items-center justify-center transition border ${
                  exposureDialMode === 'Tv'
                    ? 'bg-rose-500 text-white font-black shadow-md border-rose-400'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>Tv (Shutter)</span>
                <span className="text-[9px] opacity-80">Fluctuates Ap</span>
              </button>

              <button
                type="button"
                onClick={() => setExposureDialMode('Av')}
                className={`py-2 px-2 rounded-xl text-xs font-mono font-bold flex flex-col items-center justify-center transition border ${
                  exposureDialMode === 'Av'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md border-amber-400'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>Av (Aperture)</span>
                <span className="text-[9px] opacity-80">Shifts Shutter</span>
              </button>

              <button
                type="button"
                onClick={() => setExposureDialMode('AUTO_SPORTS')}
                className={`py-2 px-2 rounded-xl text-xs font-mono font-bold flex flex-col items-center justify-center transition border ${
                  exposureDialMode === 'AUTO_SPORTS'
                    ? 'bg-rose-600 text-white font-black shadow-md border-rose-500'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>Sport / Auto</span>
                <span className="text-[9px] opacity-80">Never Use</span>
              </button>
            </div>

            {/* Mode Specific Analysis Callout */}
            {exposureDialMode === 'M' ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed text-[11px]">
                  <strong>Manual (M) is the mandatory standard for 360° panoramas.</strong> It locks aperture ({results.recommendedApertureString}), shutter speed ({results.recommendedShutterSpeed}), and ISO ({results.recommendedIso}) identically across every single tile, guaranteeing zero exposure or depth-of-field jumps across seams.
                </div>
              </div>
            ) : exposureDialMode === 'Tv' ? (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 font-bold text-rose-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Why Tv (Time Value) Breaks Stitched Panoramas:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-rose-200/90 pl-5">
                  In <strong>Tv mode</strong>, as you rotate 360° from a dark corner toward a bright window, the camera keeps shutter speed fixed and continuously shifts the <strong>Aperture</strong> (e.g. from f/4 to f/22)! Adjacent frames will have completely mismatched depths of field, corner softness, vignetting, and diffraction blur, making seamless stitching impossible.
                </p>
                <button
                  type="button"
                  onClick={() => setExposureDialMode('M')}
                  className="self-start ml-5 mt-1 px-2.5 py-1 rounded bg-rose-500 text-white font-bold text-[10px]"
                >
                  Switch back to Manual (M)
                </button>
              </div>
            ) : exposureDialMode === 'Av' ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Av (Aperture Priority) Warning:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-200/90 pl-5">
                  Av keeps aperture constant (good for DOF), but shifts shutter speed as you rotate toward lights and windows. This creates visible exposure steps between tiles. For high dynamic range scenes, use <strong>Manual (M) Mode with AEB (Auto Exposure Bracketing)</strong> instead.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 font-bold text-rose-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Sport / Auto Modes Completely Ruin Panoramas:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-rose-200/90 pl-5">
                  Sport modes activate Continuous Autofocus (AI Servo/AF-C) which continually shifts focus distance between frames, varies ISO unpredictably, and softens corners. Never shoot 360° panoramas in Auto or Sports modes.
                </p>
              </div>
            )}
          </div>

          {/* Infinity Focus (∞) vs Hyperfocal Sharpness Analyzer Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Focus className="w-4 h-4 text-emerald-400" />
                <span>Infinity (∞) vs Hyperfocal Focus Setting</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold">
                H = {results.hyperfocalDistanceM.toFixed(2)}m
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <button
                type="button"
                onClick={() => setFocusDistanceM(1.2)}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition ${
                  Math.abs((focusDistanceM || results.focusDistanceM) - 1.2) < 0.1
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 font-bold shadow'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <span className="text-[10px] text-slate-400">Safe Panorama</span>
                <span className="text-sm font-bold text-emerald-400">~1.2 m</span>
                <span className="text-[9px] text-slate-500">Sharp 0.33m → ∞</span>
              </button>

              <button
                type="button"
                onClick={() => setFocusDistanceM(results.hyperfocalDistanceM)}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition ${
                  Math.abs((focusDistanceM || results.focusDistanceM) - results.hyperfocalDistanceM) < 0.1
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-bold shadow'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <span className="text-[10px] text-slate-400">Hyperfocal (H)</span>
                <span className="text-sm font-bold text-amber-400">{results.hyperfocalDistanceM.toFixed(2)} m</span>
                <span className="text-[9px] text-slate-500">Sharp {results.hyperfocalNearLimitM.toFixed(2)}m → ∞</span>
              </button>

              <button
                type="button"
                onClick={() => setFocusDistanceM(10.0)}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition ${
                  (focusDistanceM || results.focusDistanceM) >= 9.0
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500 font-bold shadow'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <span className="text-[10px] text-slate-400">Infinity (∞ Mark)</span>
                <span className="text-sm font-bold text-sky-400">∞ (Distant)</span>
                <span className="text-[9px] text-slate-500">Near limit = {results.hyperfocalDistanceM.toFixed(1)}m</span>
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
              <strong className="text-amber-400">Why NOT turn to the Infinity (∞) mark?</strong> Focusing directly at Infinity pushes your near sharp limit all the way out to {results.hyperfocalDistanceM.toFixed(2)}m, leaving foreground tables and floors unsharp! Focusing at ~1.2m or Hyperfocal ({results.hyperfocalDistanceM.toFixed(2)}m) keeps infinity tack-sharp while bringing foreground sharpness all the way in to {results.hyperfocalNearLimitM.toFixed(2)}m.
            </div>
          </div>

          {/* Sliders: Distance, Focus, Overlap, Quality */}
          <div className="flex flex-col gap-3">
            {/* Subject Distance Slider */}
            <SliderControl
              label="Approximate Subject / Room Distance"
              value={subjectDistanceM}
              min={0.3}
              max={15}
              step={0.1}
              unit="m"
              onChange={setSubjectDistanceM}
              presetValues={[
                { label: '0.5m', value: 0.5 },
                { label: '1m', value: 1.0 },
                { label: '1.5m', value: 1.5 },
                { label: '2m', value: 2.0 },
                { label: '3m', value: 3.0 },
                { label: '5m', value: 5.0 },
                { label: '10m', value: 10.0 },
              ]}
              helperText="Distance to the nearest dominant furniture, doorway, or focal subject."
            />

            {/* Overlap Slider */}
            <SliderControl
              label="Stitching Overlap"
              value={Math.round(targetOverlapPct * 100)}
              min={10}
              max={55}
              step={5}
              unit="%"
              badgeText={
                targetOverlapPct < 0.20
                  ? 'Minimal'
                  : targetOverlapPct <= 0.35
                  ? 'Recommended'
                  : targetOverlapPct <= 0.45
                  ? 'High'
                  : 'Very High'
              }
              badgeColor={
                targetOverlapPct < 0.20
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  : targetOverlapPct <= 0.35
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-sky-500/20 text-sky-400 border-sky-500/30'
              }
              onChange={(val) => setTargetOverlapPct(val / 100)}
              presetValues={[
                { label: '15%', value: 15 },
                { label: '20%', value: 20 },
                { label: '25%', value: 25 },
                { label: '30%', value: 30 },
                { label: '35%', value: 35 },
                { label: '40%', value: 40 },
                { label: '50%', value: 50 },
              ]}
              helperText="Recommended 20–35%. 35–45% is optimal for blank white walls and ceilings."
            />

            {/* Quality Priority Buttons */}
            <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Quality Priority
              </span>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {(['FAST', 'BALANCED', 'MAXIMUM_QUALITY'] as QualityPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setQualityPriority(p)}
                    className={`py-2 px-2 rounded-lg text-xs font-mono font-bold transition ${
                      qualityPriority === p
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {p === 'MAXIMUM_QUALITY' ? 'Max Quality' : p === 'BALANCED' ? 'Balanced' : 'Fast'}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Controls (Aperture / ISO / Focus Overrides) */}
            {mode === 'ADVANCED' && (
              <div className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-4 h-4" />
                    <span>Advanced Overrides & Fine Control</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomAperture(undefined);
                      setCustomIso(undefined);
                      setFocusDistanceM(undefined);
                    }}
                    className="text-[10px] text-slate-400 hover:text-amber-400 underline font-mono"
                  >
                    Reset Overrides
                  </button>
                </div>

                {/* Aperture Slider Override */}
                <SliderControl
                  label="Aperture Manual Override"
                  value={customAperture || results.recommendedAperture}
                  min={2.8}
                  max={22}
                  step={0.5}
                  displayValueOverride={`f/${customAperture || results.recommendedAperture}`}
                  onChange={(val) => setCustomAperture(val)}
                  presetValues={[
                    { label: 'f/4', value: 4 },
                    { label: 'f/5.6', value: 5.6 },
                    { label: 'f/8', value: 8 },
                    { label: 'f/11', value: 11 },
                    { label: 'f/16', value: 16 },
                  ]}
                  helperText="Adjust to see diffraction vs depth of field shift in real time."
                />

                {/* Focus Distance Manual Override */}
                <SliderControl
                  label="Focus Distance Manual Override"
                  value={focusDistanceM || results.focusDistanceM}
                  min={0.3}
                  max={10}
                  step={0.1}
                  unit="m"
                  onChange={(val) => setFocusDistanceM(val)}
                  presetValues={[
                    { label: '0.5m', value: 0.5 },
                    { label: '1m', value: 1 },
                    { label: '1.2m', value: 1.2 },
                    { label: '2m', value: 2 },
                    { label: `H (${results.hyperfocalDistanceM.toFixed(1)}m)`, value: results.hyperfocalDistanceM },
                  ]}
                  helperText={`Hyperfocal distance: ${results.hyperfocalDistanceM.toFixed(2)}m (Near limit: ${results.hyperfocalNearLimitM.toFixed(2)}m)`}
                />

                {/* ISO Manual Override */}
                <SliderControl
                  label="ISO Manual Override"
                  value={customIso || results.recommendedIso}
                  min={50}
                  max={6400}
                  step={50}
                  onChange={(val) => setCustomIso(val)}
                  presetValues={[
                    { label: '100', value: 100 },
                    { label: '200', value: 200 },
                    { label: '400', value: 400 },
                    { label: '800', value: 800 },
                    { label: '1600', value: 1600 },
                  ]}
                  helperText="Lower ISO delivers wider dynamic range and cleaner shadow extraction."
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Output Card & Visualizers (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Main Clean Result Card */}
          <ResultCard
            camera={selectedCamera}
            lens={selectedLens}
            scenario={selectedScenario}
            results={results}
            onSavePreset={() => setSaveModalOpen(true)}
          />

          {/* Visualizer Tabs Header */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Interactive Panoramic Visualizers
              </span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveVisualizer('360')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                    activeVisualizer === '360'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>360° Rotator</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveVisualizer('ROWS')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                    activeVisualizer === 'ROWS'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Vertical Tiers</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveVisualizer('PARALLAX')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                    activeVisualizer === 'PARALLAX'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Parallax Check</span>
                </button>
              </div>
            </div>

            {/* Active Visualizer Panel */}
            {activeVisualizer === '360' && (
              <PanoramaVisualizer360
                shotsPerCircle={results.shotsPerCircle}
                rotationIncrementDeg={results.rotationIncrementDeg}
                effectiveHfovDeg={results.horizontalFovDeg}
                overlapPct={results.overlapPct}
                lensModel={selectedLens.model}
                isFisheye={results.isFisheye}
              />
            )}

            {activeVisualizer === 'ROWS' && (
              <VerticalRowVisualizer
                numRows={results.numRows}
                rowPitchesDeg={results.rowPitchesDeg}
                shotsPerRow={results.shotsPerRow}
                zenithShotRecommended={results.numRows > 1 || results.verticalFovDeg < 170}
                nadirShotRecommended={results.nadirShotRecommended}
                effectiveVfovDeg={results.verticalFovDeg}
                totalShots={results.totalShots}
              />
            )}

            {activeVisualizer === 'PARALLAX' && (
              <ParallaxVisualizer entrancePupilOffsetMm={selectedLens.entrancePupilOffsetMm} />
            )}
          </div>
        </div>
      </div>

      {/* Save Setup Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <h3 className="text-lg font-bold text-white">Save Equipment Rig Preset</h3>
            <p className="text-xs text-slate-400">
              Save your current camera ({selectedCamera.model}), lens ({selectedLens.model}), and optical settings as a reusable 1-click rig.
            </p>
            <input
              type="text"
              placeholder={`e.g. Gazaly — ${selectedCamera.model} + ${selectedLens.model}`}
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRig}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition"
              >
                Save Preset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
