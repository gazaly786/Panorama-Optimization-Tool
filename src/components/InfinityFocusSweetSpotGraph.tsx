import React, { useState, useRef, useMemo } from 'react';
import { calculateDof } from '../calculations/dof';
import { calculateHyperfocalDistanceM } from '../calculations/hyperfocal';
import { Focus, Sparkles, AlertCircle, CheckCircle2, Crosshair, HelpCircle } from 'lucide-react';

interface InfinityFocusSweetSpotGraphProps {
  focalLengthMm: number;
  aperture: number;
  focusDistanceM: number;
  onFocusChange: (val: number) => void;
  circleOfConfusionMm: number;
  cameraModel: string;
  lensModel: string;
}

export const InfinityFocusSweetSpotGraph: React.FC<InfinityFocusSweetSpotGraphProps> = ({
  focalLengthMm,
  aperture,
  focusDistanceM,
  onFocusChange,
  circleOfConfusionMm,
  cameraModel,
  lensModel,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverU, setHoverU] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Hyperfocal distance H
  const H = useMemo(() => {
    return calculateHyperfocalDistanceM(focalLengthMm, aperture, circleOfConfusionMm);
  }, [focalLengthMm, aperture, circleOfConfusionMm]);

  // Current DOF calculation
  const currentDof = useMemo(() => {
    return calculateDof(focalLengthMm, aperture, focusDistanceM, circleOfConfusionMm);
  }, [focalLengthMm, aperture, focusDistanceM, circleOfConfusionMm]);

  // Graph dimensions
  const width = 640;
  const height = 260;
  const padding = { top: 30, right: 35, bottom: 42, left: 55 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Domain for focus distance u: 0.2m to 12m
  const minU = 0.2;
  const maxU = 12.0;

  // Logarithmic X-scale mapping function
  const uToX = (u: number): number => {
    const clampedU = Math.max(minU, Math.min(maxU, u));
    const t = Math.log10(clampedU / minU) / Math.log10(maxU / minU);
    return padding.left + t * plotWidth;
  };

  const xToU = (x: number): number => {
    const clampedX = Math.max(padding.left, Math.min(width - padding.right, x));
    const t = (clampedX - padding.left) / plotWidth;
    const val = minU * Math.pow(maxU / minU, t);
    return Math.round(val * 10) / 10;
  };

  // Y-scale: depth of field distance (0 to 10m, with top representing Infinity)
  // We reserve the top 20% of the plot for Infinity!
  const maxY = 10.0;
  const infinityY = padding.top;
  const distPlotHeight = plotHeight - 20;

  const yToCoord = (y: number | 'Infinity'): number => {
    if (y === 'Infinity' || (typeof y === 'number' && y >= 100)) {
      return infinityY;
    }
    const clampedY = Math.max(0, Math.min(maxY, y));
    const t = Math.sqrt(clampedY / maxY); // Square-root scaling for better near resolution
    return padding.top + 20 + (1 - t) * distPlotHeight;
  };

  // Generate curves data across 80 sample points
  const points = useMemo(() => {
    const numSteps = 70;
    const pts: { u: number; x: number; near: number; far: number | 'Infinity'; nearY: number; farY: number }[] = [];
    for (let i = 0; i <= numSteps; i++) {
      const t = i / numSteps;
      const u = minU * Math.pow(maxU / minU, t);
      const d = calculateDof(focalLengthMm, aperture, u, circleOfConfusionMm);
      pts.push({
        u,
        x: uToX(u),
        near: d.nearLimitM,
        far: d.farLimitM,
        nearY: yToCoord(d.nearLimitM),
        farY: yToCoord(d.farLimitM),
      });
    }
    return pts;
  }, [focalLengthMm, aperture, circleOfConfusionMm, plotWidth]);

  // Construct SVG paths
  // Near limit curve
  const nearPathD = useMemo(() => {
    return points.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x},${pt.nearY}` : `${acc} L ${pt.x},${pt.nearY}`;
    }, '');
  }, [points]);

  // Far limit curve (stops climbing once at Infinity)
  const farPathD = useMemo(() => {
    return points.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x},${pt.farY}` : `${acc} L ${pt.x},${pt.farY}`;
    }, '');
  }, [points]);

  // In-focus area polygon between near and far curves
  const inFocusAreaD = useMemo(() => {
    const forward = points.map((p) => `${p.x},${p.farY}`).join(' L ');
    const backward = points
      .slice()
      .reverse()
      .map((p) => `${p.x},${p.nearY}`)
      .join(' L ');
    return `M ${forward} L ${backward} Z`;
  }, [points]);

  // X-axis ticks (Distance markers in meters)
  const xTicks = [0.2, 0.3, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 5.0, 8.0, 12.0];

  // Y-axis ticks
  const yTicks = [
    { label: '0.2m', val: 0.2 },
    { label: '0.5m', val: 0.5 },
    { label: '1.0m', val: 1.0 },
    { label: '2.0m', val: 2.0 },
    { label: '5.0m', val: 5.0 },
    { label: '∞', val: 'Infinity' as const },
  ];

  // X coordinate of Hyperfocal Point H
  const hyperfocalX = uToX(H);
  // Current active focus X
  const currentFocusX = uToX(focusDistanceM);
  // Hovered or active focus distance
  const displayedU = hoverU !== null ? hoverU : focusDistanceM;
  const displayedDof = useMemo(() => {
    return calculateDof(focalLengthMm, aperture, displayedU, circleOfConfusionMm);
  }, [focalLengthMm, aperture, displayedU, circleOfConfusionMm]);

  // Mouse interaction handlers for interactive drag
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsDragging(true);
    updateFocusFromEvent(e);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    if (x >= padding.left && x <= width - padding.right) {
      const u = xToU(x);
      setHoverU(u);
      if (isDragging) {
        onFocusChange(u);
      }
    } else {
      setHoverU(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsDragging(false);
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  const updateFocusFromEvent = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    if (x >= padding.left && x <= width - padding.right) {
      const u = xToU(x);
      onFocusChange(u);
    }
  };

  // Determine current focus status relative to Infinity sweet spot
  const isAtHyperfocal = Math.abs(focusDistanceM - H) < 0.1;
  const isInfinitySweetSpot = focusDistanceM >= H * 0.95 && focusDistanceM <= Math.max(1.8, H * 2.2);
  const isFarBeyond = focusDistanceM > H * 3.5;
  const isSubHyperfocal = focusDistanceM < H * 0.9;

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Focus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>Interactive Depth of Field & Infinity Focus Graph</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono block">
              Drag anywhere on the graph to slide focus distance and locate the Infinity Focus Sweet Spot.
            </span>
          </div>
        </div>

        {/* Current State Pill */}
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold border flex items-center gap-1.5 shadow-sm ${
              isInfinitySweetSpot
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40 ring-2 ring-emerald-500/20'
                : isSubHyperfocal
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-sky-500/10 text-sky-300 border-sky-500/30'
            }`}
          >
            {isInfinitySweetSpot ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>INFINITY SWEET SPOT ACTIVE</span>
              </>
            ) : isSubHyperfocal ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>SUB-HYPERFOCAL (Far limit &lt; ∞)</span>
              </>
            ) : (
              <>
                <Crosshair className="w-3.5 h-3.5 text-sky-400" />
                <span>DEEP FIELD (Wasting Near Limit)</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Quick Snap Preset Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onFocusChange(H)}
          className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-between transition border ${
            isAtHyperfocal
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>1. Snap to Hyperfocal (H)</span>
          </span>
          <span className="font-mono text-[11px] font-bold">{H.toFixed(2)} m</span>
        </button>

        <button
          type="button"
          onClick={() => onFocusChange(Math.max(1.2, H * 1.15))}
          className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-between transition border ${
            Math.abs(focusDistanceM - Math.max(1.2, H * 1.15)) < 0.15
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black'
              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>2. Safe 360° Sweet Spot</span>
          </span>
          <span className="font-mono text-[11px] font-bold">{Math.max(1.2, H * 1.15).toFixed(1)} m</span>
        </button>

        <button
          type="button"
          onClick={() => onFocusChange(10.0)}
          className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-between transition border ${
            focusDistanceM >= 9.0
              ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md font-black'
              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-sky-400" />
            <span>3. Direct Infinity (∞ Mark)</span>
          </span>
          <span className="font-mono text-[11px] font-bold">10.0 m+</span>
        </button>
      </div>

      {/* SVG Interactive Graph Canvas */}
      <div className="relative w-full overflow-hidden bg-slate-950 rounded-2xl border border-slate-800 p-2 select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => {
            setHoverU(null);
            setIsDragging(false);
          }}
        >
          <defs>
            {/* Gradient for in-focus depth band */}
            <linearGradient id="focusBandGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#065f46" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0.05" />
            </linearGradient>

            {/* Gradient for Infinity Sweet Spot Zone */}
            <linearGradient id="sweetSpotZoneGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.04" />
            </linearGradient>

            {/* Marker definitions */}
            <radialGradient id="thumbGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </radialGradient>
          </defs>

          {/* 1. Background Grid & Axis Lines */}
          {/* Infinity Horizon ceiling line */}
          <line
            x1={padding.left}
            y1={infinityY}
            x2={width - padding.right}
            y2={infinityY}
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.6"
          />

          {/* Horizontal gridlines for distance */}
          {yTicks.map((tick, idx) => {
            const y = yToCoord(tick.val);
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#334155"
                  strokeWidth="0.8"
                  strokeDasharray="2 4"
                  opacity="0.5"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill={tick.val === 'Infinity' ? '#10b981' : '#64748b'}
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight={tick.val === 'Infinity' ? 'bold' : 'normal'}
                >
                  {tick.label}
                </text>
              </g>
            );
          })}

          {/* Vertical gridlines for Focus Distance */}
          {xTicks.map((u, idx) => {
            const x = uToX(u);
            return (
              <g key={idx}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke="#334155"
                  strokeWidth="0.8"
                  strokeDasharray="2 4"
                  opacity="0.3"
                />
                <text
                  x={x}
                  y={height - padding.bottom + 14}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {u >= 1 ? `${u}m` : `${u * 100}cm`}
                </text>
              </g>
            );
          })}

          {/* 2. Highlighted "Infinity Sweet Spot" Zone (from H to H*2.2) */}
          {hyperfocalX < width - padding.right && (
            <g>
              <rect
                x={hyperfocalX}
                y={padding.top}
                width={Math.max(10, Math.min(width - padding.right - hyperfocalX, uToX(Math.max(1.8, H * 2.2)) - hyperfocalX))}
                height={plotHeight}
                fill="url(#sweetSpotZoneGrad)"
              />
              {/* Sweet spot label */}
              <text
                x={hyperfocalX + 6}
                y={padding.top + 14}
                fill="#10b981"
                fontSize="8.5"
                fontWeight="bold"
                fontFamily="monospace"
                letterSpacing="0.05em"
              >
                ★ INFINITY SWEET SPOT (H → 1.5m)
              </text>
            </g>
          )}

          {/* 3. In-Focus Area Fill Polygon */}
          <path d={inFocusAreaD} fill="url(#focusBandGrad)" />

          {/* 4. Near & Far Limit Boundary Stroke Lines */}
          <path d={farPathD} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
          <path d={nearPathD} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />

          {/* 5. Hyperfocal Reference Vertical Marker */}
          <g>
            <line
              x1={hyperfocalX}
              y1={padding.top}
              x2={hyperfocalX}
              y2={height - padding.bottom}
              stroke="#fbbf24"
              strokeWidth="2"
              strokeDasharray="5 3"
            />
            {/* Hyperfocal H Badge at top */}
            <rect
              x={hyperfocalX - 34}
              y={padding.top - 18}
              width="68"
              height="16"
              rx="4"
              fill="#78350f"
              stroke="#fbbf24"
              strokeWidth="1"
            />
            <text
              x={hyperfocalX}
              y={padding.top - 7}
              textAnchor="middle"
              fill="#fbbf24"
              fontSize="9"
              fontWeight="bold"
              fontFamily="monospace"
            >
              H = {H.toFixed(2)}m
            </text>
          </g>

          {/* 6. Active Focus Cursor (Vertical Tracking Line) */}
          <g>
            <line
              x1={currentFocusX}
              y1={padding.top}
              x2={currentFocusX}
              y2={height - padding.bottom}
              stroke="#f59e0b"
              strokeWidth="2"
            />

            {/* Current Focus Point Dot */}
            <circle
              cx={currentFocusX}
              cy={yToCoord(focusDistanceM)}
              r="6"
              fill="#f59e0b"
              stroke="#ffffff"
              strokeWidth="2"
              className="animate-pulse"
            />

            {/* Near Limit Point on Cursor */}
            <circle
              cx={currentFocusX}
              cy={yToCoord(currentDof.nearLimitM)}
              r="4.5"
              fill="#38bdf8"
              stroke="#0f172a"
              strokeWidth="1.5"
            />

            {/* Far Limit Point on Cursor */}
            <circle
              cx={currentFocusX}
              cy={yToCoord(currentDof.farLimitM)}
              r="4.5"
              fill="#10b981"
              stroke="#0f172a"
              strokeWidth="1.5"
            />

            {/* Scrubber Knob at the bottom */}
            <circle cx={currentFocusX} cy={height - padding.bottom} r="10" fill="#f59e0b" />
            <circle cx={currentFocusX} cy={height - padding.bottom} r="4" fill="#0f172a" />
          </g>

          {/* 7. Hover Indicator (if different from active) */}
          {hoverU !== null && Math.abs(hoverU - focusDistanceM) > 0.05 && (
            <g opacity="0.6">
              <line
                x1={uToX(hoverU)}
                y1={padding.top}
                x2={uToX(hoverU)}
                y2={height - padding.bottom}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            </g>
          )}

          {/* Axis Labels */}
          <text
            x={width / 2}
            y={height - 6}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
          >
            ← Focus Distance Setting (m) →
          </text>
          <text
            x={16}
            y={height / 2}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
            transform={`rotate(-90, 16, ${height / 2})`}
          >
            ← In-Focus Limits (m) →
          </text>
        </svg>
      </div>

      {/* Real-time Reading & Sweet Spot Physics Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
        {/* Card 1: Focus Setting */}
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="uppercase text-[10px]">1. Focused At</span>
            <span className="text-amber-400 font-bold">{displayedU.toFixed(2)} m</span>
          </div>
          <div className="mt-1">
            <span className="text-xl font-black text-amber-400 font-mono">
              {displayedU.toFixed(2)} <span className="text-xs font-normal text-slate-400">meters</span>
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {displayedU < H
                ? `Before hyperfocal (${(H - displayedU).toFixed(2)}m under)`
                : displayedU === H
                ? 'Exact Hyperfocal distance!'
                : `Past hyperfocal (${(displayedU - H).toFixed(2)}m over)`}
            </span>
          </div>
        </div>

        {/* Card 2: Near Sharp Limit */}
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="uppercase text-[10px]">2. Near Sharp Limit</span>
            <span className="text-sky-400 font-bold">{displayedDof.nearLimitM} m</span>
          </div>
          <div className="mt-1">
            <span className="text-xl font-black text-sky-400 font-mono">
              {displayedDof.nearLimitM} <span className="text-xs font-normal text-slate-400">m ({Math.round(displayedDof.nearLimitM * 100)} cm)</span>
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Foreground objects closer than this will be soft
            </span>
          </div>
        </div>

        {/* Card 3: Far Limit & Infinity Status */}
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="uppercase text-[10px]">3. Far Limit (Infinity)</span>
            <span className={`font-bold ${displayedDof.farLimitM === 'Infinity' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {displayedDof.farLimitM === 'Infinity' ? '∞ REACHED' : `${displayedDof.farLimitM} m`}
            </span>
          </div>
          <div className="mt-1">
            <span className="text-xl font-black text-emerald-400 font-mono">
              {displayedDof.farLimitM === 'Infinity' ? '∞ (Infinity)' : `${displayedDof.farLimitM} m`}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {displayedDof.farLimitM === 'Infinity'
                ? 'Distant horizon & background are 100% tack-sharp'
                : 'Background horizon is out of focus! Increase focus.'}
            </span>
          </div>
        </div>
      </div>

      {/* Explanatory Educational Callout */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 text-xs flex flex-col gap-2">
        <div className="flex items-center gap-2 font-mono font-bold text-slate-200 uppercase">
          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>How to Read this Graph to Nail the "Infinity Sweet Spot"</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-400 leading-relaxed">
          <div>
            <strong className="text-emerald-400 block mb-0.5">1. The Infinity Horizon Boundary ($H$):</strong>
            Notice how the green curve (Far Limit) shoots straight up to <span className="text-emerald-300 font-mono">∞ (Infinity)</span> the instant focus reaches the yellow line at <span className="text-amber-300 font-mono">H = {H.toFixed(2)}m</span>. Any focus setting at or beyond this line guarantees crisp, clear distant details.
          </div>
          <div>
            <strong className="text-sky-400 block mb-0.5">2. The "Direct Infinity" Trap:</strong>
            Notice the blue curve (Near Limit): as you slide focus further right (past 3m toward 10m+), the near limit recedes outward. Focusing directly on the $\infty$ symbol wastes foreground depth! Focusing at <span className="text-emerald-300 font-mono">~1.2m</span> gives you both foreground tables at <span className="text-sky-300 font-mono">{currentDof.nearLimitM}m</span> and infinity.
          </div>
        </div>
      </div>
    </div>
  );
};
