import React, { useState, useEffect } from 'react';
import { usePanorama } from '../context/PanoramaContext';
import {
  estimateNodalPoint,
  MOUNT_FLANGE_DISTANCES,
  NodalEstimationOutput,
} from '../calculations/nodal';
import { formatDualMm } from '../utils/units';
import {
  Crosshair,
  Sliders,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Check,
  Maximize2,
  Sparkles,
  Info,
  ChevronRight,
  Eye,
  Camera,
  Layers,
} from 'lucide-react';

interface NodalPointCalculatorProps {
  onApplied?: () => void;
}

export const NodalPointCalculator: React.FC<NodalPointCalculatorProps> = ({ onApplied }) => {
  const {
    selectedCamera,
    selectedLens,
    selectedPanoHead,
    upperRailOffsetMm,
    setUpperRailOffsetMm,
  } = usePanorama();

  // Internal interactive tuning state (initialized from currently active camera/lens)
  const [focalLength, setFocalLength] = useState<number>(() => {
    return selectedLens.focalLengthMinMm || 8;
  });

  const [cropFactor, setCropFactor] = useState<number>(() => {
    return selectedCamera.cropFactor || 1.6;
  });

  const [projectionType, setProjectionType] = useState<string>(() => {
    return selectedLens.projectionType || 'CIRCULAR_FISHEYE';
  });

  const [lensMount, setLensMount] = useState<string>(() => {
    return selectedLens.lensMount.includes('Canon')
      ? 'Canon EF'
      : selectedLens.lensMount.includes('Sony')
      ? 'Sony E'
      : selectedLens.lensMount.includes('Nikon')
      ? 'Nikon F'
      : selectedLens.lensMount.includes('Micro')
      ? 'Micro Four Thirds'
      : 'Canon EF';
  });

  const [panoHeadChoice, setPanoHeadChoice] = useState<string>(() => {
    if (selectedPanoHead?.model.includes('303')) return 'manfrotto303';
    if (selectedPanoHead?.model.includes('NN4')) return 'nodalNinja4';
    if (selectedPanoHead?.model.includes('NN3')) return 'nodalNinja3';
    if (selectedPanoHead?.model.includes('NN6')) return 'nodalNinja6';
    if (selectedPanoHead?.model.includes('CR-30') || selectedPanoHead?.brand.includes('Sunway')) return 'sunwayfoto';
    return 'manfrotto303';
  });

  const [simulatedOffsetMm, setSimulatedOffsetMm] = useState<number>(0); // -10 to +10 mm test
  const [showApplySuccess, setShowApplySuccess] = useState(false);

  // Sync when parent camera/lens change
  useEffect(() => {
    setFocalLength(selectedLens.focalLengthMinMm || 8);
    setCropFactor(selectedCamera.cropFactor || 1.6);
    setProjectionType(selectedLens.projectionType || 'CIRCULAR_FISHEYE');
    if (selectedLens.lensMount.includes('Canon')) setLensMount('Canon EF');
    else if (selectedLens.lensMount.includes('Sony')) setLensMount('Sony E');
    else if (selectedLens.lensMount.includes('Nikon')) setLensMount('Nikon F');
    else if (selectedLens.lensMount.includes('Micro')) setLensMount('Micro Four Thirds');
  }, [selectedCamera, selectedLens]);

  // Run calculation
  const isMatchingCurrentLens =
    focalLength === selectedLens.focalLengthMinMm &&
    cropFactor === selectedCamera.cropFactor &&
    projectionType === selectedLens.projectionType;

  const measuredDbOffset = isMatchingCurrentLens ? selectedLens.entrancePupilOffsetMm : undefined;

  const result: NodalEstimationOutput = estimateNodalPoint({
    focalLengthMm: focalLength,
    cropFactor: cropFactor,
    projectionType: projectionType,
    lensMount: lensMount,
    measuredOffsetMm: measuredDbOffset,
  });

  // Determine active upper rail mark for the selected pano head
  const activeUpperRailMark =
    panoHeadChoice === 'manfrotto303'
      ? result.upperRailByPanoHead.manfrotto303Mm
      : panoHeadChoice === 'nodalNinja4'
      ? result.upperRailByPanoHead.nodalNinja4Mm
      : panoHeadChoice === 'nodalNinja3'
      ? result.upperRailByPanoHead.nodalNinja3Mm
      : panoHeadChoice === 'nodalNinja6'
      ? result.upperRailByPanoHead.nodalNinja6Mm
      : panoHeadChoice === 'sunwayfoto'
      ? result.upperRailByPanoHead.sunwayfotoCr30Mm
      : result.upperRailByPanoHead.genericMm;

  // Apply to active rig
  const handleApplyToRig = () => {
    setUpperRailOffsetMm(activeUpperRailMark);
    setShowApplySuccess(true);
    setTimeout(() => setShowApplySuccess(false), 3000);
    if (onApplied) onApplied();
  };

  // Parallax test calculation based on simulated offset slider
  const simulatedParallaxPx = Math.abs(simulatedOffsetMm) * 4.2; // ~4.2px per mm of misalignment at 0.8m

  return (
    <div className="flex flex-col bg-slate-900/95 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl gap-6 font-sans">
      {/* Tool Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <Crosshair className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Dedicated Nodal Point (NPP) & Rail Calibration Tool
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                Advanced Mode
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Estimates the No-Parallax Point (Entrance Pupil) from lens optics and sensor crop factor to eliminate seam ghosting.
            </p>
          </div>
        </div>

        {/* 1-Click Apply Button */}
        <button
          type="button"
          onClick={handleApplyToRig}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-md shrink-0 active:scale-95"
          title="Apply this calculated upper rail setting to the active optimizer setup and PDF field sheet"
        >
          {showApplySuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span>Applied ({activeUpperRailMark}mm)!</span>
            </>
          ) : (
            <>
              <Sliders className="w-4 h-4" />
              <span>Apply {activeUpperRailMark}mm to Active Rig</span>
            </>
          )}
        </button>
      </div>

      {/* 3 Key Results Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card 1: Estimated Entrance Pupil from Mount */}
        <div className="bg-gradient-to-br from-amber-500/10 via-slate-950 to-slate-950 border border-amber-500/30 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-wider">
                Lens Entrance Pupil (NPP)
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {result.isDatabaseKnown ? 'Database Calibrated' : 'Optical Model'}
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-amber-400 mt-1">
              {formatDualMm(result.estimatedEpdMountMm)}
            </div>
            <p className="text-[11px] text-slate-300 mt-1 font-medium leading-snug">
              Distance from lens rear mount flange to optical entrance pupil plane.
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-400">
            <span className="text-slate-300 font-semibold block">Physical Landmark:</span>
            <span>{result.physicalLandmark}</span>
          </div>
        </div>

        {/* Card 2: Pano Head Upper Rail Setting */}
        <div className="bg-gradient-to-br from-sky-500/10 via-slate-950 to-slate-950 border border-sky-500/30 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-sky-400 font-bold tracking-wider">
                Upper Rail Setting (NPP)
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold">
                {panoHeadChoice === 'manfrotto303' ? '303SPH' : panoHeadChoice === 'nodalNinja4' ? 'NN4' : 'Selected Head'}
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-sky-400 mt-1">
              {activeUpperRailMark} mm ({ (activeUpperRailMark / 25.4).toFixed(2) } in)
            </div>
            <p className="text-[11px] text-slate-300 mt-1 font-medium leading-snug">
              Slide upper horizontal rail front index to this etched millimeter mark.
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Rotator Pivot Alignment:</span>
            <span className="text-emerald-400 font-bold">0.0 mm Parallax Error</span>
          </div>
        </div>

        {/* Card 3: Lower Rail Centering Setting */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-slate-950 to-slate-950 border border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold tracking-wider">
                Lower Rail Setting (Center)
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                Optical Axis
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
              {result.lowerRailCenteringMm} mm ({ (result.lowerRailCenteringMm / 25.4).toFixed(2) } in)
            </div>
            <p className="text-[11px] text-slate-300 mt-1 font-medium leading-snug">
              Centers lens barrel optical axis directly over the rotator panning base pivot.
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Orientation:</span>
            <span className="text-slate-200 font-bold">Portrait (Vertical Arm)</span>
          </div>
        </div>
      </div>

      {/* Interactive Parameter Tuner */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Optical Estimation Parameters</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Current: {selectedCamera.model} + {selectedLens.model}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Focal Length Slider & Presets */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Lens Focal Length:</span>
              <span className="font-mono font-bold text-amber-400 text-sm">{focalLength.toFixed(1)} mm</span>
            </div>
            <input
              type="range"
              min="6.5"
              max="35"
              step="0.5"
              value={focalLength}
              onChange={(e) => setFocalLength(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { label: '8mm', val: 8 },
                { label: '10mm', val: 10 },
                { label: '12mm', val: 12 },
                { label: '14mm', val: 14 },
                { label: '16mm', val: 16 },
                { label: '24mm', val: 24 },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => setFocalLength(p.val)}
                  className={`px-2 py-1 text-[11px] font-mono rounded-lg border transition ${
                    Math.abs(focalLength - p.val) < 0.1
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sensor Crop Factor */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Sensor Crop Factor:</span>
              <span className="font-mono font-bold text-sky-400 text-sm">{cropFactor.toFixed(2)}x</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: '1.0x Full Frame', val: 1.0 },
                { label: '1.5x Sony / Nikon', val: 1.53 },
                { label: '1.6x Canon APS-C', val: 1.61 },
                { label: '2.0x Micro 4/3', val: 2.0 },
              ].map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => setCropFactor(c.val)}
                  className={`px-2 py-1.5 text-xs font-mono rounded-xl border text-left transition ${
                    Math.abs(cropFactor - c.val) < 0.05
                      ? 'bg-sky-500/20 text-sky-300 font-bold border-sky-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optical Projection Architecture */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-slate-300 font-medium">Lens Optical Architecture:</span>
            <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
              {[
                { id: 'CIRCULAR_FISHEYE', label: 'Circular Fisheye' },
                { id: 'FULL_FRAME_FISHEYE', label: 'Diagonal Fisheye' },
                { id: 'RECTILINEAR', label: 'Ultra-Wide Rectilinear' },
                { id: 'STANDARD', label: 'Standard Wide (Retrofocus)' },
              ].map((proj) => (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => setProjectionType(proj.id)}
                  className={`px-2.5 py-1.5 rounded-xl border text-left transition ${
                    projectionType === proj.id
                      ? 'bg-amber-500/20 text-amber-300 font-bold border-amber-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {proj.label}
                </button>
              ))}
            </div>
          </div>

          {/* Panoramic Head Model Selection */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-slate-300 font-medium">Panoramic Head Model Scale:</span>
            <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
              {[
                { id: 'manfrotto303', label: 'Manfrotto 303SPH', mark: result.upperRailByPanoHead.manfrotto303Mm },
                { id: 'nodalNinja4', label: 'Nodal Ninja 4 (NN4)', mark: result.upperRailByPanoHead.nodalNinja4Mm },
                { id: 'nodalNinja3', label: 'Nodal Ninja 3 Mk II', mark: result.upperRailByPanoHead.nodalNinja3Mm },
                { id: 'nodalNinja6', label: 'Nodal Ninja 6 (NN6)', mark: result.upperRailByPanoHead.nodalNinja6Mm },
                { id: 'sunwayfoto', label: 'Sunwayfoto CR-30', mark: result.upperRailByPanoHead.sunwayfotoCr30Mm },
                { id: 'generic', label: 'Universal Arca-Swiss', mark: result.upperRailByPanoHead.genericMm },
              ].map((head) => (
                <button
                  key={head.id}
                  type="button"
                  onClick={() => setPanoHeadChoice(head.id)}
                  className={`px-2.5 py-1.5 rounded-xl border text-left flex items-center justify-between transition ${
                    panoHeadChoice === head.id
                      ? 'bg-sky-500/20 text-sky-300 font-bold border-sky-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <span className="truncate">{head.label}</span>
                  <span className="font-bold text-amber-400 shrink-0 ml-1">{head.mark}mm</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Parallax Stitching Error Simulator */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>Live Parallax Stitching Error Simulator</span>
          </span>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Rail Offset Deviation:</span>
            <span className={`font-black ${simulatedOffsetMm === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {simulatedOffsetMm > 0 ? `+${simulatedOffsetMm}` : simulatedOffsetMm} mm
            </span>
          </div>
        </div>

        {/* Deviation slider */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-500">-10mm (Too far back)</span>
          <input
            type="range"
            min="-10"
            max="10"
            step="1"
            value={simulatedOffsetMm}
            onChange={(e) => setSimulatedOffsetMm(parseInt(e.target.value, 10))}
            className="flex-1 accent-amber-500 cursor-pointer"
          />
          <span className="text-[11px] font-mono text-slate-500">+10mm (Too far forward)</span>
          <button
            type="button"
            onClick={() => setSimulatedOffsetMm(0)}
            className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700"
          >
            Reset (0mm)
          </button>
        </div>

        {/* Visual Seam Comparison Box */}
        <div className="relative h-28 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center p-3 select-none">
          {/* Background Wall Line (Fixed reference at 5m) */}
          <div className="absolute top-2 bottom-2 left-1/2 -translate-x-1/2 w-0.5 bg-sky-500/80 border-r border-sky-400">
            <span className="absolute top-1 left-2 text-[9px] font-mono text-sky-400 font-bold bg-slate-950/80 px-1 py-0.5 rounded whitespace-nowrap">
              Distant Wall / Seam (5.0m)
            </span>
          </div>

          {/* Near Post Line (Foreground object at 0.8m) - shifts when misaligned */}
          <div
            className="absolute top-6 bottom-6 left-1/2 w-2 bg-amber-400 rounded-full shadow-lg transition-transform duration-100 flex items-center justify-center"
            style={{
              transform: `translateX(calc(-50% + ${simulatedOffsetMm * 5}px))`,
            }}
          >
            <span className="absolute bottom-1 text-[8px] font-mono text-slate-950 font-black whitespace-nowrap bg-amber-300 px-1 rounded -translate-y-6">
              Near Doorpost (0.8m)
            </span>
          </div>

          {/* Overlay Status */}
          <div className="absolute top-2 right-3 text-right">
            {simulatedOffsetMm === 0 ? (
              <span className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>0.0 px Seam Parallax (100% Clean Stitch)</span>
              </span>
            ) : (
              <span className="text-[11px] font-mono text-rose-400 font-bold flex items-center gap-1 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{simulatedParallaxPx.toFixed(1)} px Stitching Seam Tearing!</span>
              </span>
            )}
          </div>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          {simulatedOffsetMm === 0 ? (
            <span className="text-emerald-400">
              ✓ <strong>Zero Parallax Point verified:</strong> The camera rotates precisely around the entrance pupil. Nearby doorframes and distant windows maintain exact angular alignment across overlapping shots with zero double-images or stitching artifacts.
            </span>
          ) : (
            <span className="text-rose-300">
              ⚠️ <strong>Parallax displacement active:</strong> A {Math.abs(simulatedOffsetMm)}mm misalignment introduces approximately {simulatedParallaxPx.toFixed(1)} pixels of lateral tearing on nearby subjects (0.8m). In PTGui or Lightroom, this causes ghosted doorframes and misaligned window panes.
            </span>
          )}
        </p>
      </div>

      {/* Field Verification Guide: 2-Point Window Sighting Test */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Pro Field Protocol: 2-Point Parallax-Free Sighting Test
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs text-slate-300">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col gap-1">
            <span className="text-[10px] font-mono font-bold text-amber-400">STEP 1: SIGHTING</span>
            <p className="text-[11px] text-slate-400">
              Align a near vertical reference (window sash at 1m) directly over a far vertical reference (corner at 5m) in the center of Live View.
            </p>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col gap-1">
            <span className="text-[10px] font-mono font-bold text-amber-400">STEP 2: PAN ROTATION</span>
            <p className="text-[11px] text-slate-400">
              Rotate the panoramic head 45° to the left so the aligned references move to the extreme right edge of the viewfinder.
            </p>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col gap-1">
            <span className="text-[10px] font-mono font-bold text-amber-400">STEP 3: DIAGNOSIS</span>
            <p className="text-[11px] text-slate-400">
              If the near reference moves <strong>with</strong> the pan direction, the lens is too far forward. If it moves <strong>against</strong>, it is too far back.
            </p>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col gap-1">
            <span className="text-[10px] font-mono font-bold text-emerald-400">STEP 4: LOCK RAIL</span>
            <p className="text-[11px] text-slate-400">
              Slide the upper rail until the near and far lines remain locked together during full rotation. Tighten clamp screws firmly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
