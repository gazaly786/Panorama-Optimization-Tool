import React, { useState } from 'react';
import {
  OpticalCalculationResults,
  CameraSpec,
  LensSpec,
  PanoramaScenario,
} from '../types';
import {
  Check,
  Copy,
  Download,
  Info,
  Layers,
  Lock,
  Maximize2,
  Minimize2,
  ShieldAlert,
  Sparkles,
  Camera,
  Eye,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { ConfidenceBadge } from './ConfidenceBadge';

interface ResultCardProps {
  camera: CameraSpec;
  lens: LensSpec;
  scenario: PanoramaScenario;
  results: OpticalCalculationResults;
  onSavePreset?: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  camera,
  lens,
  scenario,
  results,
  onSavePreset,
}) => {
  const [copied, setCopied] = useState(false);
  const [expandedWhy, setExpandedWhy] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  const copyRecipeToClipboard = () => {
    const text = `=== PANORAMA OPTIMIZED SETUP ===
CAMERA: ${camera.brand} ${camera.model}
LENS: ${lens.brand} ${lens.model}
SCENARIO: ${scenario.name}
--------------------------------
APERTURE: ${results.recommendedApertureString}
FOCUS DISTANCE: ~${results.focusDistanceM.toFixed(1)} m
FOCUS MODE: ${results.focusMode}
ISO: ${results.recommendedIso}
SHUTTER SPEED: ${results.recommendedShutterSpeed}
WHITE BALANCE: ${results.whiteBalance}
AEB / HDR: ${results.aebRecommended ? `${results.aebFrames} frames ±${results.aebEvStep} EV` : 'OFF'}
ROTATION: ${results.shotsPerCircle} shots around (${results.rotationIncrementDeg}° detent)
ROWS: ${results.numRows} row${results.numRows > 1 ? 's' : ''}
OVERLAP: ~${results.overlapPct}%
ESTIMATED RESOLUTION: ${results.estimatedPanoWidthPx} x ${results.estimatedPanoHeightPx} px (~${results.estimatedMegapixels} MP)
TRIPOD: ${results.tripodMode ? 'REQUIRED (Manual Lock)' : 'Handheld'}
--------------------------------
SHARPNESS: ${results.expectedSharpness}
DIFFRACTION RISK: ${results.diffractionStatus}
DEPTH OF FIELD: ${results.nearLimitM}m to ${results.farLimitM >= 900 ? '∞' : `${results.farLimitM}m`}
STITCHING MARGIN: GOOD`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex flex-col bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-emerald-400">
              PANORAMA OPTIMIZED SETUP
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white mt-1">
            {camera.brand} {camera.model}
          </h2>
          <div className="flex items-center gap-2 text-sm text-slate-300 font-medium mt-0.5">
            <span className="text-amber-400 font-bold">{lens.brand} {lens.model}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">{scenario.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyRecipeToClipboard}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Recipe!' : 'Copy Recipe'}</span>
          </button>
          {onSavePreset && (
            <button
              type="button"
              onClick={onSavePreset}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Save Rig Setup</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Optical Parameters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
        {/* Aperture */}
        <div className="flex flex-col p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 shadow-inner">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Aperture</span>
            <span className="text-[10px] text-amber-400 font-bold">Sweet Spot</span>
          </div>
          <div className="text-2xl md:text-3xl font-mono font-black text-amber-400 mt-1">
            {results.recommendedApertureString}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Diffraction: <span className={results.diffractionStatus === 'LOW' || results.diffractionStatus === 'MODERATE' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>{results.diffractionStatus}</span>
          </div>
        </div>

        {/* Focus Distance */}
        <div className="flex flex-col p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 shadow-inner">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Focus Distance</span>
            <span className="text-[10px] text-emerald-400 font-bold">Safe Lock</span>
          </div>
          <div className="text-2xl md:text-3xl font-mono font-black text-emerald-400 mt-1">
            ~{results.focusDistanceM.toFixed(1)} m
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono truncate">
            DOF: {results.nearLimitM}m → {results.farLimitM >= 900 ? '∞' : `${results.farLimitM}m`}
          </div>
        </div>

        {/* ISO */}
        <div className="flex flex-col p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 shadow-inner">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>ISO Sensitivity</span>
            <span className="text-[10px] text-sky-400 font-bold">Max Dynamic</span>
          </div>
          <div className="text-2xl md:text-3xl font-mono font-black text-sky-400 mt-1">
            ISO {results.recommendedIso}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Native Base Sensor
          </div>
        </div>

        {/* Shutter */}
        <div className="flex flex-col p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 shadow-inner">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Shutter Speed</span>
            <span className="text-[10px] text-purple-400 font-bold">Manual</span>
          </div>
          <div className="text-2xl md:text-3xl font-mono font-black text-purple-400 mt-1">
            {results.recommendedShutterSpeed}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            {results.tripodMode ? 'Tripod (Locked)' : 'Handheld'}
          </div>
        </div>
      </div>

      {/* Secondary Panorama Protocol Specs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 mb-5">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">White Balance</span>
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-100">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate">{results.whiteBalance}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Focus Protocol</span>
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-100">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>MANUAL FOCUS (LOCKED)</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">HDR / AEB Bracket</span>
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-100">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>{results.aebRecommended ? `${results.aebFrames} frames ±${results.aebEvStep} EV` : 'OFF (Single RAW)'}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Rotation & Overlap</span>
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
            <Eye className="w-3.5 h-3.5" />
            <span>{results.shotsPerCircle} shots ({results.rotationIncrementDeg}°) · ~{results.overlapPct}%</span>
          </div>
        </div>
      </div>

      {/* Optical Health Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Sharpness:</span>
          <span className="font-bold text-emerald-400">{results.expectedSharpness}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Diffraction:</span>
          <span className={results.diffractionStatus === 'LOW' || results.diffractionStatus === 'MODERATE' ? 'font-bold text-emerald-400' : 'font-bold text-amber-400'}>
            {results.diffractionStatus}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">DOF Range:</span>
          <span className="font-bold text-sky-400">SUFFICIENT</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Stitch Margin:</span>
          <span className="font-bold text-emerald-400">GOOD (~{results.overlapPct}%)</span>
        </div>
      </div>

      {/* Warnings Banner if any */}
      {results.warnings.length > 0 && (
        <div className="mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col gap-1.5">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Optical & Practical Precautions</span>
          </div>
          {results.warnings.map((w, idx) => (
            <p key={idx} className="text-[11px] text-amber-200/90 pl-6 leading-relaxed">
              • {w}
            </p>
          ))}
        </div>
      )}

      {/* Expandable "Why These Settings" Section */}
      <div className="border-t border-slate-800/80 pt-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setExpandedWhy(!expandedWhy)}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition"
          >
            <Info className="w-4 h-4 text-amber-400" />
            <span>Why These Specific Settings Were Chosen</span>
            {expandedWhy ? <Minimize2 className="w-3.5 h-3.5 text-slate-500" /> : <Maximize2 className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          <button
            type="button"
            onClick={() => setShowChecklist(!showChecklist)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{showChecklist ? 'Hide Checklist' : 'Shooting Checklist'}</span>
          </button>
        </div>

        {expandedWhy && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs leading-relaxed">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="font-mono font-bold text-amber-400 block mb-1">Aperture: {results.explanations.aperture.value}</span>
              <p className="text-slate-300 mb-1">{results.explanations.aperture.why}</p>
              <p className="text-[11px] text-slate-500"><strong className="text-slate-400">Trade-off:</strong> {results.explanations.aperture.tradeOff}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="font-mono font-bold text-emerald-400 block mb-1">Focus Distance: {results.explanations.focus.value}</span>
              <p className="text-slate-300 mb-1">{results.explanations.focus.why}</p>
              <p className="text-[11px] text-slate-500"><strong className="text-slate-400">Trade-off:</strong> {results.explanations.focus.tradeOff}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="font-mono font-bold text-sky-400 block mb-1">Shots & Overlap: {results.explanations.shotsAndRotation.value}</span>
              <p className="text-slate-300 mb-1">{results.explanations.shotsAndRotation.why}</p>
              <p className="text-[11px] text-slate-500"><strong className="text-slate-400">Trade-off:</strong> {results.explanations.shotsAndRotation.tradeOff}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="font-mono font-bold text-purple-400 block mb-1">AEB Bracket: {results.explanations.aeb.value}</span>
              <p className="text-slate-300 mb-1">{results.explanations.aeb.why}</p>
              <p className="text-[11px] text-slate-500"><strong className="text-slate-400">Trade-off:</strong> {results.explanations.aeb.tradeOff}</p>
            </div>
          </div>
        )}

        {/* Shooting Checklist */}
        {showChecklist && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
            <h4 className="font-mono font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Step-by-Step Location Shooting Checklist ({results.checklist.length} Steps)</span>
            </h4>
            <ol className="flex flex-col gap-2">
              {results.checklist.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-slate-300">
                  <span className="font-mono text-amber-400 font-bold shrink-0">{idx + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};
