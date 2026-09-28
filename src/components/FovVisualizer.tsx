import React, { useState, useRef, useEffect } from 'react';
import { usePanorama } from '../context/PanoramaContext';
import { calculateFov } from '../calculations/fov';
import { formatDualDistance, formatDualDimensions, formatDualMm } from '../utils/units';
import {
  Compass,
  Eye,
  RotateCw,
  Sliders,
  Maximize2,
  X,
  Layers,
  Sparkles,
  Info,
  Check,
  Camera,
  Maximize,
  Minimize2,
  CornerDownRight,
} from 'lucide-react';

interface FovVisualizerProps {
  isModal?: boolean;
  onCloseModal?: () => void;
  className?: string;
}

export const FovVisualizer: React.FC<FovVisualizerProps> = ({
  isModal = false,
  onCloseModal,
  className = '',
}) => {
  const {
    selectedCamera,
    selectedLens,
    currentFocalLengthMm,
    subjectDistanceM,
    setSubjectDistanceM,
    upperRailOffsetMm,
    results,
    unitPreference,
  } = usePanorama();

  // Perspective display mode: TOP_DOWN (Room Plan) vs SENSOR_FRAME (Aspect / Image Circle)
  const [viewMode, setViewMode] = useState<'TOP_DOWN' | 'SENSOR_FRAME'>('TOP_DOWN');

  // Camera mounting orientation: PORTRAIT (Standard for 360 heads) vs LANDSCAPE
  const [orientation, setOrientation] = useState<'PORTRAIT' | 'LANDSCAPE'>('PORTRAIT');

  // Interactive controls
  const [cameraPanAngleDeg, setCameraPanAngleDeg] = useState<number>(0);
  const [showOverlap, setShowOverlap] = useState<boolean>(true);
  const [showDofLimits, setShowDofLimits] = useState<boolean>(true);
  const [maxDistanceRangeM, setMaxDistanceRangeM] = useState<number>(6.0);

  // SVG Mouse Inspection State
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number; distM: number; angleDeg: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDraggingDistance, setIsDraggingDistance] = useState<boolean>(false);

  // Calculate FOV in landscape first
  const baseFov = calculateFov(selectedCamera, selectedLens, currentFocalLengthMm);

  // In 360° photography, camera is typically mounted in Portrait orientation on panoramic heads:
  // When mounted in portrait: the sensor width is vertical, and sensor height is horizontal.
  const activeHfovDeg = orientation === 'PORTRAIT'
    ? Math.min(baseFov.horizontalDeg, baseFov.verticalDeg)
    : Math.max(baseFov.horizontalDeg, baseFov.verticalDeg);

  const activeVfovDeg = orientation === 'PORTRAIT'
    ? Math.max(baseFov.horizontalDeg, baseFov.verticalDeg)
    : Math.min(baseFov.horizontalDeg, baseFov.verticalDeg);

  // Geometry dimensions for SVG
  const svgWidth = 640;
  const svgHeight = 440;
  const originX = svgWidth / 2; // 320
  const originY = 385; // Camera pivot point near bottom

  // Distance to SVG pixels mapping
  const pxPerMeter = (originY - 50) / maxDistanceRangeM;

  // Beam width at current subject distance:
  // W = 2 * d * tan(FOV / 2)
  const halfHfovRad = (activeHfovDeg / 2) * (Math.PI / 180);
  const beamWidthAtSubjectM = 2 * subjectDistanceM * Math.tan(halfHfovRad);

  // Near & Far DOF limits
  const nearLimitM = typeof results.nearLimitM === 'number' ? results.nearLimitM : 0.5;
  const farLimitM = results.farLimitM >= 900 ? maxDistanceRangeM : results.farLimitM;

  // Helper to convert polar (distM, angleDeg relative to center optical axis) to SVG (x, y)
  const polarToSvg = (distM: number, angleDeg: number) => {
    const totalAngleRad = (angleDeg - 90) * (Math.PI / 180);
    const rPx = Math.min(distM, maxDistanceRangeM * 1.05) * pxPerMeter;
    return {
      x: originX + rPx * Math.cos(totalAngleRad),
      y: originY + rPx * Math.sin(totalAngleRad),
    };
  };

  // Build SVG path for an optical FOV wedge at a given rotation angle
  const buildFovWedgePath = (centerAngleDeg: number, hfovDeg: number, maxDistM: number) => {
    const halfAngle = hfovDeg / 2;
    const startAngle = centerAngleDeg - halfAngle;
    const endAngle = centerAngleDeg + halfAngle;

    const pLeft = polarToSvg(maxDistM, startAngle);
    const pRight = polarToSvg(maxDistM, endAngle);

    // Arc curvature
    const rPx = maxDistM * pxPerMeter;
    const largeArc = hfovDeg > 180 ? 1 : 0;

    return `M ${originX} ${originY} L ${pLeft.x} ${pLeft.y} A ${rPx} ${rPx} 0 ${largeArc} 1 ${pRight.x} ${pRight.y} Z`;
  };

  // Build DOF band path (between near limit and far limit)
  const buildDofBandPath = (centerAngleDeg: number, hfovDeg: number, nearM: number, farM: number) => {
    const halfAngle = hfovDeg / 2;
    const startAngle = centerAngleDeg - halfAngle;
    const endAngle = centerAngleDeg + halfAngle;

    const nearLeft = polarToSvg(nearM, startAngle);
    const nearRight = polarToSvg(nearM, endAngle);
    const farRight = polarToSvg(farM, endAngle);
    const farLeft = polarToSvg(farM, startAngle);

    const rNear = nearM * pxPerMeter;
    const rFar = farM * pxPerMeter;
    const largeArc = hfovDeg > 180 ? 1 : 0;

    return `M ${nearLeft.x} ${nearLeft.y} A ${rNear} ${rNear} 0 ${largeArc} 1 ${nearRight.x} ${nearRight.y} L ${farRight.x} ${farRight.y} A ${rFar} ${rFar} 0 ${largeArc} 0 ${farLeft.x} ${farLeft.y} Z`;
  };

  // Mouse move handler for interactive SVG crosshair inspection
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Convert to SVG coordinate space
    const scaleX = svgWidth / rect.width;
    const scaleY = svgHeight / rect.height;
    const x = clientX * scaleX;
    const y = clientY * scaleY;

    // Delta from origin
    const dx = x - originX;
    const dy = originY - y; // up is positive
    const distPx = Math.sqrt(dx * dx + dy * dy);
    const distM = distPx / pxPerMeter;

    let angleRad = Math.atan2(dx, dy); // 0 at top, positive right
    let angleDeg = angleRad * (180 / Math.PI);

    setHoverCoord({
      x,
      y,
      distM: Math.round(distM * 100) / 100,
      angleDeg: Math.round(angleDeg * 10) / 10,
    });

    if (isDraggingDistance) {
      const clampedDist = Math.max(0.3, Math.min(maxDistanceRangeM, distM));
      setSubjectDistanceM(Math.round(clampedDist * 10) / 10);
    }
  };

  const handleMouseDown = () => {
    setIsDraggingDistance(true);
  };

  const handleMouseUp = () => {
    setIsDraggingDistance(false);
  };

  useEffect(() => {
    const onGlobalMouseUp = () => setIsDraggingDistance(false);
    window.addEventListener('mouseup', onGlobalMouseUp);
    return () => window.removeEventListener('mouseup', onGlobalMouseUp);
  }, []);

  // Distance range scale values (meters)
  const distanceSteps = maxDistanceRangeM <= 4
    ? [0.5, 1, 2, 3, 4]
    : maxDistanceRangeM <= 8
    ? [1, 2, 3, 4, 6, 8]
    : [1, 2, 4, 6, 8, 10, 12];

  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col overflow-hidden ${
        isModal ? 'w-full max-w-5xl max-h-[92vh]' : 'w-full'
      } ${className}`}
    >
      {/* Visualizer Top Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-white">
                Interactive Field of View (FOV) Optical Beam
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                {activeHfovDeg}° HFOV · {orientation}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live optical coverage projection for <strong className="text-slate-200">{selectedCamera.model}</strong> + <strong className="text-slate-200">{selectedLens.model}</strong>
            </p>
          </div>
        </div>

        {/* View Mode Controls & Modal Close */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode('TOP_DOWN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                viewMode === 'TOP_DOWN'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Room Plan (Top-Down)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('SENSOR_FRAME')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                viewMode === 'SENSOR_FRAME'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Sensor & Image Circle</span>
            </button>
          </div>

          {/* Mount Orientation Switcher */}
          <button
            type="button"
            onClick={() => setOrientation(orientation === 'PORTRAIT' ? 'LANDSCAPE' : 'PORTRAIT')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition flex items-center gap-1.5 ${
              orientation === 'PORTRAIT'
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title="Toggle between portrait mount (standard 360 vertical bracket) and landscape horizontal"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{orientation}</span>
          </button>

          {isModal && onCloseModal && (
            <button
              type="button"
              onClick={onCloseModal}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700 ml-1"
              title="Close Fullscreen FOV Visualizer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div className="p-4 sm:p-5 flex flex-col gap-4">
        {/* Top Mini Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Horizontal FOV:</span>
            <span className="font-bold text-amber-400">{activeHfovDeg}°</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Vertical FOV:</span>
            <span className="font-bold text-sky-400">{activeVfovDeg}°</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Room Beam @ {subjectDistanceM}m:</span>
            <span className="font-bold text-emerald-400">
              {formatDualDistance(beamWidthAtSubjectM, 1)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Overlap with Next Shot:</span>
            <span className="font-bold text-amber-300">{results.overlapPct}%</span>
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* VIEW MODE A: TOP-DOWN OPTICAL BEAM PROJECTION                       */}
        {/* ------------------------------------------------------------------- */}
        {viewMode === 'TOP_DOWN' && (
          <div className="flex flex-col gap-3">
            {/* SVG Visualizer Container */}
            <div className="relative w-full rounded-2xl bg-slate-950 border border-slate-800/90 overflow-hidden shadow-inner select-none">
              {/* SVG Canvas */}
              <svg
                ref={svgRef}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-auto max-h-[460px] cursor-crosshair transition-all"
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => setHoverCoord(null)}
              >
                <defs>
                  {/* Active Primary FOV Beam Gradient */}
                  <radialGradient id="fovBeamGradient" cx="50%" cy="100%" r="100%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                    <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.22" />
                    <stop offset="85%" stopColor="#f59e0b" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.01" />
                  </radialGradient>

                  {/* Adjacent Overlap Beam Gradient */}
                  <radialGradient id="overlapBeamGradient" cx="50%" cy="100%" r="100%">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.30" />
                    <stop offset="60%" stopColor="#0ea5e9" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.02" />
                  </radialGradient>

                  {/* Overlap Intersection Hatch Pattern */}
                  <pattern id="overlapHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="8" stroke="#10b981" strokeWidth="2.5" strokeOpacity="0.4" />
                  </pattern>

                  {/* DOF In-Focus Band Gradient */}
                  <radialGradient id="dofBandGradient" cx="50%" cy="100%" r="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.25" />
                  </radialGradient>
                </defs>

                {/* Background Distance Range Arcs & Labels */}
                {distanceSteps.map((dist) => {
                  const rPx = dist * pxPerMeter;
                  return (
                    <g key={dist} className="pointer-events-none">
                      <path
                        d={`M ${originX - rPx} ${originY} A ${rPx} ${rPx} 0 0 1 ${originX + rPx} ${originY}`}
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="1"
                        strokeDasharray="4,4"
                      />
                      <text
                        x={originX + 12}
                        y={originY - rPx + 14}
                        fill="#64748b"
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {formatDualDistance(dist, 1)}
                      </text>
                    </g>
                  );
                })}

                {/* Radial Protractor Grid Lines */}
                {[-75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75].map((angle) => {
                  const p = polarToSvg(maxDistanceRangeM * 1.02, angle);
                  return (
                    <g key={angle} className="pointer-events-none">
                      <line
                        x1={originX}
                        y1={originY}
                        x2={p.x}
                        y2={p.y}
                        stroke="#1e293b"
                        strokeWidth={angle === 0 ? '1.5' : '1'}
                        strokeDasharray={angle === 0 ? 'none' : '3,3'}
                        strokeOpacity={angle === 0 ? 0.7 : 0.4}
                      />
                      <text
                        x={p.x}
                        y={p.y - 4}
                        fill="#475569"
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {angle > 0 ? `+${angle}°` : `${angle}°`}
                      </text>
                    </g>
                  );
                })}

                {/* Adjacent Frame Overlap Wedge (at rotationIncrementDeg) */}
                {showOverlap && (
                  <g className="transition-all duration-300">
                    <path
                      d={buildFovWedgePath(cameraPanAngleDeg + results.rotationIncrementDeg, activeHfovDeg, maxDistanceRangeM)}
                      fill="url(#overlapBeamGradient)"
                      stroke="#0ea5e9"
                      strokeWidth="1.5"
                      strokeDasharray="4,3"
                      strokeOpacity="0.7"
                    />
                    {/* Adjacent Shot Label */}
                    {(() => {
                      const pAdj = polarToSvg(maxDistanceRangeM * 0.85, cameraPanAngleDeg + results.rotationIncrementDeg);
                      return (
                        <text
                          x={pAdj.x}
                          y={pAdj.y}
                          fill="#38bdf8"
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          Next Shot (+{results.rotationIncrementDeg}°)
                        </text>
                      );
                    })()}
                  </g>
                )}

                {/* Depth of Field (DOF) In-Focus Region Highlight */}
                {showDofLimits && nearLimitM < maxDistanceRangeM && (
                  <g className="pointer-events-none transition-all duration-300">
                    <path
                      d={buildDofBandPath(cameraPanAngleDeg, activeHfovDeg, nearLimitM, Math.min(farLimitM, maxDistanceRangeM))}
                      fill="url(#dofBandGradient)"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeDasharray="3,3"
                      strokeOpacity="0.8"
                    />
                    {/* Near Limit Arc Line */}
                    {(() => {
                      const rNear = nearLimitM * pxPerMeter;
                      return (
                        <text
                          x={originX - 15}
                          y={originY - rNear - 4}
                          fill="#34d399"
                          fontSize="9"
                          fontFamily="monospace"
                          textAnchor="end"
                          fontWeight="bold"
                        >
                          Near DOF: {formatDualDistance(nearLimitM, 2)}
                        </text>
                      );
                    })()}
                  </g>
                )}

                {/* PRIMARY CAMERA OPTICAL BEAM WEDGE */}
                <g className="transition-all duration-150">
                  <path
                    d={buildFovWedgePath(cameraPanAngleDeg, activeHfovDeg, maxDistanceRangeM)}
                    fill="url(#fovBeamGradient)"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeOpacity="0.95"
                  />

                  {/* Left & Right Boundary Rays */}
                  {(() => {
                    const leftRay = polarToSvg(maxDistanceRangeM, cameraPanAngleDeg - activeHfovDeg / 2);
                    const rightRay = polarToSvg(maxDistanceRangeM, cameraPanAngleDeg + activeHfovDeg / 2);
                    const centerRay = polarToSvg(maxDistanceRangeM, cameraPanAngleDeg);

                    return (
                      <>
                        <line
                          x1={originX}
                          y1={originY}
                          x2={leftRay.x}
                          y2={leftRay.y}
                          stroke="#fbbf24"
                          strokeWidth="2"
                        />
                        <line
                          x1={originX}
                          y1={originY}
                          x2={rightRay.x}
                          y2={rightRay.y}
                          stroke="#fbbf24"
                          strokeWidth="2"
                        />
                        {/* Central Optical Axis */}
                        <line
                          x1={originX}
                          y1={originY}
                          x2={centerRay.x}
                          y2={centerRay.y}
                          stroke="#fbbf24"
                          strokeWidth="1.5"
                          strokeDasharray="5,4"
                          strokeOpacity="0.8"
                        />
                      </>
                    );
                  })()}
                </g>

                {/* CURRENT SUBJECT DISTANCE FOCAL PLANE & INTERACTIVE DRAG HANDLE */}
                {subjectDistanceM <= maxDistanceRangeM && (
                  <g className="cursor-ns-resize">
                    {/* Subject Distance Arc */}
                    {(() => {
                      const rSub = subjectDistanceM * pxPerMeter;
                      const pLeft = polarToSvg(subjectDistanceM, cameraPanAngleDeg - activeHfovDeg / 2);
                      const pRight = polarToSvg(subjectDistanceM, cameraPanAngleDeg + activeHfovDeg / 2);
                      const pCenter = polarToSvg(subjectDistanceM, cameraPanAngleDeg);

                      return (
                        <>
                          <path
                            d={`M ${pLeft.x} ${pLeft.y} A ${rSub} ${rSub} 0 0 1 ${pRight.x} ${pRight.y}`}
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="3"
                            strokeDasharray="6,4"
                          />

                          {/* Horizontal Field Span Dimension Bar */}
                          <line
                            x1={pLeft.x}
                            y1={pLeft.y}
                            x2={pRight.x}
                            y2={pRight.y}
                            stroke="#38bdf8"
                            strokeWidth="1.5"
                            strokeOpacity="0.6"
                          />

                          {/* Dimension Width Label */}
                          <rect
                            x={pCenter.x - 70}
                            y={pCenter.y - 24}
                            width="140"
                            height="20"
                            rx="10"
                            fill="#0284c7"
                            fillOpacity="0.9"
                          />
                          <text
                            x={pCenter.x}
                            y={pCenter.y - 10}
                            fill="#ffffff"
                            fontSize="10"
                            fontFamily="monospace"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            Span: {formatDualDistance(beamWidthAtSubjectM, 1)}
                          </text>

                          {/* Center Drag Handle Bead */}
                          <circle
                            cx={pCenter.x}
                            cy={pCenter.y}
                            r="7"
                            fill="#38bdf8"
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="hover:scale-125 transition-transform"
                          />
                        </>
                      );
                    })()}
                  </g>
                )}

                {/* CAMERA RIG GRAPHIC AT PIVOT (NPP Entrance Pupil) */}
                <g className="pointer-events-none">
                  {/* Upper Rail NPP Base */}
                  <rect
                    x={originX - 22}
                    y={originY - 8}
                    width="44"
                    height="16"
                    rx="4"
                    fill="#1e293b"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                  />
                  {/* Camera Body Block */}
                  <rect
                    x={originX - 16}
                    y={originY}
                    width="32"
                    height="20"
                    rx="3"
                    fill="#0f172a"
                    stroke="#475569"
                    strokeWidth="1.5"
                  />
                  {/* Lens Barrel */}
                  <path
                    d={`M ${originX - 10} ${originY} L ${originX - 12} ${originY - 14} L ${originX + 12} ${originY - 14} L ${originX + 10} ${originY} Z`}
                    fill="#334155"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                  />
                  {/* Entrance Pupil Pivot Center Dot */}
                  <circle cx={originX} cy={originY} r="4" fill="#f59e0b" />
                  <circle cx={originX} cy={originY} r="7" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" />
                  <text
                    x={originX}
                    y={originY + 34}
                    fill="#cbd5e1"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    NPP Pivot ({formatDualMm(upperRailOffsetMm || selectedLens.entrancePupilOffsetMm || 42)})
                  </text>
                </g>

                {/* MOUSE HOVER INSPECTION TOOLTIP OVERLAY */}
                {hoverCoord && (
                  <g className="pointer-events-none">
                    {/* Crosshair indicator */}
                    <circle cx={hoverCoord.x} cy={hoverCoord.y} r="5" fill="#f59e0b" fillOpacity="0.8" />
                    <line x1={hoverCoord.x - 12} y1={hoverCoord.y} x2={hoverCoord.x + 12} y2={hoverCoord.y} stroke="#f59e0b" strokeWidth="1" />
                    <line x1={hoverCoord.x} y1={hoverCoord.y - 12} x2={hoverCoord.x} y2={hoverCoord.y + 12} stroke="#f59e0b" strokeWidth="1" />

                    {/* Info Card */}
                    <g transform={`translate(${Math.min(hoverCoord.x + 14, svgWidth - 140)}, ${Math.max(hoverCoord.y - 30, 20)})`}>
                      <rect width="130" height="42" rx="8" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" fillOpacity="0.95" />
                      <text x="8" y="16" fill="#f59e0b" fontSize="10" fontFamily="monospace" fontWeight="bold">
                        Dist: {formatDualDistance(hoverCoord.distM, 2)}
                      </text>
                      <text x="8" y="32" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                        Angle: {hoverCoord.angleDeg > 0 ? `+${hoverCoord.angleDeg}°` : `${hoverCoord.angleDeg}°`}
                      </text>
                    </g>
                  </g>
                )}
              </svg>

              {/* Bottom In-Canvas Helper Bar */}
              <div className="absolute bottom-2 inset-x-3 flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 pointer-events-none">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Optical Cone: {activeHfovDeg}° ({orientation})</span>
                </span>
                <span>Click & drag vertically to change Focus Distance ({subjectDistanceM}m)</span>
              </div>
            </div>

            {/* Interactive Sliders & Toggles Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              {/* Slider 1: Camera Pan Angle */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Rotator Pan Angle:</span>
                  <span className="font-mono text-amber-400 font-bold">{cameraPanAngleDeg}°</span>
                </div>
                <input
                  type="range"
                  min="-90"
                  max="90"
                  step="5"
                  value={cameraPanAngleDeg}
                  onChange={(e) => setCameraPanAngleDeg(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <button type="button" onClick={() => setCameraPanAngleDeg(0)} className="hover:text-amber-400">
                    Center (0°)
                  </button>
                  <button type="button" onClick={() => setCameraPanAngleDeg(results.rotationIncrementDeg)} className="hover:text-amber-400">
                    +{results.rotationIncrementDeg}° Next Detent
                  </button>
                </div>
              </div>

              {/* Slider 2: Subject Distance */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Subject Distance:</span>
                  <span className="font-mono text-sky-400 font-bold">{formatDualDistance(subjectDistanceM, 1)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max={maxDistanceRangeM}
                  step="0.1"
                  value={subjectDistanceM}
                  onChange={(e) => setSubjectDistanceM(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0.5m</span>
                  <span>{maxDistanceRangeM}m</span>
                </div>
              </div>

              {/* Toggles: Overlap & DOF Limit Overlays */}
              <div className="flex items-center justify-around gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowOverlap(!showOverlap)}
                  className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition flex items-center gap-1.5 ${
                    showOverlap
                      ? 'bg-sky-500/20 text-sky-400 border-sky-500/40 shadow'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Next Shot Overlap</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDofLimits(!showDofLimits)}
                  className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition flex items-center gap-1.5 ${
                    showDofLimits
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>DOF Limits</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* VIEW MODE B: SENSOR FRAME & LENS IMAGE CIRCLE PROJECTION            */}
        {/* ------------------------------------------------------------------- */}
        {viewMode === 'SENSOR_FRAME' && (
          <div className="flex flex-col gap-4">
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Left: Sensor Frame Graphic */}
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner shrink-0">
                {/* SVG Sensor & Image Circle Representation */}
                <svg viewBox="0 0 240 240" className="w-full h-full p-3">
                  {/* Lens Image Circle */}
                  <circle
                    cx="120"
                    cy="120"
                    r={results.isFisheye && selectedLens.projectionType === 'fisheye_circular' ? '70' : '105'}
                    fill="#f59e0b"
                    fillOpacity="0.08"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                  />

                  {/* Camera Sensor Rectangle */}
                  {(() => {
                    const isPort = orientation === 'PORTRAIT';
                    // Aspect ratio calculation
                    const sw = isPort ? selectedCamera.sensorHeightMm : selectedCamera.sensorWidthMm;
                    const sh = isPort ? selectedCamera.sensorWidthMm : selectedCamera.sensorHeightMm;
                    const scaleFactor = 170 / Math.max(sw, sh);
                    const rectW = sw * scaleFactor;
                    const rectH = sh * scaleFactor;

                    return (
                      <>
                        <rect
                          x={120 - rectW / 2}
                          y={120 - rectH / 2}
                          width={rectW}
                          height={rectH}
                          rx="6"
                          fill="#0f172a"
                          stroke="#38bdf8"
                          strokeWidth="2.5"
                          fillOpacity="0.85"
                        />

                        {/* Diagonal Inscribed Ray */}
                        <line
                          x1={120 - rectW / 2}
                          y1={120 - rectH / 2}
                          x2={120 + rectW / 2}
                          y2={120 + rectH / 2}
                          stroke="#38bdf8"
                          strokeWidth="1"
                          strokeDasharray="3,3"
                          strokeOpacity="0.5"
                        />

                        {/* Sensor Format Dimensions Label */}
                        <text
                          x="120"
                          y="124"
                          fill="#ffffff"
                          fontSize="11"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {selectedCamera.sensorFormat}
                        </text>
                        <text
                          x="120"
                          y="138"
                          fill="#94a3b8"
                          fontSize="9"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {sw.toFixed(1)} × {sh.toFixed(1)} mm
                        </text>
                      </>
                    );
                  })()}
                </svg>

                {/* Corner Orientation Badge */}
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-700 text-[10px] font-mono text-amber-400 font-bold">
                  {orientation} Mode
                </div>
              </div>

              {/* Right: Optical Coverage Specs & Analysis */}
              <div className="flex-1 flex flex-col gap-3 text-xs">
                <div className="border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Optical Sensor Coverage Analysis</span>
                  </h4>
                  <p className="text-slate-400 mt-0.5">
                    Comparison of camera sensor format ({selectedCamera.sensorFormat}) and optical image circle cast by {selectedLens.model}.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 font-mono">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Sensor Dimensions:</span>
                    <span className="font-bold text-white text-sm">
                      {formatDualDimensions(selectedCamera.sensorWidthMm, selectedCamera.sensorHeightMm)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Diagonal Coverage (DFOV):</span>
                    <span className="font-bold text-amber-400 text-sm">
                      {baseFov.diagonalDeg}° DFOV
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Active Horizontal (HFOV):</span>
                    <span className="font-bold text-sky-400 text-sm">
                      {activeHfovDeg}°
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Active Vertical (VFOV):</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {activeVfovDeg}°
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-slate-300 leading-relaxed">
                  <strong className="text-amber-400 block mb-0.5">Why Portrait Orientation is Standard:</strong>
                  In 360° spherical panoramas, mounting the camera vertically maximizes vertical field of view ({activeVfovDeg}°), capturing both ceiling (Zenith) and floor (Nadir) in a single horizontal rotator sweep.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between flex-wrap gap-2 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <Camera className="w-3.5 h-3.5 text-amber-400" />
          <span>Focal Length: {results.effectiveFocalLengthMm.toFixed(1)}mm ({selectedCamera.cropFactor}x Crop)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Projection:</span>
          <span className="text-amber-300 font-bold">{baseFov.projectionDescription}</span>
        </div>
      </div>
    </div>
  );
};
