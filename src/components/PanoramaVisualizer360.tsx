import React, { useState } from 'react';
import { Camera, Compass, RotateCw } from 'lucide-react';

interface PanoramaVisualizer360Props {
  shotsPerCircle: number;
  rotationIncrementDeg: number;
  effectiveHfovDeg: number;
  overlapPct: number;
  lensModel: string;
  isFisheye: boolean;
}

export const PanoramaVisualizer360: React.FC<PanoramaVisualizer360Props> = ({
  shotsPerCircle,
  rotationIncrementDeg,
  effectiveHfovDeg,
  overlapPct,
  lensModel,
  isFisheye,
}) => {
  const [activeShotIndex, setActiveShotIndex] = useState<number>(0);
  const [interactiveAngle, setInteractiveAngle] = useState<number>(0);

  // Geometry parameters for SVG
  const size = 320;
  const center = size / 2;
  const radius = size * 0.42;
  const innerRadius = 38;

  // Helper to compute SVG arc coordinates
  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    // 0 deg at top (12 o'clock), rotating clockwise
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeSector = (startAngle: number, endAngle: number, outerR: number, innerR: number) => {
    const sweep = endAngle - startAngle;
    const isLargeArc = sweep >= 180 ? 1 : 0;
    const startOuter = polarToCartesian(center, center, outerR, startAngle);
    const endOuter = polarToCartesian(center, center, outerR, endAngle);
    const startInner = polarToCartesian(center, center, innerR, endAngle);
    const endInner = polarToCartesian(center, center, innerR, startAngle);

    return [
      `M ${startOuter.x} ${startOuter.y}`,
      `A ${outerR} ${outerR} 0 ${isLargeArc} 1 ${endOuter.x} ${endOuter.y}`,
      `L ${startInner.x} ${startInner.y}`,
      `A ${innerR} ${innerR} 0 ${isLargeArc} 0 ${endInner.x} ${endInner.y}`,
      'Z',
    ].join(' ');
  };

  // Generate shots
  const shots = Array.from({ length: shotsPerCircle }, (_, i) => {
    const shotCenterDeg = i * rotationIncrementDeg;
    const halfFov = effectiveHfovDeg / 2;
    const startAngle = shotCenterDeg - halfFov;
    const endAngle = shotCenterDeg + halfFov;
    return {
      index: i + 1,
      centerDeg: shotCenterDeg,
      startAngle,
      endAngle,
      isActive: i === activeShotIndex,
    };
  });

  return (
    <div className="flex flex-col items-center bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="w-full flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
            360° Rotational Shot Visualizer
          </h3>
        </div>
        <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
          {shotsPerCircle} shots @ {rotationIncrementDeg}°
        </span>
      </div>

      <div className="relative w-[320px] h-[320px] flex items-center justify-center">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full overflow-visible select-none"
        >
          {/* Degree grid markings */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
            const pt1 = polarToCartesian(center, center, radius + 4, deg);
            const pt2 = polarToCartesian(center, center, radius + 14, deg);
            const textPt = polarToCartesian(center, center, radius + 24, deg);
            const isCardinal = deg % 90 === 0;

            return (
              <g key={deg}>
                <line
                  x1={pt1.x}
                  y1={pt1.y}
                  x2={pt2.x}
                  y2={pt2.y}
                  stroke={isCardinal ? '#f59e0b' : '#475569'}
                  strokeWidth={isCardinal ? 2 : 1}
                />
                <text
                  x={textPt.x}
                  y={textPt.y + 4}
                  fill={isCardinal ? '#f59e0b' : '#64748b'}
                  fontSize={isCardinal ? '10' : '8'}
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {deg}°
                </text>
              </g>
            );
          })}

          {/* Outer circle boundary */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#334155"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Sectors for each shot */}
          {shots.map((shot, idx) => {
            const pathData = describeSector(shot.startAngle, shot.endAngle, radius, innerRadius);
            const labelPos = polarToCartesian(center, center, radius * 0.72, shot.centerDeg);

            return (
              <g
                key={idx}
                className="cursor-pointer transition-opacity"
                onClick={() => {
                  setActiveShotIndex(idx);
                  setInteractiveAngle(shot.centerDeg);
                }}
              >
                <path
                  d={pathData}
                  fill={shot.isActive ? 'rgba(245, 158, 11, 0.35)' : 'rgba(56, 189, 248, 0.12)'}
                  stroke={shot.isActive ? '#f59e0b' : '#38bdf8'}
                  strokeWidth={shot.isActive ? '2' : '1'}
                  strokeOpacity={shot.isActive ? '1' : '0.4'}
                  className="hover:fill-amber-500/25 transition-all duration-150"
                />
                {/* Shot Number Indicator */}
                <circle
                  cx={labelPos.x}
                  cy={labelPos.y}
                  r="10"
                  fill={shot.isActive ? '#f59e0b' : '#1e293b'}
                  stroke={shot.isActive ? '#fff' : '#64748b'}
                  strokeWidth="1.5"
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y + 3.5}
                  fill={shot.isActive ? '#0f172a' : '#e2e8f0'}
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {shot.index}
                </text>
              </g>
            );
          })}

          {/* Center Hub & Camera Representation */}
          <circle
            cx={center}
            cy={center}
            r={innerRadius}
            fill="#0f172a"
            stroke="#475569"
            strokeWidth="2"
          />

          {/* Camera Direction Indicator Pointer */}
          {(() => {
            const curShot = shots[activeShotIndex] || shots[0];
            const arrowTip = polarToCartesian(center, center, innerRadius - 4, curShot.centerDeg);
            const arrowBase1 = polarToCartesian(center, center, 14, curShot.centerDeg - 90);
            const arrowBase2 = polarToCartesian(center, center, 14, curShot.centerDeg + 90);

            return (
              <polygon
                points={`${arrowTip.x},${arrowTip.y} ${arrowBase1.x},${arrowBase1.y} ${arrowBase2.x},${arrowBase2.y}`}
                fill="#f59e0b"
                stroke="#d97706"
                strokeWidth="1"
              />
            );
          })()}

          {/* Center Nodal Dot */}
          <circle cx={center} cy={center} r="4" fill="#38bdf8" />
        </svg>

        {/* Center overlay label */}
        <div className="absolute flex flex-col items-center pointer-events-none">
          <Camera className="w-4 h-4 text-amber-400 mb-0.5" />
          <span className="text-[9px] font-mono font-bold text-slate-300">
            {shots[activeShotIndex]?.centerDeg}°
          </span>
        </div>
      </div>

      {/* Shot Selector Bar */}
      <div className="w-full mt-3 flex items-center justify-between gap-1 overflow-x-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800">
        {shots.map((shot, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setActiveShotIndex(idx);
              setInteractiveAngle(shot.centerDeg);
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-mono transition-all flex flex-col items-center ${
              shot.isActive
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span className="text-[10px] opacity-80">Shot {shot.index}</span>
            <span>{shot.centerDeg}°</span>
          </button>
        ))}
      </div>

      {/* Interactive Telemetry Grid */}
      <div className="w-full grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-center">
        <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/50">
          <div className="text-[10px] text-slate-400 uppercase font-medium">Angle per Shot</div>
          <div className="text-xs font-mono font-bold text-slate-200 mt-0.5">{effectiveHfovDeg}° HFOV</div>
        </div>
        <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/50">
          <div className="text-[10px] text-slate-400 uppercase font-medium">Rotation Step</div>
          <div className="text-xs font-mono font-bold text-amber-400 mt-0.5">{rotationIncrementDeg}° click</div>
        </div>
        <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/50">
          <div className="text-[10px] text-slate-400 uppercase font-medium">Stitching Overlap</div>
          <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">~{overlapPct}%</div>
        </div>
      </div>
    </div>
  );
};
