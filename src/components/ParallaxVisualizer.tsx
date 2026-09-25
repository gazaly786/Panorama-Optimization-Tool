import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Crosshair, HelpCircle } from 'lucide-react';

export const ParallaxVisualizer: React.FC<{ entrancePupilOffsetMm?: number }> = ({
  entrancePupilOffsetMm = 45,
}) => {
  const [rotationAngle, setRotationAngle] = useState<number>(15);
  const [mode, setMode] = useState<'CORRECT_NPP' | 'INCORRECT_TRIPOD_AXIS'>('CORRECT_NPP');

  // Math for visual projection:
  // Rotation angle in radians
  const rad = (rotationAngle * Math.PI) / 180;

  // Foreground object at 1.5m, background at 8m
  // In Correct NPP: Camera rotates around Entrance Pupil (0,0).
  // Line of sight angle changes, but relative alignment stays constant.
  // In Incorrect Tripod Axis: Rotation center is shifted backward by 70mm (~0.07m).
  // The entrance pupil swings along an arc of radius R = 70mm.
  // The lateral shift dx = R * sin(theta), dy = R * (1 - cos(theta)).
  // This causes an angular displacement between near and far objects!
  const parallaxShiftPx = mode === 'INCORRECT_TRIPOD_AXIS'
    ? Math.round(Math.sin(rad) * 45)
    : 0;

  return (
    <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Crosshair className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
            Interactive Parallax & Entrance Pupil Simulator
          </h3>
        </div>
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setMode('CORRECT_NPP')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              mode === 'CORRECT_NPP'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Correct (NPP)
          </button>
          <button
            type="button"
            onClick={() => setMode('INCORRECT_TRIPOD_AXIS')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              mode === 'INCORRECT_TRIPOD_AXIS'
                ? 'bg-rose-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Incorrect (Tripod Screw)
          </button>
        </div>
      </div>

      {/* Simulated Viewfinder Display */}
      <div className="relative w-full h-48 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col justify-end p-4 select-none">
        {/* Sky / Background Horizon */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950 opacity-60 pointer-events-none" />

        {/* Distant Background Mountain / Window Frame (Fixed Reference) */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="w-32 h-20 border-2 border-dashed border-sky-500/40 rounded-t-lg bg-sky-500/5 flex items-center justify-center">
            <span className="text-[10px] font-mono text-sky-400 font-bold uppercase">
              Distant Wall / Window (5m)
            </span>
          </div>
          <div className="w-0.5 h-16 bg-sky-500/60" />
        </div>

        {/* Near Foreground Object (e.g. Chair / Doorpost at 1m) */}
        <div
          className="absolute bottom-4 left-1/2 flex flex-col items-center transition-transform duration-75"
          style={{
            transform: `translateX(calc(-50% + ${parallaxShiftPx}px))`,
          }}
        >
          <div className="w-14 h-24 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-md shadow-lg border border-amber-300 flex flex-col items-center justify-center p-1 text-center">
            <span className="text-[9px] font-mono text-slate-950 font-black leading-tight uppercase">
              Near Post (1.2m)
            </span>
          </div>
          <div className="w-1 h-6 bg-amber-500" />
        </div>

        {/* Viewfinder Crosshair */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-8 h-8 border border-white/20 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-red-500/60 rounded-full" />
          </div>
          <div className="absolute w-full h-[1px] bg-white/10" />
          <div className="absolute h-full w-[1px] bg-white/10" />
        </div>

        {/* Telemetry Overlay */}
        <div className="absolute top-2 left-3 flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Pano Head Rotation:</span>
          <span className="font-bold text-amber-400">{rotationAngle}°</span>
        </div>

        {/* Status Callout Badge */}
        <div className="absolute bottom-2 right-3">
          {mode === 'CORRECT_NPP' ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Zero Parallax (Perfect Seams)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Parallax Shift: {Math.abs(parallaxShiftPx)}px (Ghosting Risk)</span>
            </div>
          )}
        </div>
      </div>

      {/* Rotation Scrubber */}
      <div className="mt-4 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="font-medium">Rotate Camera Angle:</span>
          <span className="font-mono text-amber-400 font-bold">{rotationAngle > 0 ? `+${rotationAngle}°` : `${rotationAngle}°`}</span>
        </div>
        <input
          type="range"
          min={-45}
          max={45}
          value={rotationAngle}
          onChange={(e) => setRotationAngle(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>-45° (Left)</span>
          <span>0° (Dead Center)</span>
          <span>+45° (Right)</span>
        </div>
      </div>

      {/* Explanation Text */}
      <div className="mt-3.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2.5">
        <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          {mode === 'CORRECT_NPP' ? (
            <p>
              When rotating about the <strong className="text-slate-200">Entrance Pupil (No-Parallax Point)</strong>, the near post and distant window frame remain aligned at every angle. In stitching software (PTGui / Hugin), control points match effortlessly without double edges or torn furniture legs.
            </p>
          ) : (
            <p className="text-rose-300/90">
              When rotating about the camera tripod socket, the lens swings forward and backward through an arc. Notice how the near post shifts left and right across the distant wall as you rotate! This perspective shift makes seamless stitching impossible on close interior objects.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
