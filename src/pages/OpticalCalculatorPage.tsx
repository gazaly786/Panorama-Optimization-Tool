import React, { useState } from 'react';
import { usePanorama } from '../context/PanoramaContext';
import { calculateDof, getCircleOfConfusionMm } from '../calculations/dof';
import { calculateHyperfocalDistanceM, getHyperfocalTable } from '../calculations/hyperfocal';
import { assessDiffraction, calculateAiryDiskUm } from '../calculations/diffraction';
import { SliderControl } from '../components/SliderControl';
import { InfinityFocusSweetSpotGraph } from '../components/InfinityFocusSweetSpotGraph';
import { ExposureBracketingPanel } from '../components/ExposureBracketingPanel';
import {
  Calculator,
  Eye,
  Sliders,
  Sparkles,
  ShieldAlert,
  Info,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const OpticalCalculatorPage: React.FC = () => {
  const {
    selectedCamera,
    selectedLens,
    currentFocalLengthMm,
    customCoCMm,
    setCustomCoCMm,
  } = usePanorama();

  const [aperture, setAperture] = useState<number>(8.0);
  const [focusDistanceM, setFocusDistanceM] = useState<number>(1.2);
  const [focalLengthMm, setFocalLengthMm] = useState<number>(currentFocalLengthMm || 8);
  const [customCoCInput, setCustomCoCInput] = useState<number>(getCircleOfConfusionMm(selectedCamera, customCoCMm));

  const coc = customCoCMm || getCircleOfConfusionMm(selectedCamera);
  const dof = calculateDof(focalLengthMm, aperture, focusDistanceM, coc);
  const hyperfocalTable = getHyperfocalTable(focalLengthMm, selectedCamera, coc);
  const diffraction = assessDiffraction(aperture, selectedCamera, selectedLens);

  // Aperture candidates for comparative analysis
  const candidateApertures = [2.8, 4.0, 5.6, 8.0, 11.0, 16.0, 22.0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <Calculator className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-black text-white">Advanced Optical & Depth of Field Engine</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Explore optical depth of field, hyperfocal distances, sensor circle of confusion, Airy disk diameter, and pixel-density diffraction trade-offs.
        </p>
      </div>

      {/* Primary Optical Bench Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Optical Sliders (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Optical Bench Parameters
            </h3>

            {/* Current Gear Summary */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Camera:</span>
                <span className="font-bold text-white">{selectedCamera.brand} {selectedCamera.model}</span>
              </div>
              <div className="flex justify-between text-slate-400 mt-1">
                <span>Sensor:</span>
                <span className="text-amber-400 font-bold">{selectedCamera.sensorFormat} ({selectedCamera.cropFactor}x)</span>
              </div>
              <div className="flex justify-between text-slate-400 mt-1">
                <span>Pixel Pitch:</span>
                <span className="text-sky-400 font-bold">{selectedCamera.pixelPitchUm} μm</span>
              </div>
            </div>

            {/* Aperture Slider */}
            <SliderControl
              label="Aperture (f-number)"
              value={aperture}
              min={2.8}
              max={22}
              step={0.5}
              displayValueOverride={`f/${aperture}`}
              onChange={setAperture}
              presetValues={[
                { label: 'f/2.8', value: 2.8 },
                { label: 'f/4', value: 4 },
                { label: 'f/5.6', value: 5.6 },
                { label: 'f/8', value: 8 },
                { label: 'f/11', value: 11 },
                { label: 'f/16', value: 16 },
                { label: 'f/22', value: 22 },
              ]}
              helperText={`Sweet spot for this lens: ${selectedLens.sweetSpotAperture || 'f/5.6 - f/8'}`}
            />

            {/* Focus Distance Slider */}
            <SliderControl
              label="Focus Distance"
              value={focusDistanceM}
              min={0.3}
              max={15}
              step={0.1}
              unit="m"
              onChange={setFocusDistanceM}
              presetValues={[
                { label: '0.5m', value: 0.5 },
                { label: '1m', value: 1.0 },
                { label: '1.2m', value: 1.2 },
                { label: '2m', value: 2.0 },
                { label: `H (${dof.hyperfocalDistanceM}m)`, value: dof.hyperfocalDistanceM },
                { label: '5m', value: 5.0 },
              ]}
              helperText={`Near Limit: ${dof.nearLimitM}m · Far Limit: ${dof.farLimitM === 'Infinity' ? '∞' : `${dof.farLimitM}m`}`}
            />

            {/* Focal Length Slider */}
            <SliderControl
              label="Lens Focal Length"
              value={focalLengthMm}
              min={selectedLens.focalLengthMinMm}
              max={Math.max(selectedLens.focalLengthMaxMm, 24)}
              step={1}
              unit="mm"
              onChange={setFocalLengthMm}
              helperText={`Effective full-frame equivalent: ${(focalLengthMm * selectedCamera.cropFactor).toFixed(1)}mm`}
            />

            {/* Circle of Confusion Override */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Circle of Confusion (CoC):</span>
                <span className="font-mono text-amber-400 font-bold">{coc.toFixed(4)} mm</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setCustomCoCMm(undefined)}
                  className="px-2.5 py-1 rounded bg-slate-800 text-[11px] font-mono text-slate-300 hover:text-white"
                >
                  Standard (d/1500)
                </button>
                <button
                  type="button"
                  onClick={() => setCustomCoCMm(Math.round((selectedCamera.sensorDiagonalMm / 1730) * 10000) / 10000)}
                  className="px-2.5 py-1 rounded bg-slate-800 text-[11px] font-mono text-slate-300 hover:text-white"
                >
                  High-Res (d/1730)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Graph, Visual Depth Bar, Hyperfocal Table, Diffraction Graph (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Interactive Infinity Focus Sweet Spot Graph */}
          <InfinityFocusSweetSpotGraph
            focalLengthMm={focalLengthMm}
            aperture={aperture}
            focusDistanceM={focusDistanceM}
            onFocusChange={setFocusDistanceM}
            circleOfConfusionMm={coc}
            cameraModel={selectedCamera.model}
            lensModel={selectedLens.model}
          />

          {/* Depth of Field Visual Span Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>Depth of Field Visual Span</span>
              </h3>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {dof.nearLimitM}m to {dof.farLimitM === 'Infinity' ? '∞ (Infinity)' : `${dof.farLimitM}m`}
              </span>
            </div>

            {/* Visual Depth Bar */}
            <div className="relative w-full h-12 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center px-4">
              {/* Scale Labels */}
              <div className="absolute inset-0 flex justify-between px-3 text-[10px] font-mono text-slate-600 pointer-events-none items-end pb-1">
                <span>0m</span>
                <span>1m</span>
                <span>2m</span>
                <span>3m</span>
                <span>5m</span>
                <span>10m</span>
                <span>∞ (Infinity)</span>
              </div>

              {/* In-Focus Region Highlight */}
              <div
                className="h-6 rounded-md bg-emerald-500/30 border border-emerald-500/50 shadow-inner flex items-center justify-center transition-all duration-200"
                style={{
                  width: dof.farLimitM === 'Infinity' ? '75%' : '50%',
                  marginLeft: `${Math.min(30, dof.nearLimitM * 12)}%`,
                }}
              >
                <span className="text-[10px] font-mono text-emerald-300 font-bold uppercase px-2 truncate">
                  Sharp Focus Zone: {dof.nearLimitM}m → {dof.farLimitM === 'Infinity' ? '∞' : `${dof.farLimitM}m`}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Near Sharp Limit</span>
                <span className="font-bold text-slate-200">{dof.nearLimitM} m</span>
              </div>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Focus Point</span>
                <span className="font-bold text-amber-400">{dof.focusDistanceM} m</span>
              </div>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Hyperfocal (H)</span>
                <span className="font-bold text-sky-400">{dof.hyperfocalDistanceM} m</span>
              </div>
            </div>
          </div>

          {/* Diffraction & Pixel Pitch Assessment Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Diffraction vs Sensor Pixel Density
                </h3>
              </div>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                diffraction.status === 'LOW'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : diffraction.status === 'MODERATE'
                  ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                  : diffraction.status === 'HIGH'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}>
                {diffraction.status} DIFFRACTION
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Airy Disk Diameter</span>
                <span className="font-bold text-amber-400">{diffraction.airyDiskDiameterUm.toFixed(2)} μm</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Pixel Pitch</span>
                <span className="font-bold text-sky-400">{diffraction.pixelPitchUm.toFixed(2)} μm</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Airy / Pixel Ratio</span>
                <span className="font-bold text-emerald-400">{diffraction.ratio.toFixed(1)}x</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              {diffraction.recommendationNote}
            </p>

            {diffraction.warning && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{diffraction.warning}</span>
              </div>
            )}
          </div>

          {/* Hyperfocal Reference Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Hyperfocal Distance Reference Table ({focalLengthMm}mm)</span>
              <span className="text-[10px] font-mono text-slate-500">Formula: H = f² / (N·c) + f</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-3">Aperture</th>
                    <th className="py-2 px-3">Hyperfocal (H)</th>
                    <th className="py-2 px-3">Near Sharp Limit</th>
                    <th className="py-2 px-3">Diffraction Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {hyperfocalTable.map((row) => {
                    const dDiff = assessDiffraction(row.aperture, selectedCamera);
                    const isSelected = row.aperture === aperture;

                    return (
                      <tr
                        key={row.aperture}
                        onClick={() => setAperture(row.aperture)}
                        className={`cursor-pointer transition ${
                          isSelected ? 'bg-amber-500/10 text-amber-300 font-bold' : 'hover:bg-slate-800/60 text-slate-300'
                        }`}
                      >
                        <td className="py-2 px-3 font-bold">{row.apertureLabel}</td>
                        <td className="py-2 px-3">{row.hyperfocalM} m</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">{row.nearLimitM} m</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            dDiff.status === 'LOW' ? 'bg-emerald-500/20 text-emerald-400' :
                            dDiff.status === 'MODERATE' ? 'bg-sky-500/20 text-sky-400' :
                            dDiff.status === 'HIGH' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {dDiff.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Exposure Value (EV) & Auto Exposure Bracketing (AEB) Engine */}
      <ExposureBracketingPanel />
    </div>
  );
};
