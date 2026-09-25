import React, { useState } from 'react';
import { usePanorama } from '../context/PanoramaContext';
import { calculateNodalAlignment } from '../calculations/nodal';
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
} from 'lucide-react';

const POPULAR_PANO_HEADS = [
  { name: 'Nodal Ninja 4 (Fanotec)', lowerRailMaxMm: 120, upperRailMaxMm: 140, clickStops: [60, 45, 36, 30] },
  { name: 'Nodal Ninja 3 MKII', lowerRailMaxMm: 100, upperRailMaxMm: 120, clickStops: [90, 60, 45, 30] },
  { name: 'Nodal Ninja 6', lowerRailMaxMm: 140, upperRailMaxMm: 160, clickStops: [60, 45, 36, 30, 24, 20] },
  { name: 'Leofoto PAN-02 / Bushman', lowerRailMaxMm: 110, upperRailMaxMm: 130, clickStops: [60, 45, 30] },
  { name: 'Sunwayfoto CR-30', lowerRailMaxMm: 110, upperRailMaxMm: 120, clickStops: [90, 60, 45, 30] },
  { name: 'Custom Panoramic Head', lowerRailMaxMm: 150, upperRailMaxMm: 150, clickStops: [60, 45, 36, 30] },
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
  } = usePanorama();

  const [selectedPanoHead, setSelectedPanoHead] = useState(POPULAR_PANO_HEADS[0]);
  const [rigName, setRigName] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const nodal = calculateNodalAlignment(selectedCamera, selectedLens, 2.0);

  // Mount compatibility check
  const isMountMatching =
    selectedLens.lensMount.toLowerCase().includes(selectedCamera.brand.toLowerCase()) ||
    selectedLens.lensMount.toLowerCase().includes(selectedCamera.lensMount.toLowerCase()) ||
    selectedLens.lensMount.includes('/') ||
    selectedCamera.lensMount.includes('/');

  const handleSaveRig = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = rigName.trim() || `${selectedCamera.model} + ${selectedLens.model} (${selectedPanoHead.name.split(' ')[0]})`;
    saveCurrentSetup(finalName, `Configured with ${selectedPanoHead.name}, Upper rail: ${nodal.upperRailSettingMm}mm, Lower rail: ${nodal.lowerRailSettingMm}mm`);
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
            Pair camera bodies, fisheye/rectilinear lenses, and panoramic tripod heads. Calculates upper and lower rail nodal calibration points.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToOptimizer}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-md"
        >
          <span>Test Rig in Optimizer</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Gear Selector (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
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

            {/* Compatibility Alert */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-200 block">Mechanical & Optical Compatibility Check</span>
                <span className="text-slate-400 leading-relaxed block mt-0.5">
                  {selectedCamera.brand} {selectedCamera.model} ({selectedCamera.lensMount}) paired with {selectedLens.brand} {selectedLens.model} ({selectedLens.lensMount}).
                  {selectedLens.projectionType.startsWith('fisheye')
                    ? ` This fisheye produces a wide ${results.horizontalFovDeg}° field of view on the ${selectedCamera.sensorFormat} sensor, perfect for 360° panos.`
                    : ` Rectilinear ultra-wide coverage (${results.horizontalFovDeg}° HFOV) requires a multi-row shooting strategy.`}
                </span>
              </div>
            </div>

            {/* Save Rig Form */}
            <form onSubmit={handleSaveRig} className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                placeholder={`Name this rig (e.g. 'Gazaly — ${selectedCamera.model} + ${selectedLens.model}')`}
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-amber-400" />
              <span>Panoramic Head Rail Calibration</span>
            </h3>

            <div className="flex flex-col gap-3">
              {/* Upper Rail Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Upper Rail Offset (Entrance Pupil)</span>
                  <span className="text-2xl font-mono font-black text-amber-400">{nodal.upperRailSettingMm} mm</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">Lens pupil ~{selectedLens.entrancePupilOffsetMm || 42}mm from front index ring</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Sliders className="w-5 h-5" />
                </div>
              </div>

              {/* Lower Rail Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Lower Rail Offset (Sensor Center)</span>
                  <span className="text-2xl font-mono font-black text-sky-400">{nodal.lowerRailSettingMm} mm</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">Centers lens optical axis over rotator axis</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Crosshair className="w-5 h-5" />
                </div>
              </div>

              {/* Rotator Detent Recommendation */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Rotator Detent Click-Stop</span>
                  <span className="text-2xl font-mono font-black text-emerald-400">{results.rotationIncrementDeg}° ({results.shotsPerCircle} shots)</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">Provides ~{results.overlapPct}% overlap for stitching</span>
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
          </div>
        </div>
      </div>
    </div>
  );
};
