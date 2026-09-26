import React, { useState } from 'react';
import { usePanorama } from '../context/PanoramaContext';
import { calculateNodalAlignment } from '../calculations/nodal';
import { FieldSheetPdfModal } from '../components/FieldSheetPdfModal';
import { ExcelGearUploadModal } from '../components/ExcelGearUploadModal';
import {
  formatDualMm,
  formatDualDistance,
  formatDualDimensions,
  formatDetentAngles,
  mmToInches,
} from '../utils/units';
import {
  Wrench,
  Camera,
  Layers,
  Crosshair,
  Sliders,
  CheckCircle,
  Save,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Printer,
  Sparkles,
  RotateCw,
  Compass,
  FileText,
  HelpCircle,
  Check,
  FileSpreadsheet,
} from 'lucide-react';

const POPULAR_PANO_HEADS = [
  { name: 'Nodal Ninja 4 (Fanotec)', lowerRailMaxMm: 120, upperRailMaxMm: 140, clickStops: [90, 60, 45, 36, 30] },
  { name: 'Nodal Ninja 3 MKII', lowerRailMaxMm: 100, upperRailMaxMm: 120, clickStops: [90, 60, 45, 30] },
  { name: 'Nodal Ninja 6', lowerRailMaxMm: 140, upperRailMaxMm: 160, clickStops: [90, 60, 45, 36, 30, 24, 20] },
  { name: 'Leofoto PAN-02 / Bushman', lowerRailMaxMm: 110, upperRailMaxMm: 130, clickStops: [90, 60, 45, 30] },
  { name: 'Sunwayfoto CR-30', lowerRailMaxMm: 110, upperRailMaxMm: 120, clickStops: [90, 60, 45, 30] },
  { name: 'Custom Panoramic Head', lowerRailMaxMm: 150, upperRailMaxMm: 150, clickStops: [90, 60, 45, 36, 30] },
];

const PRESET_SHOT_COUNTS = [
  { shots: 3, label: '3 Shots (120°)', tag: 'Ultra Fisheye' },
  { shots: 4, label: '4 Shots (90°)', tag: 'Fast 4-Sides' },
  { shots: 6, label: '6 Shots (60°)', tag: 'Golden Standard' },
  { shots: 8, label: '8 Shots (45°)', tag: '8-Sides Octagon' },
  { shots: 10, label: '10 Shots (36°)', tag: 'Detailed' },
  { shots: 12, label: '12 Shots (30°)', tag: 'Ultra-Wide Rectilinear' },
  { shots: 16, label: '16 Shots (22.5°)', tag: 'High-Res' },
  { shots: 24, label: '24 Shots (15°)', tag: 'Gigapixel' },
];

export const EquipmentBuilderPage: React.FC<{ onNavigateToOptimizer: () => void }> = ({
  onNavigateToOptimizer,
}) => {
  const {
    cameras,
    lenses,
    selectedCamera,
    selectedLens,
    setSelectedCamera,
    setSelectedLens,
    results,
    saveCurrentSetup,
    subjectDistanceM,
    setSubjectDistanceM,
    customShotsPerCircle,
    setCustomShotsPerCircle,
    setTargetOverlapPct,
    setCustomAperture,
  } = usePanorama();

  const [selectedPanoHead, setSelectedPanoHead] = useState(POPULAR_PANO_HEADS[0]);
  const [rigName, setRigName] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  // Shots slider state (defaults to active custom or calculated shots)
  const currentShots = customShotsPerCircle || results.shotsPerCircle || 4;

  // Always use the standard 0.5m default distance
  const activeDistance = subjectDistanceM !== undefined ? subjectDistanceM : 0.5;
  const nodal = calculateNodalAlignment(selectedCamera, selectedLens, activeDistance);

  // Live calculations for current slider shots count
  const stepAngle = Math.round((360 / currentShots) * 10) / 10;
  const liveOverlapPct = Math.round((1 - (stepAngle / Math.max(10, results.horizontalFovDeg))) * 100);
  const detentSequence = formatDetentAngles(currentShots);

  // Overlap assessment
  let overlapBadgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let overlapStatus = 'Optimal Super Panorama Sweet Spot (25–40%)';
  if (liveOverlapPct < 15) {
    overlapBadgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    overlapStatus = 'Critical Risk: Overlap is under 15%! Stitching will likely fail or require manual control points.';
  } else if (liveOverlapPct < 25) {
    overlapBadgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    overlapStatus = 'Marginal (Tight): 15–24% overlap. Requires high-contrast textures across every seam.';
  } else if (liveOverlapPct > 45) {
    overlapBadgeColor = 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    overlapStatus = 'High Redundancy: >45% overlap. Super safe stitching with extra processing time.';
  }

  // Handle shots count change
  const handleShotsChange = (shots: number) => {
    setCustomShotsPerCircle(shots);
  };

  // 1-Click Super Panorama Auto-Tune
  const handleAutoTuneSuperOutput = () => {
    // If current lens is wide fisheye (>=120° HFOV), 4 to 6 shots is the gold standard
    if (results.horizontalFovDeg >= 120) {
      setCustomShotsPerCircle(4);
      setTargetOverlapPct(0.30);
    } else if (results.horizontalFovDeg >= 80) {
      setCustomShotsPerCircle(6);
      setTargetOverlapPct(0.30);
    } else {
      setCustomShotsPerCircle(12);
      setTargetOverlapPct(0.30);
    }
    setSubjectDistanceM(0.5); // enforce standard 0.5m default
    setCustomAperture(8.0); // golden optical diffraction sweet spot
  };

  const handleSaveRig = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName =
      rigName.trim() ||
      `${selectedCamera.model} + ${selectedLens.model} (${currentShots}-Shot ${selectedPanoHead.name.split(' ')[0]})`;
    saveCurrentSetup(
      finalName,
      `Configured with ${selectedPanoHead.name}, ${currentShots} shots around (${stepAngle}°), Upper rail: ${formatDualMm(nodal.upperRailSettingMm)}, Lower rail: ${formatDualMm(nodal.lowerRailSettingMm)}`
    );
    setSavedSuccess(true);
    setRigName('');
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-black text-white">Equipment Builder & Rig Configurator</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pair camera bodies, fisheye/rectilinear lenses, and panoramic heads. Generates field-ready rail calibrations, rotator steps, and printable PDF field demographic sheets.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsExcelModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Upload Gear Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow-lg"
          >
            <Printer className="w-4 h-4" />
            <span>Generate Field PDF Sheet</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToOptimizer}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
          >
            <span>Test Rig in Optimizer</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Gear & Shots Count Configurator (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Hardware Assembly */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              1. Assemble Your Hardware Components
            </h3>

            {/* Camera Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Select Camera Body:</label>
              <select
                value={selectedCamera.id}
                onChange={(e) => {
                  const cam = cameras.find((c) => c.id === e.target.value);
                  if (cam) setSelectedCamera(cam);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.brand} {c.model} ({c.sensorFormat} · {c.megapixels}MP)
                  </option>
                ))}
              </select>
            </div>

            {/* Lens Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Select Lens:</label>
              <select
                value={selectedLens.id}
                onChange={(e) => {
                  const l = lenses.find((item) => item.id === e.target.value);
                  if (l) setSelectedLens(l);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {lenses.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.brand} {l.model} [{l.projectionType}]
                  </option>
                ))}
              </select>
            </div>

            {/* Panoramic Head Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Select Panoramic Head Model:</label>
              <select
                value={selectedPanoHead.name}
                onChange={(e) => {
                  const head = POPULAR_PANO_HEADS.find((h) => h.name === e.target.value);
                  if (head) setSelectedPanoHead(head);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {POPULAR_PANO_HEADS.map((h) => (
                  <option key={h.name} value={h.name}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Optical Demographics Summary with Dual Units */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Sensor Size</span>
                <span className="font-semibold text-slate-200">
                  {formatDualDimensions(selectedCamera.sensorWidthMm, selectedCamera.sensorHeightMm)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Focal Length</span>
                <span className="font-semibold text-slate-200">
                  {formatDualMm(selectedLens.focalLengthMinMm)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Default Distance</span>
                <span className="font-bold text-amber-400">
                  {formatDualDistance(activeDistance)}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Interactive Shots Count Slider (Each Side Rotation & Super Panorama Engine) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  2. 360° Shots Count & Rotation Tuning (Each Side)
                </h3>
              </div>

              <button
                type="button"
                onClick={handleAutoTuneSuperOutput}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition"
                title="Automatically adjust settings to produce the highest quality panorama output"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Tune for Super Output</span>
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select how many shots to take around the 360° circle. For example, <strong>4 Shots</strong> covers 4 sides with 90° rotation intervals. Other settings (overlap, detents, total exposures) automatically adapt to guarantee seamless stitching.
            </p>

            {/* Shots Slider Control */}
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Shots per 360° circle (Each side step):
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-mono font-black text-amber-400">
                    {currentShots} Shots
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    ({stepAngle}° per click)
                  </span>
                </div>
              </div>

              <input
                type="range"
                min={3}
                max={24}
                step={1}
                value={currentShots}
                onChange={(e) => handleShotsChange(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />

              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>3 Shots (120°)</span>
                <span>4 (90°)</span>
                <span>6 (60°)</span>
                <span>8 (45°)</span>
                <span>12 (30°)</span>
                <span>16 (22.5°)</span>
                <span>24 (15°)</span>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              {PRESET_SHOT_COUNTS.map((item) => (
                <button
                  key={item.shots}
                  type="button"
                  onClick={() => handleShotsChange(item.shots)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                    currentShots === item.shots
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>{item.label}</span>
                  {currentShots === item.shots && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>

            {/* Dynamic Results & Stitching Overlap Gauge */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase">
                    Resulting Overlap & Safety Rating:
                  </span>
                </div>
                <div className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${overlapBadgeColor}`}>
                  {liveOverlapPct}% Overlap
                </div>
              </div>

              {/* Progress bar showing overlap range */}
              <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden flex border border-slate-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    liveOverlapPct < 15
                      ? 'bg-rose-500'
                      : liveOverlapPct < 25
                      ? 'bg-amber-500'
                      : liveOverlapPct <= 45
                      ? 'bg-emerald-500'
                      : 'bg-sky-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, liveOverlapPct))}%` }}
                />
              </div>

              <div className="text-xs text-slate-400 leading-relaxed">
                {overlapStatus}
              </div>

              {/* Detent Angle Sequence */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500">Rotation Detents:</span>
                <span className="font-mono text-amber-400 font-bold">
                  {detentSequence.map((a) => `${a}°`).join(' → ')}
                </span>
              </div>
            </div>

            {/* Save Rig Form */}
            <form onSubmit={handleSaveRig} className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                placeholder={`Name this rig (e.g. 'Gazaly — ${selectedCamera.model} + ${selectedLens.model} (${currentShots}S)')`}
                value={rigName}
                onChange={(e) => setRigName(e.target.value)}
                className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save to My Rigs</span>
              </button>
            </form>

            {savedSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Rig preset successfully saved to Local Storage! Access it anytime from 'Saved Rigs'.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Calculated Nodal Calibration & Rail Settings (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-amber-400" />
                <span>Panoramic Head Rail Calibration</span>
              </h3>

              <button
                type="button"
                onClick={() => setIsPdfModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF Spec Sheet</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {/* Upper Rail Card (Dual Units) */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Upper Rail Offset (Entrance Pupil / NPP)</span>
                  <span className="text-2xl font-mono font-black text-amber-400 block mt-0.5">
                    {formatDualMm(nodal.upperRailSettingMm)}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Front index pupil: ~{formatDualMm(selectedLens.entrancePupilOffsetMm || 42)}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
              </div>

              {/* Lower Rail Card (Dual Units) */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Lower Rail Offset (Sensor Center)</span>
                  <span className="text-2xl font-mono font-black text-sky-400 block mt-0.5">
                    {formatDualMm(nodal.lowerRailSettingMm)}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Centers lens optical axis over rotator axis
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                  <Crosshair className="w-5 h-5" />
                </div>
              </div>

              {/* Rotator Detent Recommendation */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Rotator Detent Click-Stop</span>
                  <span className="text-2xl font-mono font-black text-emerald-400 block mt-0.5">
                    {stepAngle}° ({currentShots} shots)
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Provides ~{liveOverlapPct}% horizontal overlap
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Compass className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Calibration Checklist */}
            <div className="pt-3 border-t border-slate-800">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase block mb-2">
                Alignment Guide for {selectedPanoHead.name}
              </span>
              <ul className="flex flex-col gap-2 text-xs text-slate-400">
                {nodal.alignmentChecklist.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold shrink-0">{idx + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Action Button for Field Sheet PDF */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsPdfModalOpen(true)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition"
              >
                <Printer className="w-4 h-4" />
                <span>Generate Clean Field PDF Sheet</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Field Specification Modal */}
      <FieldSheetPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        camera={selectedCamera}
        lens={selectedLens}
        panoHeadName={selectedPanoHead.name}
        upperRailMm={nodal.upperRailSettingMm}
        lowerRailMm={nodal.lowerRailSettingMm}
        subjectDistanceM={activeDistance}
        results={results}
        shotsPerCircle={currentShots}
        rigTitle={rigName || `${selectedCamera.brand} ${selectedCamera.model} + ${selectedLens.brand} ${selectedLens.model} (${currentShots}-Shot Rig)`}
      />

      {/* Excel Upload Modal */}
      <ExcelGearUploadModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
      />
    </div>
  );
};
