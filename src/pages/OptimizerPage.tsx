import React, { useState } from 'react';
import { usePanorama } from '../context/PanoramaContext';
import { ResultCard } from '../components/ResultCard';
import { PanoramaVisualizer360 } from '../components/PanoramaVisualizer360';
import { VerticalRowVisualizer } from '../components/VerticalRowVisualizer';
import { ParallaxVisualizer } from '../components/ParallaxVisualizer';
import { ExposureBracketingPanel } from '../components/ExposureBracketingPanel';
import { NodalPointCalculator } from '../components/NodalPointCalculator';
import { SliderControl } from '../components/SliderControl';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { FieldSheetPdfModal } from '../components/FieldSheetPdfModal';
import { OptimizationTipsOverlay, TipCategoryKey } from '../components/OptimizationTipsOverlay';
import { OptimizationTipIcon } from '../components/OptimizationTipIcon';
import { FovVisualizer } from '../components/FovVisualizer';
import { FovVisualizerModal } from '../components/FovVisualizerModal';
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
  Bookmark,
  ArrowRight,
  FileText,
  RotateCw,
  CheckSquare,
  Wrench,
  Check,
  Lightbulb,
  Maximize2,
} from 'lucide-react';
import { QualityPriority, ExposureDialMode } from '../types';
import { formatDualDistance, formatDualMm } from '../utils/units';

export const OptimizerPage: React.FC<{ onNavigateToSaved?: () => void }> = ({ onNavigateToSaved }) => {
  const {
    cameras,
    lenses,
    panoHeads,
    scenarios,
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
    exposureDialMode,
    setExposureDialMode,
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
    customShotsPerCircle,
    setCustomShotsPerCircle,
    customAebEnabled,
    setCustomAebEnabled,
    customAebFrames,
    setCustomAebFrames,
    customAebEvStep,
    setCustomAebEvStep,
    upperRailOffsetMm,
    setUpperRailOffsetMm,
    saveCurrentSetup,
  } = usePanorama();

  // Mode state: SIMPLE (beginner) vs ADVANCED (pro)
  const [mode, setMode] = useState<'SIMPLE' | 'ADVANCED'>('SIMPLE');
  const [activeVisualizer, setActiveVisualizer] = useState<'360' | 'FOV' | 'ROWS' | 'NODAL' | 'EXPOSURE_AEB'>('360');
  const [simpleVisualizerTab, setSimpleVisualizerTab] = useState<'360' | 'FOV'>('360');
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [fieldSheetOpen, setFieldSheetOpen] = useState(false);
  const [fovModalOpen, setFovModalOpen] = useState(false);
  const [tipsOverlayOpen, setTipsOverlayOpen] = useState(false);
  const [activeTipKey, setActiveTipKey] = useState<TipCategoryKey | null>(null);
  const [presetName, setPresetName] = useState('');
  const [presetDesc, setPresetDesc] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const handleOpenTip = (key: TipCategoryKey) => {
    setActiveTipKey(key);
    setTipsOverlayOpen(true);
  };

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
  };

  const applySpeedFirst = () => {
    setQualityPriority('FAST');
    setTargetOverlapPct(0.20);
    setCustomAperture(5.6);
  };

  const handleOpenSaveModal = () => {
    setPresetName(`${selectedCamera.brand} ${selectedCamera.model} + ${selectedLens.brand} ${selectedLens.model}`);
    setPresetDesc(`Optimized for ${selectedScenario.name} · ${results.recommendedApertureString} @ ISO ${results.recommendedIso} · ${results.shotsPerCircle} shots around with ${selectedPanoHead.brand} ${selectedPanoHead.model}`);
    setSaveModalOpen(true);
  };

  const handleSaveRig = () => {
    const finalName = presetName.trim() || `${selectedCamera.model} + ${selectedLens.model}`;
    saveCurrentSetup(finalName, presetDesc.trim());
    setSaveModalOpen(false);
    setNotification(`Saved "${finalName}" to Section 10 (Saved Rigs)!`);
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6 relative">
      {/* Toast Notification with Shortcut to Section 10 */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-amber-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold block text-white">{notification}</span>
            <span className="text-[11px] text-slate-400">Stored in your browser presets database.</span>
          </div>
          {onNavigateToSaved && (
            <button
              type="button"
              onClick={onNavigateToSaved}
              className="ml-2 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition shadow"
            >
              <span>Go to Section 10</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Top Control Bar: Clear Header, Mode Switcher & Quick Actions */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* Left: Clear Section Identity & Live Engine Status */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Panorama Field Optimizer
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Calculated</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Real-time optics, rotation detents, and parallax calibration for 360° virtual tours
            </p>
          </div>
        </div>

        {/* Right: Properly Arranged & Aligned Controls */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end flex-wrap sm:flex-nowrap">
          {/* Mode Switcher (Segmented Control) */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center shadow-inner shrink-0">
            <button
              type="button"
              onClick={() => setMode('SIMPLE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                mode === 'SIMPLE'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Fast, guided setup for beginners"
            >
              <span>🟢 Simple Mode</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('ADVANCED')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                mode === 'ADVANCED'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Full optical physics, DOF, and nodal rail controls"
            >
              <span>⚡ Advanced Mode</span>
            </button>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block shrink-0" />

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setFovModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 transition shadow-sm"
              title="Open Interactive Field of View (FOV) SVG Overlay"
            >
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>FOV Visualizer</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTipKey(null);
                setTipsOverlayOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition shadow-sm"
              title="Open 360° Panoramic Optimization Tips & Field Advice"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Optimization Tips</span>
            </button>

            <button
              type="button"
              onClick={handleOpenSaveModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition"
              title="Save this optimized rig configuration to Section 10 (Saved Rigs)"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              <span>Save Rig</span>
            </button>

            <button
              type="button"
              onClick={() => setFieldSheetOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition"
              title="Open printable & downloadable Field Sheet"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Field Sheet (PDF)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🚀 QUICK SNAPSHOT SUMMARY CARD: Camera, Lens & Calculated Shots at a glance */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-amber-500/10 via-sky-500/5 to-transparent pointer-events-none rounded-r-2xl" />

        <div className="flex flex-col gap-4 relative z-10">
          {/* Card Top Title Row */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">
                Quick Snapshot Summary
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live Optical State</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span className="hidden sm:inline">Pano Head:</span>
              <strong className="text-slate-200">{selectedPanoHead.brand} {selectedPanoHead.model}</strong>
              <span className="text-slate-600">·</span>
              <span className="hidden sm:inline">NPP:</span>
              <strong className="text-amber-400">{formatDualMm(upperRailOffsetMm || selectedLens.entrancePupilOffsetMm || 42)}</strong>
              <OptimizationTipIcon tipKey="nodal_point" onClick={handleOpenTip} label="No-Parallax Point calibration tip" />
            </div>
          </div>

          {/* 3 Core Hero Columns: Camera, Lens, and Calculated Shot Count */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* 1. Camera Body */}
            <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 sm:p-3.5 flex items-start gap-3 hover:border-slate-700 transition">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <Camera className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
                  Camera Body
                </div>
                <div className="text-sm sm:text-base font-bold text-white truncate mt-0.5">
                  {selectedCamera.brand} {selectedCamera.model}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-slate-300">{selectedCamera.sensorFormat}</span>
                  <span className="text-slate-600">·</span>
                  <span>{selectedCamera.megapixels} MP</span>
                  <span className="text-slate-600">·</span>
                  <span className="font-mono text-amber-400/90 font-medium">{selectedCamera.cropFactor.toFixed(1)}x Crop</span>
                </div>
              </div>
            </div>

            {/* 2. Lens Attached */}
            <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 sm:p-3.5 flex items-start gap-3 hover:border-slate-700 transition">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
                  Lens Attached
                </div>
                <div className="text-sm sm:text-base font-bold text-white truncate mt-0.5">
                  {selectedLens.brand} {selectedLens.model}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono font-semibold text-slate-300">
                    {Math.round((results.effectiveFocalLengthMm / selectedCamera.cropFactor) * 10) / 10}mm
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="capitalize">{selectedLens.projectionType.replace(/_/g, ' ').toLowerCase()}</span>
                  <span className="text-slate-600">·</span>
                  <span className="font-mono text-sky-400/90 font-medium">{results.horizontalFovDeg}° HFOV</span>
                </div>
              </div>
            </div>

            {/* 3. Calculated Shot Count (Hero Output) */}
            <div className="bg-gradient-to-br from-amber-500/15 via-slate-950 to-slate-950 border border-amber-500/40 rounded-xl p-3 sm:p-3.5 flex items-start gap-3 shadow-md hover:border-amber-400 transition">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 mt-0.5 shadow-sm">
                <RotateCw className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono uppercase text-amber-400 font-black tracking-wider flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span>Calculated Shots</span>
                    <OptimizationTipIcon tipKey="shots_overlap" onClick={handleOpenTip} label="360° rotation and overlap advice" />
                  </div>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                    {results.overlapPct}% Overlap
                  </span>
                </div>
                <div className="text-base sm:text-lg font-black text-white mt-0.5 flex items-baseline gap-1.5">
                  <span className="text-amber-400 font-mono text-xl">{results.shotsPerCircle} Shots</span>
                  <span className="text-xs text-slate-300 font-medium">Around ({results.rotationIncrementDeg}° clicks)</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-300 font-medium">{results.shotsPerCircle + 2} Full Sphere</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-emerald-400 font-mono font-semibold">
                    {results.aebRecommended
                      ? `${results.aebFrames}× AEB (${results.totalRawShotsWithBracketing} RAWs)`
                      : 'Single Exposure'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🟢 BEGINNER / SIMPLE MODE VIEW: Easy, Direct, Foolproof 1-2-3 Guide       */}
      {/* ========================================================================= */}
      {mode === 'SIMPLE' && (
        <div className="flex flex-col gap-6">
          {/* Quick Header Explain */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0 text-sm">
              123
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">
                Beginner Simple Mode: Fast, Guaranteed 360° Setup
              </h3>
              <p className="text-slate-300 text-[11px] mt-0.5">
                Select your equipment below. The system automatically calculates your optimal camera dial settings, 4-shot rotation clicks, and panoramic head alignment.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (5 Cols): Fast Gear Selectors */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>Step 1: Choose Your Equipment</span>
                </h3>

                {/* Camera Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-medium">Camera Body:</label>
                  <div className="relative">
                    <select
                      value={selectedCamera.id}
                      onChange={(e) => {
                        const cam = cameras.find((c) => c.id === e.target.value);
                        if (cam) setSelectedCamera(cam);
                      }}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-bold text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none pr-10"
                    >
                      {cameras.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.brand} {c.model} ({c.sensorFormat} · {c.megapixels} MP)
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Lens Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-medium">Lens:</label>
                  <div className="relative">
                    <select
                      value={selectedLens.id}
                      onChange={(e) => {
                        const lens = lenses.find((l) => l.id === e.target.value);
                        if (lens) setSelectedLens(lens);
                      }}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-bold text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none pr-10"
                    >
                      {lenses.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.brand} {l.model} ({l.focalLengthMinMm === l.focalLengthMaxMm ? `${l.focalLengthMinMm}mm` : `${l.focalLengthMinMm}-${l.focalLengthMaxMm}mm`} · {l.projectionType})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Panoramic Head Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-medium">Panoramic Tripod Head:</label>
                  <div className="relative">
                    <select
                      value={selectedPanoHead.id}
                      onChange={(e) => {
                        const head = panoHeads.find((h) => h.id === e.target.value);
                        if (head) setSelectedPanoHead(head);
                      }}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none pr-10"
                    >
                      {panoHeads.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.brand} {h.model} ({h.type})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Scenario Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-medium">Shooting Scenario:</label>
                  <div className="relative">
                    <select
                      value={selectedScenario.id}
                      onChange={(e) => {
                        const s = scenarios.find((sc) => sc.id === e.target.value);
                        if (s) setSelectedScenario(s);
                      }}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none pr-10"
                    >
                      {scenarios.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.category})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                  <p className="text-[11px] text-slate-400 px-1 mt-1 leading-relaxed">
                    {selectedScenario.description}
                  </p>
                </div>
              </div>

              {/* Beginner Quick Checklist Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  <span>Beginner 4-Step Field Routine</span>
                </h3>
                <ol className="flex flex-col gap-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                    <span><strong>Level the Tripod:</strong> Use the bubble level on your tripod base so rotation stays perfectly flat.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                    <span><strong>Mount in Portrait:</strong> Turn camera vertically (Portrait) so you capture maximum floor and ceiling height.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                    <span><strong>Set Rail Mark:</strong> Slide the upper rail to <strong className="text-amber-400">{formatDualMm(selectedLens.entrancePupilOffsetMm || 42)}</strong> to eliminate seam parallax errors.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                    <span><strong>Take 4 Shots:</strong> Rotate 90° for each click stop around the 360° circle. Done!</span>
                  </li>
                </ol>
              </div>
            </div>

            {/* Right Column (7 Cols): The "Dial In Right Now" Golden Card & Visualizer */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              {/* THE GOLDEN CAMERA DIAL-IN CARD */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border-2 border-amber-500/40 rounded-3xl p-6 shadow-xl flex flex-col gap-5">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-white">Dial These Into Your Camera Right Now</h2>
                      <p className="text-xs text-slate-400">Guaranteed tack-sharp panorama settings for {selectedCamera.model} + {selectedLens.model}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    4 SHOTS DEFAULT · 90° CLICKS
                  </span>
                </div>

                {/* Big Stat Dial Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                  {/* Mode Dial */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 relative group">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-[10px] uppercase font-mono text-slate-500 block">Camera Mode</span>
                      <OptimizationTipIcon tipKey="shutter" onClick={handleOpenTip} label="Manual mode lock tip" />
                    </div>
                    <span className="text-xl font-black text-emerald-400 block mt-0.5">M (Manual)</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">Locks exposure constant</span>
                  </div>

                  {/* Aperture */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 relative group">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-[10px] uppercase font-mono text-slate-500 block">Aperture Dial</span>
                      <OptimizationTipIcon tipKey="aperture" onClick={handleOpenTip} label="Aperture sweet spot tip" />
                    </div>
                    <span className="text-xl font-black text-amber-400 block mt-0.5">{results.recommendedApertureString}</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">Sharp optical sweet spot</span>
                  </div>

                  {/* Shutter Speed */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 relative group">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-[10px] uppercase font-mono text-slate-500 block">Shutter Speed</span>
                      <OptimizationTipIcon tipKey="shutter" onClick={handleOpenTip} label="Shutter speed & vibration tip" />
                    </div>
                    <span className="text-xl font-black text-white block mt-0.5">{results.recommendedShutterSpeed}</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">{results.aebRecommended ? 'Use 3-shot AEB bracket' : 'Single exposure'}</span>
                  </div>

                  {/* ISO */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 relative group">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-[10px] uppercase font-mono text-slate-500 block">ISO Sensitivity</span>
                      <OptimizationTipIcon tipKey="iso" onClick={handleOpenTip} label="Base ISO & dynamic range tip" />
                    </div>
                    <span className="text-xl font-black text-white block mt-0.5">ISO {results.recommendedIso}</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">Cleanest dynamic range</span>
                  </div>

                  {/* Focus Ring */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 relative group">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-[10px] uppercase font-mono text-slate-500 block">Focus Ring Mark</span>
                      <OptimizationTipIcon tipKey="focus" onClick={handleOpenTip} label="Manual focus lock and hyperfocal tip" />
                    </div>
                    <span className="text-base sm:text-lg font-black text-sky-400 block mt-0.5 truncate">{formatDualDistance(results.focusDistanceM, 1)}</span>
                    <span className="text-[10px] text-amber-400 font-bold mt-1 block">Turn AF OFF & tape ring!</span>
                  </div>

                  {/* Rotator Detents */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 relative group">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-[10px] uppercase font-mono text-slate-500 block">Rotator Detents</span>
                      <OptimizationTipIcon tipKey="shots_overlap" onClick={handleOpenTip} label="Rotator detent stops tip" />
                    </div>
                    <span className="text-xl font-black text-amber-400 block mt-0.5">4 Shots (90°)</span>
                    <span className="text-[10px] text-emerald-400 font-bold mt-1 block">0° → 90° → 180° → 270°</span>
                  </div>
                </div>

                {/* Panoramic Head Upper Rail Setting Banner */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block">
                        Panoramic Head Upper Rail (No-Parallax Point / NPP):
                      </span>
                      <OptimizationTipIcon tipKey="nodal_point" onClick={handleOpenTip} label="No-Parallax Point calibration tip" />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xl font-mono font-black text-amber-400">
                        {formatDualMm(selectedLens.entrancePupilOffsetMm || 42)}
                      </span>
                      <span className="text-xs text-slate-400">
                        (on {selectedPanoHead.brand} {selectedPanoHead.model})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFieldSheetOpen(true)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow flex items-center gap-1.5"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Download PDF Spec Sheet</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* HDR Auto-Exposure Bracketing (AEB) 3-Shot Card for Beginners */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      HDR Auto-Exposure Bracketing: {results.aebRecommended ? `${results.aebFrames} Frames @ ±${results.aebEvStep} EV (Default)` : 'Single Exposure'}
                    </span>
                    <OptimizationTipIcon tipKey="aeb_hdr" onClick={handleOpenTip} label="HDR & Bracketing field tip" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      DYNAMIC RANGE: {results.totalDynamicRangeStops} EV STOPS
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomAebEnabled(customAebEnabled === false ? true : false)}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border transition ${
                        results.aebRecommended
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {results.aebRecommended ? '✓ 3-Shot AEB ON' : 'AEB OFF'}
                    </button>
                  </div>
                </div>

                {/* 3 Frame Visual Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {results.bracketedFrames.slice(0, 3).map((frame, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border flex flex-col gap-1 ${
                        frame.evOffset < 0
                          ? 'bg-sky-950/30 border-sky-800/60 text-sky-200'
                          : frame.evOffset === 0
                          ? 'bg-slate-950 border-slate-800 text-slate-200'
                          : 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="font-bold">
                          Frame {frame.index} ({frame.evOffset > 0 ? `+${frame.evOffset}` : frame.evOffset} EV)
                        </span>
                        <span className="font-black text-xs text-white">{frame.shutterFraction}</span>
                      </div>
                      <p className="text-[10px] opacity-80 leading-tight">
                        {frame.purpose}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <strong className="text-sky-300">How it works:</strong> At each of the 4 rotation clicks, the camera automatically fires 3 rapid exposures ({results.shotsPerCircle * (results.aebRecommended ? results.aebFrames : 1)} total raw tour shots). When merged in PTGui or Lightroom, bright sunny windows stay detailed without blowing out, while dark room corners stay clean and shadow-free.
                </p>
              </div>

              {/* Visualizer Card (360° Rotator Circle vs Interactive FOV Beam) */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
                  {/* Segmented Switcher */}
                  <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center shadow-inner">
                    <button
                      type="button"
                      onClick={() => setSimpleVisualizerTab('360')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                        simpleVisualizerTab === '360'
                          ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>360° Rotator Circle</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimpleVisualizerTab('FOV')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                        simpleVisualizerTab === 'FOV'
                          ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Field of View (FOV) Beam</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFovModalOpen(true)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 border border-slate-700 transition"
                      title="Expand interactive FOV to fullscreen modal overlay"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Fullscreen FOV</span>
                    </button>
                    <OptimizationTipIcon tipKey="shots_overlap" onClick={handleOpenTip} label="360° rotation visualizer advice" />
                  </div>
                </div>

                {simpleVisualizerTab === '360' ? (
                  <PanoramaVisualizer360
                    shotsPerCircle={results.shotsPerCircle}
                    rotationIncrementDeg={results.rotationIncrementDeg}
                    effectiveHfovDeg={results.horizontalFovDeg}
                    overlapPct={results.overlapPct}
                    lensModel={selectedLens.model}
                    isFisheye={results.isFisheye}
                  />
                ) : (
                  <FovVisualizer />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⚡ ADVANCED / PRO MODE VIEW: Comprehensive Optical Physics & Deep Controls */}
      {/* ========================================================================= */}
      {mode === 'ADVANCED' && (
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
                title="Maximizes panoramic resolution with tighter angular stepping and zoom focal length"
              >
                <Zap className="w-3.5 h-3.5 text-sky-400" />
                <span>Max Megapixels</span>
              </button>

              <button
                type="button"
                onClick={applySpeedFirst}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  qualityPriority === 'FAST'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title="Fewer shots around circle for rapid tour capture and handheld speed"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fast Capture</span>
              </button>
            </div>

            {/* Primary Equipment Pickers */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>Hardware Rig Setup</span>
                <span className="text-[10px] font-mono text-amber-400 font-normal">
                  {selectedCamera.sensorFormat} · {selectedLens.projectionType}
                </span>
              </h3>

              {/* Camera Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-medium">Camera Body:</label>
                <div className="relative">
                  <select
                    value={selectedCamera.id}
                    onChange={(e) => {
                      const cam = cameras.find((c) => c.id === e.target.value);
                      if (cam) setSelectedCamera(cam);
                    }}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none pr-10"
                  >
                    {cameras.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.brand} {c.model} ({c.sensorFormat} · {c.megapixels} MP · {c.cropFactor.toFixed(1)}x)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Lens Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-medium">Lens:</label>
                <div className="relative">
                  <select
                    value={selectedLens.id}
                    onChange={(e) => {
                      const lens = lenses.find((l) => l.id === e.target.value);
                      if (lens) setSelectedLens(lens);
                    }}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none pr-10"
                  >
                    {lenses.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.brand} {l.model} ({l.focalLengthMinMm === l.focalLengthMaxMm ? `${l.focalLengthMinMm}mm` : `${l.focalLengthMinMm}-${l.focalLengthMaxMm}mm`} · {l.projectionType})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Panoramic Head Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-medium">Panoramic Tripod Head:</label>
                <div className="relative">
                  <select
                    value={selectedPanoHead.id}
                    onChange={(e) => {
                      const head = panoHeads.find((h) => h.id === e.target.value);
                      if (head) setSelectedPanoHead(head);
                    }}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none pr-10"
                  >
                    {panoHeads.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.brand} {h.model} ({h.type} · {h.loadCapacity})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Nodal Point Shortcut Card in Advanced Mode */}
              <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>Nodal Point (NPP): {formatDualMm(upperRailOffsetMm || selectedLens.entrancePupilOffsetMm || 42)}</span>
                    <OptimizationTipIcon tipKey="nodal_point" onClick={handleOpenTip} label="No-Parallax Point calibration tip" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Upper rail mark for {selectedPanoHead.brand} {selectedPanoHead.model} to ensure parallax-free stitching.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveVisualizer('NODAL')}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shrink-0 flex items-center gap-1 active:scale-95 shadow-sm"
                  title="Open the dedicated Nodal Point calculation tool"
                >
                  <span>Nodal Tool</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Scenario Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-medium">Shooting Scenario:</label>
                <div className="relative">
                  <select
                    value={selectedScenario.id}
                    onChange={(e) => {
                      const s = scenarios.find((sc) => sc.id === e.target.value);
                      if (s) setSelectedScenario(s);
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
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>Tv / S</span>
                  <span className="text-[9px] opacity-80">Shutter Priority</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExposureDialMode('Av')}
                  className={`py-2 px-2 rounded-xl text-xs font-mono font-bold flex flex-col items-center justify-center transition border ${
                    exposureDialMode === 'Av'
                      ? 'bg-rose-500 text-white font-black shadow-md border-rose-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>Av / A</span>
                  <span className="text-[9px] opacity-80">Aperture Priority</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExposureDialMode('AUTO_SPORTS')}
                  className={`py-2 px-2 rounded-xl text-xs font-mono font-bold flex flex-col items-center justify-center transition border ${
                    exposureDialMode === 'AUTO_SPORTS'
                      ? 'bg-rose-500 text-white font-black shadow-md border-rose-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>Sports/Auto</span>
                  <span className="text-[9px] opacity-80">Never Use</span>
                </button>
              </div>

              {exposureDialMode !== 'M' && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 leading-relaxed flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-bold mb-0.5">Critical Panorama Advisory:</strong>
                    Do NOT shoot 360° panoramas in {exposureDialMode} mode! Auto-exposure changes shutter speed or aperture from shot to shot as you pan toward windows or sun, creating severe exposure banding across stitch seams that PTGui / Hugin cannot balance.
                  </div>
                </div>
              )}
            </div>

            {/* Custom Optical Dials (Aperture & ISO Overrides) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>Manual Optical Dials (Overrides)</span>
                <button
                  type="button"
                  onClick={() => {
                    setCustomAperture(undefined);
                    setCustomIso(undefined);
                  }}
                  className="text-[10px] font-mono text-amber-400 hover:text-amber-300 font-normal underline"
                >
                  Reset to Auto-Engine
                </button>
              </span>

              {/* Aperture Dial */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Aperture Dial:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {customAperture ? `f/${customAperture} (Manual Override)` : `Auto: f/${results.recommendedAperture} (Sweet Spot)`}
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {[2.8, 4, 5.6, 8, 11, 16].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setCustomAperture(customAperture === f ? undefined : f)}
                      className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition ${
                        customAperture === f
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                          : results.recommendedAperture === f && !customAperture
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      f/{f}
                    </button>
                  ))}
                </div>
              </div>

              {/* ISO Dial */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">ISO Dial:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {customIso ? `ISO ${customIso} (Manual)` : `Auto: ISO ${results.recommendedIso}`}
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {[100, 200, 400, 800, 1600, 3200].map((iso) => (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => setCustomIso(customIso === iso ? undefined : iso)}
                      className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition ${
                        customIso === iso
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                          : results.recommendedIso === iso && !customIso
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {iso}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Rotator Detents & Shots Configuration */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <RotateCw className="w-4 h-4 text-amber-400" />
                  <span>Rotator Detents (360° Shots)</span>
                </span>
                <span className="text-xs font-mono text-amber-400 font-bold">
                  {results.shotsPerCircle} Shots @ {results.rotationIncrementDeg}°
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { shots: 3, label: '3s (120°)' },
                  { shots: 4, label: '4s (90°)' },
                  { shots: 6, label: '6s (60°)' },
                  { shots: 8, label: '8s (45°)' },
                  { shots: 12, label: '12s (30°)' },
                ].map((item) => (
                  <button
                    key={item.shots}
                    type="button"
                    onClick={() => setCustomShotsPerCircle(item.shots)}
                    className={`py-1.5 px-1 rounded-xl text-xs font-mono font-bold transition border ${
                      results.shotsPerCircle === item.shots
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* HDR / AEB Bracketing Configuration Panel (Advanced Mode) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>HDR / AEB Exposure Bracketing</span>
                </span>
                <span className="text-xs font-mono text-sky-400 font-bold">
                  {results.aebRecommended ? `${results.aebFrames} Frames @ ±${results.aebEvStep} EV` : 'Single Exposure'}
                </span>
              </div>

              {/* Frames Selector */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Bracket Frame Count:</span>
                  <span className="font-mono text-slate-300 font-bold">
                    {results.aebRecommended ? `${results.aebFrames} frames per stop` : '1 frame (Standard)'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { count: 1, label: 'Single (1)' },
                    { count: 3, label: '3 Frames (Def)' },
                    { count: 5, label: '5 Frames' },
                    { count: 7, label: '7 Frames' },
                  ].map((item) => (
                    <button
                      key={item.count}
                      type="button"
                      onClick={() => {
                        if (item.count === 1) {
                          setCustomAebEnabled(false);
                          setCustomAebFrames(1);
                        } else {
                          setCustomAebEnabled(true);
                          setCustomAebFrames(item.count);
                        }
                      }}
                      className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition ${
                        (results.aebRecommended ? results.aebFrames : 1) === item.count
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* EV Step Selector */}
              {results.aebRecommended && results.aebFrames > 1 && (
                <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">EV Step Size:</span>
                    <span className="font-mono text-slate-300 font-bold">±{results.aebEvStep} EV</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 1.5, 2, 3].map((ev) => (
                      <button
                        key={ev}
                        type="button"
                        onClick={() => setCustomAebEvStep(ev)}
                        className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition ${
                          results.aebEvStep === ev
                            ? 'bg-sky-500 text-slate-950 border-sky-400 font-black shadow'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        ±{ev} EV {ev === 2 ? '(Def)' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Calculated Shutter Bracket Breakdown Table */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-1.5 text-[11px] font-mono">
                <div className="text-[10px] text-slate-400 flex items-center justify-between border-b border-slate-800 pb-1">
                  <span>FRAME BRACKET</span>
                  <span>SHUTTER SPEED</span>
                </div>
                {results.bracketedFrames.map((frame) => (
                  <div key={frame.index} className="flex items-center justify-between">
                    <span className={frame.evOffset < 0 ? 'text-sky-400 font-bold' : frame.evOffset === 0 ? 'text-white font-bold' : 'text-amber-400 font-bold'}>
                      Frame {frame.index} ({frame.evOffset > 0 ? `+${frame.evOffset}` : frame.evOffset} EV)
                    </span>
                    <span className="font-bold text-white">{frame.shutterFraction}</span>
                  </div>
                ))}
                <div className="mt-1 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Dynamic Range: <strong className="text-sky-300">{results.totalDynamicRangeStops} EV</strong></span>
                  <span>Total Tour Shots: <strong className="text-emerald-300">{results.totalRawShotsWithBracketing}</strong></span>
                </div>
              </div>
            </div>

            {/* Advanced Sliders: Distance & Overlap */}
            <div className="flex flex-col gap-3">
              <SliderControl
                label="Approximate Subject / Room Distance"
                value={subjectDistanceM}
                min={0.3}
                max={15}
                step={0.1}
                unit="m"
                displayValueOverride={formatDualDistance(subjectDistanceM)}
                onChange={setSubjectDistanceM}
                presetValues={[
                  { label: '0.5m (1.6ft)', value: 0.5 },
                  { label: '1m (3.3ft)', value: 1.0 },
                  { label: '1.5m (4.9ft)', value: 1.5 },
                  { label: '2m (6.6ft)', value: 2.0 },
                  { label: '3m (9.8ft)', value: 3.0 },
                  { label: '5m (16.4ft)', value: 5.0 },
                ]}
                helperText="Distance to nearest dominant furniture or doorway (Default: 0.5m / 1.64ft)."
              />

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
                    : 'High'
                }
                badgeColor="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                onChange={(val) => setTargetOverlapPct(val / 100)}
                presetValues={[
                  { label: '20%', value: 20 },
                  { label: '25%', value: 25 },
                  { label: '30%', value: 30 },
                  { label: '35%', value: 35 },
                ]}
              />
            </div>
          </div>

          {/* Right Column: Calculations & Visualizer Tabs (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Visualizer Selector Tabs */}
            <div className="flex items-center justify-between gap-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => setActiveVisualizer('360')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition ${
                  activeVisualizer === '360'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>360° Circle</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveVisualizer('FOV')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition ${
                  activeVisualizer === 'FOV'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>FOV Beam</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveVisualizer('ROWS')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition ${
                  activeVisualizer === 'ROWS'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Vertical Rows</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveVisualizer('NODAL')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition ${
                  activeVisualizer === 'NODAL'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Nodal Point</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveVisualizer('EXPOSURE_AEB')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition ${
                  activeVisualizer === 'EXPOSURE_AEB'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>AEB Bracket</span>
              </button>
            </div>

            {/* Active Visualizer Panel */}
            <div className="transition-all duration-200">
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

              {activeVisualizer === 'FOV' && (
                <FovVisualizer />
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

              {activeVisualizer === 'NODAL' && (
                <NodalPointCalculator
                  onApplied={() => {
                    setNotification('Nodal point setting applied to active rig!');
                    setTimeout(() => setNotification(null), 3000);
                  }}
                />
              )}

              {activeVisualizer === 'EXPOSURE_AEB' && (
                <ExposureBracketingPanel />
              )}
            </div>

            {/* Comprehensive Result Card */}
            <ResultCard
              camera={selectedCamera}
              lens={selectedLens}
              scenario={selectedScenario}
              results={results}
              onSavePreset={handleOpenSaveModal}
            />
          </div>
        </div>
      )}

      {/* Save Setup Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Bookmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Save Rig Preset to Section 10</h3>
                <p className="text-xs text-slate-400">
                  Save all optical calculations, camera, lens, and pano head settings into Section 10 (Saved Rigs).
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveRig();
              }}
              className="flex flex-col gap-3.5 text-xs font-mono"
            >
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Preset Title:</label>
                <input
                  type="text"
                  required
                  placeholder={`e.g. Master Rig — ${selectedCamera.model} + ${selectedLens.model}`}
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Field Notes / Scenario Notes (Optional):</label>
                <textarea
                  rows={2}
                  value={presetDesc}
                  onChange={(e) => setPresetDesc(e.target.value)}
                  placeholder="e.g. Real estate interior golden setup, calibrated upper rail at 42mm..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-sans text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Rig Settings Preview */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] grid grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-slate-500 block">Camera:</span>
                  <span className="font-bold text-white">{selectedCamera.brand} {selectedCamera.model}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Lens:</span>
                  <span className="font-bold text-amber-400">{selectedLens.model} ({currentFocalLengthMm}mm)</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Pano Head:</span>
                  <span className="font-bold text-white">{selectedPanoHead.brand} {selectedPanoHead.model}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Detents:</span>
                  <span className="font-bold text-emerald-400">{results.shotsPerCircle} shots ({results.rotationIncrementDeg}°)</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Aperture & ISO:</span>
                  <span className="font-bold text-white">{results.recommendedApertureString} · ISO {results.recommendedIso}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Stitching Overlap:</span>
                  <span className="font-bold text-sky-400">{results.overlapPct}%</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black hover:bg-amber-400 transition shadow"
                >
                  Save Rig to Section 10
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Field of View (FOV) SVG Overlay Modal */}
      <FovVisualizerModal
        isOpen={fovModalOpen}
        onClose={() => setFovModalOpen(false)}
      />

      {/* Optimization Tips Overlay */}
      <OptimizationTipsOverlay
        isOpen={tipsOverlayOpen}
        onClose={() => setTipsOverlayOpen(false)}
        initialTipKey={activeTipKey}
      />

      {/* Field Sheet PDF Modal */}
      <FieldSheetPdfModal
        isOpen={fieldSheetOpen}
        onClose={() => setFieldSheetOpen(false)}
        camera={selectedCamera}
        lens={selectedLens}
        panoHead={selectedPanoHead}
        results={results}
        shotsPerCircle={results.shotsPerCircle}
        subjectDistanceM={subjectDistanceM}
        upperRailMm={selectedLens.entrancePupilOffsetMm || 42}
        lowerRailMm={52}
        panoHeadName={`${selectedPanoHead.brand} ${selectedPanoHead.model}`}
      />
    </div>
  );
};
