import React from 'react';
import { usePanorama } from '../context/PanoramaContext';
import { getCircleOfConfusionMm } from '../calculations/dof';
import {
  formatDualMm,
  formatDualDistance,
  formatDualDimensions,
  formatDualCoC,
} from '../utils/units';
import {
  Sliders,
  Shield,
  Clock,
  Eye,
  Camera,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Ruler,
  Check,
  Sparkles,
} from 'lucide-react';

export const AdvancedSettingsPage: React.FC = () => {
  const {
    selectedCamera,
    selectedLens,
    subjectDistanceM,
    upperRailOffsetMm,
    tripodOn,
    setTripodOn,
    customCoCMm,
    setCustomCoCMm,
    unitPreference,
    setUnitPreference,
    results,
  } = usePanorama();

  const standardCoC = getCircleOfConfusionMm(selectedCamera);
  const highResCoC = Math.round((selectedCamera.sensorDiagonalMm / 1730) * 10000) / 10000;
  const pixelCoC = Math.round((results.pixelPitchUm * 2 / 1000) * 10000) / 10000;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <Sliders className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-black text-white">Advanced Settings & Optical Standards</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Configure global measurement units (mm vs inches), vibration suppression protocols, electronic shutters, and circle of confusion models.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 📏 GLOBAL UNIT PREFERENCE (METRIC VS IMPERIAL: MM VS INCHES)            */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md shrink-0">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Global Measurement Unit Preference
                </h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  {unitPreference === 'metric' ? 'Metric (mm / m)' : 'Imperial (in / ft)'} Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically updates all calculations, entrance pupil rail marks, DOF near/far limits, sensor specs, and PDF field sheets.
              </p>
            </div>
          </div>

          {/* Quick Segmented Toggle */}
          <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex items-center shadow-inner self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setUnitPreference('metric')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                unitPreference === 'metric'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Millimeters (mm)</span>
            </button>
            <button
              type="button"
              onClick={() => setUnitPreference('imperial')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                unitPreference === 'imperial'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Inches (in)</span>
            </button>
          </div>
        </div>

        {/* 2 Big Explanatory Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Metric */}
          <div
            onClick={() => setUnitPreference('metric')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
              unitPreference === 'metric'
                ? 'bg-amber-500/10 border-amber-500/60 shadow-lg ring-1 ring-amber-500/40'
                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white">Metric Standard</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold border border-slate-700">
                    mm · m
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  International photographic standard. Panoramic head rail markings in millimeters, focal lengths in mm, sensor dimensions in mm, and shooting distances in meters.
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                unitPreference === 'metric' ? 'bg-amber-500 text-slate-950' : 'border border-slate-700'
              }`}>
                {unitPreference === 'metric' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 font-mono text-[11px] flex flex-col gap-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">NPP Upper Rail Setting:</span>
                <span className="font-bold text-amber-400">{formatDualMm(upperRailOffsetMm || selectedLens.entrancePupilOffsetMm || 42, 1, 'metric')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Focus & Subject Distance:</span>
                <span className="font-bold text-slate-200">{formatDualDistance(subjectDistanceM, 2, 'metric')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sensor Dimensions:</span>
                <span className="font-bold text-slate-200">{formatDualDimensions(selectedCamera.sensorWidthMm, selectedCamera.sensorHeightMm, 'metric')}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Imperial */}
          <div
            onClick={() => setUnitPreference('imperial')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
              unitPreference === 'imperial'
                ? 'bg-amber-500/10 border-amber-500/60 shadow-lg ring-1 ring-amber-500/40'
                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white">Imperial / US Customary</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold border border-slate-700">
                    in · ft
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  US customary standard. Places inches first for panoramic rail marks, lens lengths, and sensor size; feet and inches for room subject distances and depth of field.
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                unitPreference === 'imperial' ? 'bg-amber-500 text-slate-950' : 'border border-slate-700'
              }`}>
                {unitPreference === 'imperial' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 font-mono text-[11px] flex flex-col gap-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">NPP Upper Rail Setting:</span>
                <span className="font-bold text-amber-400">{formatDualMm(upperRailOffsetMm || selectedLens.entrancePupilOffsetMm || 42, 1, 'imperial')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Focus & Subject Distance:</span>
                <span className="font-bold text-slate-200">{formatDualDistance(subjectDistanceM, 2, 'imperial')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sensor Dimensions:</span>
                <span className="font-bold text-slate-200">{formatDualDimensions(selectedCamera.sensorWidthMm, selectedCamera.sensorHeightMm, 'imperial')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Calculation Preview Banner */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300">
              Active configuration for <strong className="text-white">{selectedCamera.model}</strong> + <strong className="text-white">{selectedLens.model}</strong> is rendering in <strong className="text-amber-400">{unitPreference === 'imperial' ? 'Inches & Feet' : 'Millimeters & Meters'}</strong> across all pages and printable PDF sheets.
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Persistent (Local Browser Storage)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Tripod Protocol & Stability */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Camera className="w-4 h-4 text-amber-400" />
            <span>Tripod Mode & Mechanical Vibration</span>
          </h3>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="text-sm font-bold text-white block">Tripod Mount Mode</span>
              <span className="text-xs text-slate-400 block mt-0.5">
                Enables base ISO, long exposures, and disables handheld reciprocal constraints.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setTripodOn(!tripodOn)}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition shadow ${
                tripodOn
                  ? 'bg-emerald-500 text-slate-950 font-black'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {tripodOn ? 'TRIPOD ON' : 'HANDHELD'}
            </button>
          </div>

          {/* Vibration Features Supported by Active Camera */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase">
              Vibration Precautions for {selectedCamera.model}:
            </span>

            <div className="grid grid-cols-1 gap-2 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-200 block">Mirror Lock-Up (MLU)</span>
                  <span className="text-[11px] text-slate-500 block">
                    {selectedCamera.mirrorLockUp
                      ? 'Pre-fires DSLR reflex mirror 2s before shutter opens to eliminate mirror slap.'
                      : 'Not required on mirrorless camera.'}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  selectedCamera.mirrorLockUp ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'
                }`}>
                  {selectedCamera.mirrorLockUp ? 'RECOMMENDED' : 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-200 block">Electronic Front Curtain (EFCS)</span>
                  <span className="text-[11px] text-slate-500 block">
                    Eliminates shutter shock blur on critical exposures between 1/30s and 1/2s.
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  selectedCamera.efcs ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                }`}>
                  {selectedCamera.efcs ? 'ENABLED' : 'UNAVAILABLE'}
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-200 block">Self-Timer Delay</span>
                  <span className="text-[11px] text-slate-500 block">
                    2-second countdown to prevent finger press vibration.
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400">
                  {selectedCamera.selfTimerSeconds.includes(2) ? '2 SEC TIMER' : 'USE REMOTE'}
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-200 block">Image Stabilization (IBIS / IS / VR)</span>
                  <span className="text-[11px] text-slate-500 block">
                    Must be turned OFF when mounted on a rigid tripod to prevent feedback jitter.
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400">
                  TURN OFF ON TRIPOD
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Circle of Confusion & Optical Theory */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Eye className="w-4 h-4 text-sky-400" />
            <span>Circle of Confusion Criterion (CoC)</span>
          </h3>

          <p className="text-xs text-slate-400 leading-relaxed">
            The Circle of Confusion defines the diameter of an out-of-focus point of light that human vision perceives as a sharp point. Different criteria affect hyperfocal distance calculations.
          </p>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => setCustomCoCMm(undefined)}
              className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                !customCoCMm
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 shadow'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div>
                <span className="text-xs font-bold block">Standard Zeiss Formula (d / 1500)</span>
                <span className="text-[11px] text-slate-500 block">Industry standard for standard viewing distance (8x10 print at 25cm).</span>
              </div>
              <span className="font-mono text-xs font-bold text-right shrink-0">{formatDualCoC(standardCoC)}</span>
            </button>

            <button
              type="button"
              onClick={() => setCustomCoCMm(highResCoC)}
              className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                customCoCMm === highResCoC
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 shadow'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div>
                <span className="text-xs font-bold block">Critical High-Resolution Criterion (d / 1730)</span>
                <span className="text-[11px] text-slate-500 block">Tighter tolerance for high-density 30MP+ sensors inspected at 100% zoom.</span>
              </div>
              <span className="font-mono text-xs font-bold text-right shrink-0">{formatDualCoC(highResCoC)}</span>
            </button>

            <button
              type="button"
              onClick={() => setCustomCoCMm(pixelCoC)}
              className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                customCoCMm === pixelCoC
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 shadow'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div>
                <span className="text-xs font-bold block">Pixel-Pitch CoC (2× Pixel Width)</span>
                <span className="text-[11px] text-slate-500 block">True pixel-level sharpness constraint based on {results.pixelPitchUm}μm pixels.</span>
              </div>
              <span className="font-mono text-xs font-bold text-right shrink-0">{formatDualCoC(pixelCoC)}</span>
            </button>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Using a tighter Circle of Confusion extends the calculated hyperfocal distance further out into the room. For 360° panoramas with near furniture, the standard d/1500 value provides the most practical depth of field balance.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
