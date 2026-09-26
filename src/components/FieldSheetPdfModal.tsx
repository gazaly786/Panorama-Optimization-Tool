import React, { useState, useRef } from 'react';
import {
  CameraSpec,
  LensSpec,
  OpticalCalculationResults,
} from '../types';
import {
  formatDualMm,
  formatDualDistance,
  formatDualDimensions,
  formatDetentAngles,
  mmToInches,
  metersToFeet,
  metersToInches,
} from '../utils/units';
import {
  Printer,
  Download,
  X,
  Camera,
  Layers,
  Compass,
  Crosshair,
  Sliders,
  CheckCircle,
  Sun,
  ShieldCheck,
  CheckSquare,
  FileText,
  RotateCw,
} from 'lucide-react';

interface FieldSheetPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  camera: CameraSpec;
  lens: LensSpec;
  panoHeadName: string;
  upperRailMm: number;
  lowerRailMm: number;
  subjectDistanceM: number;
  results: OpticalCalculationResults;
  shotsPerCircle: number;
  rigTitle?: string;
  notes?: string;
}

export const FieldSheetPdfModal: React.FC<FieldSheetPdfModalProps> = ({
  isOpen,
  onClose,
  camera,
  lens,
  panoHeadName,
  upperRailMm,
  lowerRailMm,
  subjectDistanceM,
  results,
  shotsPerCircle,
  rigTitle,
  notes,
}) => {
  const [printTheme, setPrintTheme] = useState<'light' | 'dark'>('light');
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const detentAngles = formatDetentAngles(shotsPerCircle);
  const rotationAngle = Math.round((360 / shotsPerCircle) * 10) / 10;
  const title = rigTitle || `${camera.brand} ${camera.model} + ${lens.brand} ${lens.model}`;
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHtml = () => {
    if (!printAreaRef.current) return;
    const content = printAreaRef.current.innerHTML;
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PanoOptix Field Sheet - ${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #ffffff; color: #0f172a; padding: 24px; line-height: 1.4; }
    .print-container { max-width: 800px; margin: 0 auto; }
    .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
    .badge { display: inline-block; background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; margin-right: 6px; }
    .highlight { color: #d97706; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
    th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; }
    th { background: #f8fafc; font-weight: bold; }
  </style>
</head>
<body>
  <div class="print-container">
    ${content}
  </div>
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PanoOptix_Field_Sheet_${camera.model.replace(/\s+/g, '_')}_${lens.model.replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Top Control Bar (Hidden in Print) */}
        <div className="no-print flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Printable Field Specification Sheet (PDF)</h2>
              <p className="text-[11px] text-slate-400">
                Visual demographic datasheet with dual metric & imperial measurements.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle for Preview */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setPrintTheme('light')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  printTheme === 'light' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                Paper White
              </button>
              <button
                type="button"
                onClick={() => setPrintTheme('dark')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  printTheme === 'dark' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                Dark View
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              title="Download HTML Spec Sheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">HTML</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/60">
          <div
            id="pano-printable-field-sheet"
            ref={printAreaRef}
            className={`max-w-3xl mx-auto rounded-xl border p-6 shadow-xl transition font-sans ${
              printTheme === 'light'
                ? 'bg-white text-slate-900 border-slate-300'
                : 'bg-slate-900 text-slate-100 border-slate-800'
            }`}
          >
            {/* Header Demographic Banner */}
            <div className={`border-b pb-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              printTheme === 'light' ? 'border-slate-300' : 'border-slate-800'
            }`}>
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xs">
                    P
                  </div>
                  <span className="text-[11px] font-mono font-black tracking-wider uppercase text-amber-600">
                    PanoOptix™ Pro Field Specification
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black mt-1 tracking-tight">
                  {title}
                </h1>
                <p className={`text-xs mt-0.5 ${printTheme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                  Standard Field Reference Sheet · Created by <strong className="text-amber-600">Gazaly Samsadeen</strong> · Generated {currentDate}
                </p>
              </div>

              {/* Quick Spec Demographic Pill */}
              <div className={`p-2.5 rounded-xl border text-right text-xs shrink-0 ${
                printTheme === 'light' ? 'bg-amber-50/80 border-amber-200 text-slate-800' : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
              }`}>
                <div className="font-mono font-black text-sm text-amber-600">
                  {shotsPerCircle} Shots · {rotationAngle}° Click
                </div>
                <div className="text-[11px] font-medium mt-0.5">
                  Overlap: <strong>{results.overlapPct}%</strong> · NPP: <strong>{formatDualMm(upperRailMm)}</strong>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Default Distance: <strong>{formatDualDistance(subjectDistanceM)}</strong>
                </div>
              </div>
            </div>

            {/* Key Demographics 2-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Section 1: Camera & Sensor Demographic */}
              <div className={`p-4 rounded-xl border flex flex-col gap-2 ${
                printTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
              }`}>
                <div className="flex items-center gap-2 border-b pb-2 border-slate-200 dark:border-slate-800">
                  <Camera className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Camera & Sensor Demographic
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Camera Model</span>
                    <span className="font-bold">{camera.brand} {camera.model}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Sensor Format</span>
                    <span className="font-bold">{camera.sensorFormat}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Physical Dimensions</span>
                    <span className="font-mono text-[11px] font-semibold">
                      {formatDualDimensions(camera.sensorWidthMm, camera.sensorHeightMm)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Crop Factor</span>
                    <span className="font-bold">{camera.cropFactor.toFixed(1)}x</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Resolution</span>
                    <span className="font-semibold">{camera.megapixels} MP ({camera.nativeResolution[0]} × {camera.nativeResolution[1]})</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Pixel Pitch</span>
                    <span className="font-mono font-semibold">{results.pixelPitchUm.toFixed(2)} µm</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Lens & Optical Demographic */}
              <div className={`p-4 rounded-xl border flex flex-col gap-2 ${
                printTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
              }`}>
                <div className="flex items-center gap-2 border-b pb-2 border-slate-200 dark:border-slate-800">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Lens & Optical Demographic
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Lens Model</span>
                    <span className="font-bold">{lens.brand} {lens.model}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Focal Length</span>
                    <span className="font-bold">{formatDualMm(results.effectiveFocalLengthMm / camera.cropFactor)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Projection Type</span>
                    <span className="font-semibold capitalize">{lens.projectionType.replace(/_/g, ' ')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Field of View (H × V)</span>
                    <span className="font-mono font-bold text-amber-600">
                      {results.horizontalFovDeg}° × {results.verticalFovDeg}°
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Lens Mount</span>
                    <span className="font-semibold">{lens.lensMount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Orientation</span>
                    <span className="font-bold text-emerald-600">Portrait (Vertical)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Panoramic Tripod Head Calibration (Dual Units) */}
            <div className={`p-4 rounded-xl border mb-4 ${
              printTheme === 'light' ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-950/10 border-amber-500/20'
            }`}>
              <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Panoramic Head & Rail Calibration ({panoHeadName})
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-amber-600">
                  Dual Standard Metrics
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Upper Rail Setting */}
                <div className={`p-3 rounded-lg border ${
                  printTheme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">Upper Rail (Entrance Pupil / NPP)</span>
                  <span className="text-lg font-black font-mono text-amber-600 block mt-0.5">
                    {formatDualMm(upperRailMm)}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Align front index to eliminate parallax
                  </span>
                </div>

                {/* Lower Rail Setting */}
                <div className={`p-3 rounded-lg border ${
                  printTheme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">Lower Rail (Optical Axis Center)</span>
                  <span className="text-lg font-black font-mono text-sky-600 block mt-0.5">
                    {formatDualMm(lowerRailMm)}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Centers lens centerline over rotator base
                  </span>
                </div>

                {/* Rotator Detent Setting */}
                <div className={`p-3 rounded-lg border ${
                  printTheme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">Rotator Detent Ring Stop</span>
                  <span className="text-lg font-black font-mono text-emerald-600 block mt-0.5">
                    {rotationAngle}° ({shotsPerCircle} shots)
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Yields {results.overlapPct}% stitching overlap
                  </span>
                </div>
              </div>

              {/* Graphic Rail Visualizer Line */}
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500">Rail Calibrator Gauge:</span>
                <span className="font-bold">Upper Rail: [{upperRailMm}mm / {mmToInches(upperRailMm).toFixed(2)}"]</span>
                <span className="text-slate-400">·</span>
                <span className="font-bold">Lower Rail: [{lowerRailMm}mm / {mmToInches(lowerRailMm).toFixed(2)}"]</span>
              </div>
            </div>

            {/* Section 4: 360° Rotator Detents & Compass Infographic */}
            <div className={`p-4 rounded-xl border mb-4 ${
              printTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
            }`}>
              <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    360° Rotation Compass & Detent Sequence ({shotsPerCircle} Shots Around)
                  </span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                  results.overlapPct >= 25 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {results.overlapPct}% Overlap · {results.overlapPct >= 25 ? 'Optimal Margin' : 'Tight Margin'}
                </span>
              </div>

              {/* Compass Shot Steps Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs">
                {detentAngles.map((angle, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg border text-center font-mono ${
                      printTheme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="text-[10px] text-slate-500 font-sans">Shot {idx + 1}</div>
                    <div className="text-sm font-black text-amber-600">{angle}°</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {idx === 0 ? 'Front (0°)' : idx === Math.floor(shotsPerCircle / 4) ? 'Right (90°)' : idx === Math.floor(shotsPerCircle / 2) ? 'Back (180°)' : `${angle}°`}
                    </div>
                  </div>
                ))}

                {/* Zenith & Nadir */}
                <div className={`p-2 rounded-lg border text-center font-mono ${
                  printTheme === 'light' ? 'bg-sky-50 border-sky-200' : 'bg-sky-950/40 border-sky-800'
                }`}>
                  <div className="text-[10px] text-slate-500 font-sans">Cap Shot</div>
                  <div className="text-sm font-black text-sky-600">+90°</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Zenith (Up)</div>
                </div>

                <div className={`p-2 rounded-lg border text-center font-mono ${
                  printTheme === 'light' ? 'bg-indigo-50 border-indigo-200' : 'bg-indigo-950/40 border-indigo-800'
                }`}>
                  <div className="text-[10px] text-slate-500 font-sans">Floor Shot</div>
                  <div className="text-sm font-black text-indigo-600">-90°</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Nadir (Down)</div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span>Total Single-Row Frames: <strong>{shotsPerCircle + 2} shots</strong></span>
                <span>Each side rotation step: <strong>{rotationAngle}°</strong></span>
                <span>Rotation detents: <strong>{detentAngles.join('° → ')}°</strong></span>
              </div>
            </div>

            {/* Section 5: Optical Sweet Spot & Depth of Field (Dual Units) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Focus & Depth of Field */}
              <div className={`p-4 rounded-xl border flex flex-col gap-2 ${
                printTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
              }`}>
                <div className="flex items-center gap-2 border-b pb-2 border-slate-200 dark:border-slate-800">
                  <Crosshair className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Focus Distance & Depth of Field (Dual Units)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Default / Room Distance</span>
                    <span className="font-bold text-amber-600">{formatDualDistance(subjectDistanceM)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Recommended Focus Mark</span>
                    <span className="font-bold">{formatDualDistance(results.recommendedFocusDistanceM)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Hyperfocal Distance (H)</span>
                    <span className="font-bold font-mono">{formatDualDistance(results.hyperfocalDistanceM)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Sharp Foreground Limit</span>
                    <span className="font-bold text-emerald-600 font-mono">
                      {formatDualDistance(results.hyperfocalNearLimitM)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Total Sharp Zone</span>
                    <span className="font-semibold">
                      {formatDualDistance(results.hyperfocalNearLimitM)} to Infinity (∞)
                    </span>
                  </div>
                </div>
              </div>

              {/* Exposure & AEB Bracketing */}
              <div className={`p-4 rounded-xl border flex flex-col gap-2 ${
                printTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
              }`}>
                <div className="flex items-center gap-2 border-b pb-2 border-slate-200 dark:border-slate-800">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Exposure & AEB Bracketing Plan
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Aperture (Sweet Spot)</span>
                    <span className="font-black text-amber-600">{results.recommendedApertureString}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Baseline Shutter Speed</span>
                    <span className="font-bold">{results.recommendedShutterSpeed}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">ISO Sensitivity</span>
                    <span className="font-bold">ISO {results.recommendedIso}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">White Balance</span>
                    <span className="font-semibold">{results.whiteBalance}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">AEB Bracket Strategy</span>
                    <span className="font-bold text-sky-600">
                      {results.aebRecommended ? `${results.aebFrames} Frames @ ±${results.aebEvStep} EV` : 'Single Exposure'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Total Dynamic Range</span>
                    <span className="font-bold">{results.totalDynamicRangeStops} EV Stops</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 6: Pre-Flight Field Checklist */}
            <div className={`p-4 rounded-xl border ${
              printTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
            }`}>
              <div className="flex items-center gap-2 border-b pb-2 border-slate-200 dark:border-slate-800 mb-2">
                <CheckSquare className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Pre-Flight Field Checklist
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-start gap-2">
                  <input type="checkbox" className="mt-0.5 rounded border-slate-400" />
                  <span>1. Level tripod base using integrated spirit bubble within 0.5°.</span>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" className="mt-0.5 rounded border-slate-400" />
                  <span>2. Set upper rail to <strong>{formatDualMm(upperRailMm)}</strong> & lower rail to <strong>{formatDualMm(lowerRailMm)}</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" className="mt-0.5 rounded border-slate-400" />
                  <span>3. Switch lens AF to <strong>Manual Focus (MF)</strong>; lock focus ring.</span>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" className="mt-0.5 rounded border-slate-400" />
                  <span>4. Lock camera to <strong>Manual Exposure (M)</strong>; fixed White Balance.</span>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" className="mt-0.5 rounded border-slate-400" />
                  <span>5. Turn camera/lens image stabilization (IS/VR/IBIS) <strong>OFF</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" className="mt-0.5 rounded border-slate-400" />
                  <span>6. Rotate through all {shotsPerCircle} detents ({rotationAngle}°) cleanly.</span>
                </div>
              </div>
            </div>

            {/* Footer Sign-off */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-1 text-[10px] text-slate-500 font-mono">
              <span>PanoOptix Optical Verification System · Field Spec ID: #{camera.id.toUpperCase()}-{shotsPerCircle}S</span>
              <span>Lead Optical Architect: <strong className="text-amber-600">Gazaly Samsadeen</strong></span>
              <span>Photographer Sign-off: __________________________</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
