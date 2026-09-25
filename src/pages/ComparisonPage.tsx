import React from 'react';
import { usePanorama } from '../context/PanoramaContext';
import { calculateFov } from '../calculations/fov';
import { calculatePanoramaGeometry } from '../calculations/panorama';
import { calculateDof, getCircleOfConfusionMm } from '../calculations/dof';
import {
  ArrowLeftRight,
  Camera,
  Layers,
  CheckCircle,
  HelpCircle,
  X,
} from 'lucide-react';

export const ComparisonPage: React.FC<{ onNavigateToOptimizer: () => void }> = ({
  onNavigateToOptimizer,
}) => {
  const {
    cameras,
    lenses,
    comparisonCameraIds,
    comparisonLensIds,
    toggleCameraComparison,
    toggleLensComparison,
    setSelectedCamera,
    setSelectedLens,
  } = usePanorama();

  const comparedCameras = cameras.filter((c) => comparisonCameraIds.includes(c.id));
  const comparedLenses = lenses.filter((l) => comparisonLensIds.includes(l.id));

  // Default comparison lens for camera comparison table
  const baselineLens = lenses.find((l) => l.id === 'sigma-8mm-f35-fisheye') || lenses[0];
  // Default camera for lens comparison table
  const baselineCam = cameras.find((c) => c.id === 'canon-90d') || cameras[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-black text-white">Side-by-Side Equipment Comparison</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Objective photographic trade-offs between cameras and lenses. Compare field of view, shot counts, sensor pixel pitch, and workflow complexity.
        </p>
      </div>

      {/* 1. LENS COMPARISON SECTION */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              Lens Panorama Comparison (Mounted on {baselineCam.model})
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {comparedLenses.length} lenses selected
          </span>
        </div>

        {comparedLenses.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-xs text-slate-400">
            No lenses selected for comparison. Go to the Lens Database to add lenses using the scale icon.
          </div>
        ) : (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-x-auto shadow-sm">
            <table className="w-full text-xs font-mono text-left">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-3 px-4 w-44">Parameter</th>
                  {comparedLenses.map((lens) => (
                    <th key={lens.id} className="py-3 px-4 min-w-[200px]">
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <span className="text-[10px] text-amber-400 block">{lens.brand}</span>
                          <span className="text-sm font-bold text-white block">{lens.model}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleLensComparison(lens.id)}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {/* Projection */}
                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-400">Projection Type</td>
                  {comparedLenses.map((lens) => (
                    <td key={lens.id} className="py-3 px-4 font-bold text-amber-300">
                      {lens.projectionType.replace('_', ' ').toUpperCase()}
                    </td>
                  ))}
                </tr>

                {/* HFOV */}
                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-400">Effective HFOV (Portrait)</td>
                  {comparedLenses.map((lens) => {
                    const fov = calculateFov(baselineCam, lens, lens.focalLengthMinMm);
                    return (
                      <td key={lens.id} className="py-3 px-4 font-bold text-sky-400">
                        {fov.horizontalDeg}°
                      </td>
                    );
                  })}
                </tr>

                {/* Shots per 360 */}
                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-400">Shots per 360° Circle</td>
                  {comparedLenses.map((lens) => {
                    const geo = calculatePanoramaGeometry(baselineCam, lens, lens.focalLengthMinMm, 0.30, '360x180', true);
                    return (
                      <td key={lens.id} className="py-3 px-4 font-bold text-emerald-400">
                        {geo.shotsPerCircle} shots ({geo.rotatorClickStopDeg}° detent)
                      </td>
                    );
                  })}
                </tr>

                {/* Number of Rows */}
                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-400">Vertical Rows (360x180)</td>
                  {comparedLenses.map((lens) => {
                    const geo = calculatePanoramaGeometry(baselineCam, lens, lens.focalLengthMinMm, 0.30, '360x180', true);
                    return (
                      <td key={lens.id} className="py-3 px-4 text-slate-200">
                        {geo.numRows} row{geo.numRows > 1 ? 's' : ''} ({geo.totalShots} total frames)
                      </td>
                    );
                  })}
                </tr>

                {/* Estimated Pano Resolution */}
                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-400">Estimated Pano Output</td>
                  {comparedLenses.map((lens) => {
                    const geo = calculatePanoramaGeometry(baselineCam, lens, lens.focalLengthMinMm, 0.30, '360x180', true);
                    return (
                      <td key={lens.id} className="py-3 px-4 text-slate-300">
                        ~{geo.estimatedMegapixels} MP ({geo.estimatedPanoWidthPx}×{geo.estimatedPanoHeightPx}px)
                      </td>
                    );
                  })}
                </tr>

                {/* Sweet Spot */}
                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-400">Sweet-Spot Aperture</td>
                  {comparedLenses.map((lens) => (
                    <td key={lens.id} className="py-3 px-4 font-bold text-amber-400">
                      {lens.sweetSpotAperture || 'f/5.6 - f/8'}
                    </td>
                  ))}
                </tr>

                {/* Workflow Complexity */}
                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-400">Workflow Complexity</td>
                  {comparedLenses.map((lens) => {
                    const isFish = lens.projectionType.startsWith('fisheye');
                    return (
                      <td key={lens.id} className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isFish ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {isFish ? 'VERY FAST (Single Row)' : 'MULTI-ROW (Moderate)'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. CAMERA COMPARISON SECTION */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              Camera Body Sensor & Feature Comparison
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {comparedCameras.length} cameras selected
          </span>
        </div>

        {comparedCameras.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-xs text-slate-400">
            No cameras selected for comparison. Go to the Camera Database to add camera bodies.
          </div>
        ) : (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-x-auto shadow-sm">
            <table className="w-full text-xs font-mono text-left">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-3 px-4 w-44">Specification</th>
                  {comparedCameras.map((camera) => (
                    <th key={camera.id} className="py-3 px-4 min-w-[200px]">
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <span className="text-[10px] text-amber-400 block">{camera.brand}</span>
                          <span className="text-sm font-bold text-white block">{camera.model}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleCameraComparison(camera.id)}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-400">Sensor Format</td>
                  {comparedCameras.map((cam) => (
                    <td key={cam.id} className="py-3 px-4 font-bold text-white">
                      {cam.sensorFormat} ({cam.cropFactor}x Crop)
                    </td>
                  ))}
                </tr>

                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-400">Resolution</td>
                  {comparedCameras.map((cam) => (
                    <td key={cam.id} className="py-3 px-4 font-bold text-emerald-400">
                      {cam.megapixels} MP ({cam.nativeResolution.join('×')})
                    </td>
                  ))}
                </tr>

                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-400">Pixel Pitch</td>
                  {comparedCameras.map((cam) => (
                    <td key={cam.id} className="py-3 px-4 font-bold text-sky-400">
                      {cam.pixelPitchUm} μm
                    </td>
                  ))}
                </tr>

                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-400">Dynamic Range</td>
                  {comparedCameras.map((cam) => (
                    <td key={cam.id} className="py-3 px-4 text-slate-200">
                      {cam.dynamicRangeEv ? `${cam.dynamicRangeEv} EV` : 'UNKNOWN'}
                    </td>
                  ))}
                </tr>

                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-400">AEB Capability</td>
                  {comparedCameras.map((cam) => (
                    <td key={cam.id} className="py-3 px-4 text-amber-300 font-bold">
                      {cam.aebCapability ? `${cam.maxAebFrameCount} frames ±${cam.maxAebRangeEv} EV` : 'No'}
                    </td>
                  ))}
                </tr>

                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-400">Mirror Lock-Up</td>
                  {comparedCameras.map((cam) => (
                    <td key={cam.id} className="py-3 px-4 text-slate-300">
                      {cam.mirrorLockUp ? 'Yes' : 'Mirrorless'}
                    </td>
                  ))}
                </tr>

                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-400">Body Weight</td>
                  {comparedCameras.map((cam) => (
                    <td key={cam.id} className="py-3 px-4 text-slate-300">
                      {cam.weightG ? `${cam.weightG} g` : 'UNKNOWN'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
