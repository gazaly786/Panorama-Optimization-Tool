import React from 'react';
import { usePanorama } from '../context/PanoramaContext';
import { PanoramaVisualizer360 } from '../components/PanoramaVisualizer360';
import { VerticalRowVisualizer } from '../components/VerticalRowVisualizer';
import { SliderControl } from '../components/SliderControl';
import {
  formatDualMm,
  formatDualDimensions,
  formatDetentAngles,
} from '../utils/units';
import { calculateNodalAlignment } from '../calculations/nodal';
import { PanoHeadSpec, PanoramaCoverage } from '../types';
import {
  Globe,
  Sliders,
  Compass,
  Layers,
  Info,
  RotateCw,
  Check,
  CheckCircle,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

export const PanoramaCalculatorPage: React.FC = () => {
  const {
    selectedCamera,
    selectedLens,
    selectedPanoHead,
    setSelectedPanoHead,
    panoHeads,
    applyPanoHeadRecommendedSettings,
    currentFocalLengthMm,
    targetOverlapPct,
    setTargetOverlapPct,
    customShotsPerCircle,
    setCustomShotsPerCircle,
    coverage,
    setCoverage,
    results,
  } = usePanorama();

  const currentShots = customShotsPerCircle || results.shotsPerCircle || 4;
  const stepAngle = Math.round((360 / currentShots) * 10) / 10;
  const detentSequence = formatDetentAngles(currentShots);

  const handleShotsChange = (shots: number) => {
    setCustomShotsPerCircle(shots);
  };

  // Group pano heads by brand
  const groupedPanoHeads = panoHeads.reduce((acc, head) => {
    const brand = head.brand || 'Other';
    if (!acc[brand]) acc[brand] = [];
    acc[brand].push(head);
    return acc;
  }, {} as Record<string, PanoHeadSpec[]>);

  // Check if current shots count matches a native detent stop on the active pano head
  const isNativeHardwareStop = selectedPanoHead?.supportedShots?.includes(currentShots) || false;

  // Nodal alignment results for rail guidelines
  const nodalAlignment = calculateNodalAlignment(selectedCamera, selectedLens, 0.5, selectedPanoHead);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-black text-white">Panorama Geometry & Resolution Calculator</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Calculate angular rotation increments, overlap safety margins, shots count per circle, multi-row pitches, and estimated stitched equirectangular resolution.
          </p>
        </div>

        {/* Gear Context Pill with Dual Units */}
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-right">
          <div className="text-white font-bold">
            {selectedCamera.brand} {selectedCamera.model} · {selectedLens.brand} {selectedLens.model}
          </div>
          <div className="text-slate-400 font-mono text-[11px] mt-0.5">
            Sensor: {formatDualDimensions(selectedCamera.sensorWidthMm, selectedCamera.sensorHeightMm)} · Lens: {formatDualMm(currentFocalLengthMm)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Overlap & Geometry Controls (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Panoramic Head Specification & Hardware Detent Alignment */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Panoramic Head Specification</span>
              </h3>
              <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {panoHeads.length} Heads in DB
              </span>
            </div>

            {/* Pano Head Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Select Panoramic Tripod Head:</label>
              <div className="relative">
                <select
                  value={selectedPanoHead.id}
                  onChange={(e) => {
                    const head = panoHeads.find((h) => h.id === e.target.value);
                    if (head) setSelectedPanoHead(head);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none pr-10"
                >
                  {Object.entries(groupedPanoHeads).map(([brand, heads]) => (
                    <optgroup key={brand} label={brand} className="bg-slate-900 text-white font-semibold">
                      {heads.map((h) => (
                        <option key={h.id} value={h.id} className="bg-slate-950 text-slate-200">
                          {h.brand} — {h.model} ({h.type} · {h.loadCapacity})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Selected Pano Head Spec Details */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-sm">
                    {selectedPanoHead.brand} {selectedPanoHead.model}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {selectedPanoHead.type}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                    Load: {selectedPanoHead.loadCapacity}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex flex-col gap-1 pt-1.5 border-t border-slate-800/80">
                <div>
                  <span className="text-slate-500 font-mono">Rotator Detent Options: </span>
                  <span className="text-slate-200">{selectedPanoHead.rotatorDetentOptions}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-mono">Setup Method: </span>
                  <span className="text-slate-300">{selectedPanoHead.setupMethod}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-mono">Compatibility: </span>
                  <span className="text-slate-400">{selectedPanoHead.compatibility}</span>
                </div>
              </div>

              {/* Native Click Stop Buttons for this Pano Head */}
              {selectedPanoHead.detentStopsDeg && selectedPanoHead.detentStopsDeg.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                      Hardware Detent Stops (Click to Apply):
                    </span>
                    <button
                      type="button"
                      onClick={() => applyPanoHeadRecommendedSettings(selectedPanoHead)}
                      className="text-[10px] font-mono text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition"
                      title="Auto-select optimal native detent stop for current camera & lens FOV"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Auto-Match Stop</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPanoHead.detentStopsDeg.map((deg, idx) => {
                      const shots = Math.round(360 / deg);
                      const isSelected = currentShots === shots;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleShotsChange(shots)}
                          className={`px-2 py-1 rounded text-xs font-mono font-bold border transition ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600'
                          }`}
                          title={`Set ${shots} shots around 360° (${deg}° click stop)`}
                        >
                          {deg}° ({shots}s)
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Hardware Match Status Indicator */}
              <div className="flex items-center justify-between pt-1 text-[11px] font-mono">
                <span className="text-slate-500">Hardware Click-Stop Status:</span>
                {isNativeHardwareStop ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Exact Detent Match ({stepAngle}° ring)</span>
                  </span>
                ) : (
                  <span className="text-amber-400 font-medium">
                    Custom Angle (Requires Indexing / Vernier base)
                  </span>
                )}
              </div>

              {/* Special Mount Guidelines */}
              {selectedPanoHead.isRingClamp && (
                <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300 text-[11px] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    <strong>Fixed Ring Mount:</strong> Lens collar clamp positions entrance pupil directly on the pivot without rail adjustment.
                  </span>
                </div>
              )}

              {selectedPanoHead.isSlant && (
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    <strong>Slant Head Design:</strong> 60° tilt orientation captures complete 360° × 180° sphere in only 3 or 4 shots.
                  </span>
                </div>
              )}

              {/* Rail mm Setting Guide */}
              {!selectedPanoHead.isRingClamp && (
                <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono pt-1">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Upper Rail (NPP)</span>
                    <span className="font-bold text-amber-400">
                      {formatDualMm(nodalAlignment.upperRailSettingMm)}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Lower Rail (Center)</span>
                    <span className="font-bold text-sky-400">
                      {formatDualMm(nodalAlignment.lowerRailSettingMm)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

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

            {/* 360° Shots Count Slider (Each Side Rotation) */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-semibold text-slate-300">
                    Shots Count Slider (Around 360° Circle):
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-mono font-black text-amber-400">
                    {currentShots} Shots
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    ({stepAngle}° / side)
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

              {/* Quick Preset Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { shots: 3, label: '3 (120°)' },
                  { shots: 4, label: '4 (90°)' },
                  { shots: 6, label: '6 (60°)' },
                  { shots: 8, label: '8 (45°)' },
                  { shots: 10, label: '10 (36°)' },
                  { shots: 12, label: '12 (30°)' },
                  { shots: 16, label: '16 (22.5°)' },
                ].map((item) => (
                  <button
                    key={item.shots}
                    type="button"
                    onClick={() => handleShotsChange(item.shots)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition border ${
                      currentShots === item.shots
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCustomShotsPerCircle(undefined)}
                  className="px-2 py-1 rounded-lg text-[10px] font-mono text-slate-500 hover:text-slate-300 border border-slate-800"
                  title="Auto-calculate from target overlap percentage"
                >
                  Auto
                </button>
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
              onChange={(val) => {
                setTargetOverlapPct(val / 100);
                setCustomShotsPerCircle(undefined); // let overlap recompute shots
              }}
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
