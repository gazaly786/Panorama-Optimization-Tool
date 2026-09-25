import React from 'react';
import { usePanorama } from '../context/PanoramaContext';
import {
  Sun,
  Moon,
  Sparkles,
  Layers,
  Gauge,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Info,
  Camera,
} from 'lucide-react';

interface EnvironmentPreset {
  name: string;
  ev: number;
  icon: string;
  desc: string;
}

const ENVIRONMENT_PRESETS: EnvironmentPreset[] = [
  { name: 'Milky Way / Astro', ev: -2, icon: '🌌', desc: 'Deep Night & Astrophotography' },
  { name: 'Blue Hour / Night City', ev: 3, icon: '🌃', desc: 'Streetlights & Twilight' },
  { name: 'Dim Interior / Lounge', ev: 6, icon: '🕯️', desc: 'Mood Lighting & Restaurants' },
  { name: 'Real Estate / Office', ev: 9, icon: '🏢', desc: 'Standard Daylit Interior' },
  { name: 'Overcast / Golden Hour', ev: 12, icon: '⛅', desc: 'Soft Exterior Lighting' },
  { name: 'Full Daylight Sun', ev: 15, icon: '☀️', desc: 'Clear Direct Sunlight' },
  { name: 'Snow / Beach Highlights', ev: 16, icon: '❄️', desc: 'High Albedo Reflective Sand/Snow' },
];

export const ExposureBracketingPanel: React.FC = () => {
  const {
    results,
    selectedCamera,
    selectedScenario,
    customSceneEv,
    setCustomSceneEv,
    customAebEnabled,
    setCustomAebEnabled,
    customAebFrames,
    setCustomAebFrames,
    customAebEvStep,
    setCustomAebEvStep,
    tripodOn,
  } = usePanorama();

  const currentEv = customSceneEv !== undefined ? customSceneEv : results.evScene;
  const aebActive = customAebEnabled !== undefined ? customAebEnabled : results.aebRecommended;
  const currentFrames = customAebFrames !== undefined ? customAebFrames : results.aebFrames;
  const currentStep = customAebEvStep !== undefined ? customAebEvStep : results.aebEvStep;

  // Approximate lux calculation: Lux = 2.5 * 2^EV
  const approxLux = Math.round(2.5 * Math.pow(2, currentEv));

  // Camera AEB hardware limit checks
  const maxHardwareFrames = selectedCamera.maxAebFrameCount || 3;
  const maxHardwareStep = selectedCamera.maxAebRangeEv || 2;
  const exceedsHardwareFrames = aebActive && currentFrames > maxHardwareFrames;
  const exceedsHardwareStep = aebActive && currentStep > maxHardwareStep;

  // Estimated rotation shoot time: sum of all bracketed frame seconds + 2s rotator movement per position
  const totalBracketTimePerTile = results.bracketedFrames.reduce((acc, f) => acc + f.shutterSeconds, 0);
  const estimatedCaptureSeconds = Math.round(results.shotsPerCircle * (totalBracketTimePerTile + 2.5));

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Scene EV & Exposure Bracketing (AEB) Engine
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                EV100: {currentEv >= 0 ? `+${currentEv}` : currentEv}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
              Calibrate ambient light levels, preview bracketed RAW shutter speeds, and calculate HDR dynamic range.
            </span>
          </div>
        </div>

        {/* AEB Active Toggle Pill */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCustomAebEnabled(!aebActive)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold border flex items-center gap-2 transition ${
              aebActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-2 ring-emerald-500/20 shadow'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Layers className={`w-3.5 h-3.5 ${aebActive ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>AEB BRACKETING: {aebActive ? 'ENABLED' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Section 1: Scene EV Calibration & Environment Presets */}
      <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-amber-400" />
            <span>1. Ambient Light Setting (Scene EV100)</span>
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-400">
              ≈ <strong className="text-slate-200">{approxLux.toLocaleString()}</strong> lux ({Math.round(approxLux * 0.0929).toLocaleString()} fc)
            </span>
            {customSceneEv !== undefined && (
              <button
                type="button"
                onClick={() => setCustomSceneEv(undefined)}
                className="text-[10px] text-amber-400 hover:underline font-mono"
              >
                Reset to Scenario ({selectedScenario.lightLevelEv} EV)
              </button>
            )}
          </div>
        </div>

        {/* EV Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Night / Astro (-4 EV)</span>
            </span>
            <span className="text-amber-400 font-bold text-sm">
              EV {currentEv >= 0 ? `+${currentEv}` : currentEv}
            </span>
            <span className="text-slate-400 flex items-center gap-1">
              <span>Bright Sand (+17 EV)</span>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            </span>
          </div>
          <input
            type="range"
            min="-4"
            max="17"
            step="0.5"
            value={currentEv}
            onChange={(e) => setCustomSceneEv(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Quick Ambient Presets Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 pt-1">
          {ENVIRONMENT_PRESETS.map((p) => {
            const isSelected = Math.abs(currentEv - p.ev) < 0.25;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => setCustomSceneEv(p.ev)}
                className={`p-2 rounded-xl border text-left flex flex-col justify-between transition ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800/80 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span>{p.icon}</span>
                  <span className="font-mono font-bold text-[10px] text-amber-400">
                    EV {p.ev >= 0 ? `+${p.ev}` : p.ev}
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-[10px] font-bold block leading-tight text-white">{p.name}</span>
                  <span className="text-[8.5px] text-slate-500 block truncate">{p.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 2: AEB Frame Count & EV Step Configuration */}
      <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>2. Auto Exposure Bracketing Parameters</span>
          </span>
          <div className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            Total Span: ±{((currentFrames - 1) * currentStep) / 2} EV ({(currentFrames - 1) * currentStep} stops)
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Frame Count Selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Bracketed Frames per Tile:</span>
              <strong className="text-emerald-400">{aebActive ? `${currentFrames} Frames` : '1 Frame (Single)'}</strong>
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { frames: 1, label: '1 Frame', sub: 'Standard' },
                { frames: 3, label: '3 Frames', sub: 'Classic' },
                { frames: 5, label: '5 Frames', sub: 'Real Estate' },
                { frames: 7, label: '7 Frames', sub: 'Ultra HDR' },
              ].map((item) => (
                <button
                  key={item.frames}
                  type="button"
                  onClick={() => {
                    setCustomAebFrames(item.frames);
                    setCustomAebEnabled(item.frames > 1);
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-mono font-bold flex flex-col items-center justify-center transition border ${
                    (aebActive && currentFrames === item.frames) || (!aebActive && item.frames === 1)
                      ? 'bg-emerald-500 text-slate-950 font-black border-emerald-400 shadow'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-[9px] opacity-75">{item.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* EV Step Selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>EV Spacing (Step between frames):</span>
              <strong className="text-emerald-400">±{currentStep.toFixed(1)} EV</strong>
            </span>
            <div className="grid grid-cols-5 gap-1.5">
              {[0.7, 1.0, 1.5, 2.0, 3.0].map((step) => (
                <button
                  key={step}
                  type="button"
                  disabled={!aebActive || currentFrames === 1}
                  onClick={() => setCustomAebEvStep(step)}
                  className={`py-2 px-1 rounded-xl text-xs font-mono font-bold flex flex-col items-center justify-center transition border ${
                    currentStep === step && aebActive && currentFrames > 1
                      ? 'bg-emerald-500 text-slate-950 font-black border-emerald-400 shadow'
                      : !aebActive || currentFrames === 1
                      ? 'bg-slate-900/40 text-slate-600 border-slate-900 cursor-not-allowed'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>±{step}</span>
                  <span className="text-[8.5px] opacity-75">EV</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Camera Hardware Compatibility Warning if applicable */}
        {(exceedsHardwareFrames || exceedsHardwareStep) && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed text-[11px]">
              <strong>Hardware Limit Exceeded:</strong> Your selected {selectedCamera.brand} {selectedCamera.model} supports up to {maxHardwareFrames} frames at ±{maxHardwareStep} EV natively in camera menus. For {currentFrames} frames, you will need to shift shutter speeds manually in M mode or trigger via an external intervalometer / smartphone remote app.
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Frame-by-Frame Shutter Speeds & Purpose Cards */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>3. Bracketed RAW Exposures at f/{results.recommendedAperture} (ISO {results.recommendedIso})</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Base Shutter: <strong className="text-amber-400">{results.recommendedShutterSpeed}</strong>
          </span>
        </div>

        <div className={`grid gap-2 ${
          results.bracketedFrames.length === 1
            ? 'grid-cols-1'
            : results.bracketedFrames.length <= 3
            ? 'grid-cols-1 sm:grid-cols-3'
            : results.bracketedFrames.length <= 5
            ? 'grid-cols-1 sm:grid-cols-5'
            : 'grid-cols-2 sm:grid-cols-7'
        }`}>
          {results.bracketedFrames.map((frame) => {
            const isBase = frame.evOffset === 0;
            const isUnder = frame.evOffset < 0;
            const isOver = frame.evOffset > 0;

            return (
              <div
                key={frame.index}
                className={`p-3 rounded-2xl border flex flex-col justify-between transition ${
                  isBase
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 ring-1 ring-amber-500/30'
                    : isUnder
                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-200'
                    : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono font-bold pb-1 border-b border-white/10">
                  <span>Frame #{frame.index}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                    isBase
                      ? 'bg-amber-500/20 text-amber-300'
                      : isUnder
                      ? 'bg-sky-500/20 text-sky-300'
                      : 'bg-indigo-500/20 text-indigo-300'
                  }`}>
                    {frame.evOffset > 0 ? `+${frame.evOffset} EV` : frame.evOffset === 0 ? '0 EV (Base)' : `${frame.evOffset} EV`}
                  </span>
                </div>

                <div className="my-2 text-center">
                  <span className="text-lg font-black font-mono tracking-tight text-white block">
                    {frame.shutterFraction}
                  </span>
                  <span className="text-[9.5px] font-mono text-slate-400 block">
                    {frame.shutterSeconds >= 1 ? `${frame.shutterSeconds.toFixed(1)}s` : `${frame.shutterSeconds.toFixed(3)}s`}
                  </span>
                </div>

                <div className="pt-1 border-t border-white/10">
                  <span className="text-[9.5px] leading-tight block text-slate-300/90 font-sans">
                    {frame.purpose}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: HDR Dynamic Range & 360° Panorama File Multipliers */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] uppercase text-slate-400">Total HDR Latitude</span>
          <div className="mt-1">
            <span className="text-xl font-black text-emerald-400 font-mono">
              ~{results.totalDynamicRangeStops} <span className="text-xs font-normal text-slate-400">stops</span>
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {results.bracketSpanEv > 0 ? `Sensor (~14.5) + ${results.bracketSpanEv} EV bracket span` : 'Single sensor RAW latitude'}
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] uppercase text-slate-400">Total RAW Files</span>
          <div className="mt-1">
            <span className="text-xl font-black text-sky-400 font-mono">
              {results.totalRawShotsWithBracketing} <span className="text-xs font-normal text-slate-400">shots</span>
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {results.shotsPerCircle} positions × {results.aebFrames} bracketed frames
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] uppercase text-slate-400">Est. Shooting Time</span>
          <div className="mt-1">
            <span className="text-xl font-black text-amber-400 font-mono">
              ~{estimatedCaptureSeconds} <span className="text-xs font-normal text-slate-400">seconds</span>
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Includes exposure and rotator detent indexing
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] uppercase text-slate-400">Camera Menu Setup</span>
          <div className="mt-1">
            <span className="text-xs font-bold text-white block">
              {aebActive ? `AEB ${results.aebFrames}F @ ±${results.aebEvStep}EV` : 'Single Frame RAW'}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Lock M mode, Daylight WB, and Manual Focus
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
