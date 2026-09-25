import React from 'react';
import { Layers, ArrowUpCircle, ArrowDownCircle, Circle } from 'lucide-react';

interface VerticalRowVisualizerProps {
  numRows: number;
  rowPitchesDeg: number[];
  shotsPerRow: number[];
  zenithShotRecommended: boolean;
  nadirShotRecommended: boolean;
  effectiveVfovDeg: number;
  totalShots: number;
}

export const VerticalRowVisualizer: React.FC<VerticalRowVisualizerProps> = ({
  numRows,
  rowPitchesDeg,
  shotsPerRow,
  zenithShotRecommended,
  nadirShotRecommended,
  effectiveVfovDeg,
  totalShots,
}) => {
  return (
    <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
            Vertical Coverage & Pitch Tiers
          </h3>
        </div>
        <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          {numRows} {numRows === 1 ? 'Horizontal Row' : 'Multi-Row Tiers'} · {totalShots} Total Frames
        </span>
      </div>

      {/* Vertical Arc Diagram */}
      <div className="flex flex-col gap-2.5">
        {/* Zenith Cap */}
        <div
          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
            zenithShotRecommended
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              : 'bg-slate-950/40 border-slate-800/60 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ArrowUpCircle className={`w-5 h-5 ${zenithShotRecommended ? 'text-amber-400' : 'text-slate-500'}`} />
            <div>
              <div className="text-xs font-bold">Zenith (+90° Straight Up)</div>
              <div className="text-[11px] text-slate-400">Ceiling & Sky Cap</div>
            </div>
          </div>
          <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-slate-900 border border-slate-700">
            {zenithShotRecommended ? '1 shot (+90°)' : 'Covered in row'}
          </span>
        </div>

        {/* Rows */}
        {rowPitchesDeg.map((pitch, idx) => {
          const shots = shotsPerRow[idx] || 0;
          const isHorizon = pitch === 0;

          return (
            <div
              key={idx}
              className={`flex items-center justify-between p-3 rounded-xl border ${
                isHorizon
                  ? 'bg-blue-500/10 border-blue-500/40 text-blue-200'
                  : 'bg-slate-800/50 border-slate-700/60 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Circle className={`w-4 h-4 ${isHorizon ? 'text-blue-400 fill-blue-400/20' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-bold">
                    {isHorizon ? 'Horizon Level (0° Pitch)' : `Row ${idx + 1} (${pitch > 0 ? `+${pitch}°` : `${pitch}°`} Pitch)`}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Vertical span: ~{effectiveVfovDeg}° VFOV
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-amber-400">
                  {shots} shots @ {Math.round(360 / shots)}°
                </span>
              </div>
            </div>
          );
        })}

        {/* Nadir Floor */}
        <div
          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
            nadirShotRecommended
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : 'bg-slate-950/40 border-slate-800/60 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ArrowDownCircle className={`w-5 h-5 ${nadirShotRecommended ? 'text-emerald-400' : 'text-slate-500'}`} />
            <div>
              <div className="text-xs font-bold">Nadir (-90° Straight Down)</div>
              <div className="text-[11px] text-slate-400">Ground & Tripod Removal Patch</div>
            </div>
          </div>
          <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-slate-900 border border-slate-700">
            {nadirShotRecommended ? '1 shot (-90° patch)' : 'Covered in row'}
          </span>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/80 pt-2.5">
        Spherical 360° × 180° panoramas require seamless coverage from Zenith (+90°) to Nadir (-90°).
        {numRows === 1
          ? ' Your selected lens provides ultra-wide vertical coverage, allowing a complete 360° spherical capture with just 1 horizontal row plus zenith/nadir caps!'
          : ` With ${effectiveVfovDeg}° vertical FOV, multiple pitch tiers (${rowPitchesDeg.join('°, ')}°) are necessary to prevent polar stretching and gaps.`}
      </p>
    </div>
  );
};
