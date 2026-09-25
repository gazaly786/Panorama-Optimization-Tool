import React from 'react';
import { usePanorama } from '../context/PanoramaContext';
import { PanoramaVisualizer360 } from '../components/PanoramaVisualizer360';
import { VerticalRowVisualizer } from '../components/VerticalRowVisualizer';
import { SliderControl } from '../components/SliderControl';
import {
  Globe,
  Sliders,
  Compass,
  Layers,
  ArrowRight,
  Info,
  Maximize2,
  CheckCircle,
} from 'lucide-react';
import { PanoramaCoverage } from '../types';

export const PanoramaCalculatorPage: React.FC = () => {
  const {
    selectedCamera,
    selectedLens,
    currentFocalLengthMm,
    targetOverlapPct,
    setTargetOverlapPct,
    coverage,
    setCoverage,
    results,
  } = usePanorama();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <Globe className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-black text-white">Panorama Geometry & Resolution Calculator</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Calculate angular rotation increments, overlap safety margins, multi-row pitches, spherical 360° × 180° coverage, and estimated stitched output dimensions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Overlap & Geometry Controls (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Panorama Coverage Configuration
            </h3>

            {/* Coverage Type Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Desired Panorama Coverage:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: '360x180', label: '360° × 180° Full Sphere' },
                  { id: '360_cylindrical', label: '360° Cylindrical (Horizon)' },
                  { id: 'partial_horizontal', label: 'Partial Horizontal Panorama' },
                  { id: 'custom', label: 'Custom Multi-Row' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCoverage(item.id as PanoramaCoverage)}
                    className={`p-2.5 rounded-xl text-xs font-mono font-bold text-left transition border ${
                      coverage === item.id
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/40 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Overlap Slider */}
            <SliderControl
              label="Stitching Overlap Percentage"
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
                  ? 'High Overlap'
                  : 'Very High Overlap'
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
                { label: '10%', value: 10 },
                { label: '20%', value: 20 },
                { label: '25%', value: 25 },
                { label: '30%', value: 30 },
                { label: '35%', value: 35 },
                { label: '40%', value: 40 },
                { label: '50%', value: 50 },
              ]}
              helperText="Increasing overlap improves automatic control-point matching on plain walls and reduces lens-edge distortion artifacts."
            />

            {/* Overlap Trade-off Education Card */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs flex flex-col gap-2">
              <span className="font-mono font-bold text-slate-200 uppercase flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-400" />
                <span>How Overlap Impacts Your Workflow</span>
              </span>
              <ul className="flex flex-col gap-1.5 text-slate-400 text-[11px] leading-relaxed">
                <li>• <strong className="text-slate-300">Stitching Reliability:</strong> Higher overlap guarantees feature recognition in textureless rooms or blue skies.</li>
                <li>• <strong className="text-slate-300">Number of Images:</strong> Moving from 25% to 50% overlap doubles total shot count and file storage.</li>
                <li>• <strong className="text-slate-300">Processing Time:</strong> More shots increases PTGui / Hugin control-point detection and blending time.</li>
                <li>• <strong className="text-slate-300">Parallax Risk:</strong> Greater overlap provides wider seam transition zones to mask foreground objects.</li>
              </ul>
            </div>
          </div>

          {/* Output Panorama Resolution Estimator */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Estimated Output Resolution</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                2:1 Equirectangular
              </span>
            </h3>

            <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Width × Height</span>
                <span className="text-base font-bold text-white mt-0.5 block truncate">
                  {results.estimatedPanoWidthPx} × {results.estimatedPanoHeightPx} px
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Output Megapixels</span>
                <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                  ~{results.estimatedMegapixels} MP
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              * Note: Actual final dimensions depend on the stitching projection (Equirectangular, Mercator, or Cylindrical), lens distortion profile, and seam blending margins in PTGui or Hugin.
            </p>
          </div>
        </div>

        {/* Right Column: Visualizers (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <PanoramaVisualizer360
            shotsPerCircle={results.shotsPerCircle}
            rotationIncrementDeg={results.rotationIncrementDeg}
            effectiveHfovDeg={results.horizontalFovDeg}
            overlapPct={results.overlapPct}
            lensModel={selectedLens.model}
            isFisheye={results.isFisheye}
          />

          <VerticalRowVisualizer
            numRows={results.numRows}
            rowPitchesDeg={results.rowPitchesDeg}
            shotsPerRow={results.shotsPerRow}
            zenithShotRecommended={results.numRows > 1 || results.verticalFovDeg < 170}
            nadirShotRecommended={results.nadirShotRecommended}
            effectiveVfovDeg={results.verticalFovDeg}
            totalShots={results.totalShots}
          />
        </div>
      </div>
    </div>
  );
};
