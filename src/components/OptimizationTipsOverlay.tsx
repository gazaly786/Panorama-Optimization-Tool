import React, { useState, useEffect } from 'react';
import { usePanorama } from '../context/PanoramaContext';
import { formatDualMm, formatDualDistance } from '../utils/units';
import {
  Lightbulb,
  Info,
  Sparkles,
  X,
  CheckCircle,
  AlertTriangle,
  Camera,
  Layers,
  RotateCw,
  Compass,
  Sun,
  Eye,
  Crosshair,
  ArrowRight,
  Lock,
  Focus,
  Check,
  Zap,
} from 'lucide-react';

export type TipCategoryKey =
  | 'shots_overlap'
  | 'aperture'
  | 'shutter'
  | 'iso'
  | 'focus'
  | 'nodal_point'
  | 'aeb_hdr'
  | 'white_balance';

interface OptimizationTipsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  initialTipKey?: TipCategoryKey | null;
}

export const OptimizationTipsOverlay: React.FC<OptimizationTipsOverlayProps> = ({
  isOpen,
  onClose,
  initialTipKey,
}) => {
  const {
    selectedCamera,
    selectedLens,
    selectedPanoHead,
    selectedScenario,
    subjectDistanceM,
    upperRailOffsetMm,
    results,
    tripodOn,
  } = usePanorama();

  const [activeKey, setActiveKey] = useState<TipCategoryKey>(initialTipKey || 'shots_overlap');

  useEffect(() => {
    if (initialTipKey) {
      setActiveKey(initialTipKey);
    }
  }, [initialTipKey, isOpen]);

  if (!isOpen) return null;

  const nppVal = upperRailOffsetMm || selectedLens.entrancePupilOffsetMm || 42;
  const isFisheye = results.isFisheye;

  // Context-aware tips dictionary specifically formulated for 360-degree photography
  const tipsData: Record<
    TipCategoryKey,
    {
      title: string;
      badge: string;
      icon: React.ReactNode;
      calculatedValue: string;
      calculatedLabel: string;
      why360: string;
      proTip: string;
      mistakeToAvoid: string;
      gearContext: string;
      stitchAdvice: string;
    }
  > = {
    shots_overlap: {
      title: '360° Rotation Detents & Stitching Overlap',
      badge: `${results.shotsPerCircle} Shots @ ${results.rotationIncrementDeg}° Detents (${results.overlapPct}% Overlap)`,
      icon: <RotateCw className="w-5 h-5 text-amber-400" />,
      calculatedValue: `${results.shotsPerCircle} Shots Around · ${results.rotationIncrementDeg}° Clicks`,
      calculatedLabel: 'Optimal Circle Geometry',
      why360: `To stitch an unbroken 360° cylinder or equirectangular sphere, every adjacent image must share 25% to 35% common visual detail. With your ${selectedLens.brand} ${selectedLens.model} (${results.horizontalFovDeg}° HFOV), ${results.shotsPerCircle} horizontal positions provide ${results.overlapPct}% overlap, which is the golden zone for control-point generation.`,
      proTip:
        'Always shoot clockwise in the field so you can predict where light sources fall. When you rotate through 0° → 90° → 180° → 270°, listen for the physical rotator click stop before pressing the shutter.',
      mistakeToAvoid:
        'Rotating freehand without a click rotator or guessing angles. Irregular overlap drops below 15% in featureless walls or plain ceilings, causing PTGui and Lightroom to fail alignment.',
      gearContext: isFisheye
        ? `Because ${selectedLens.model} is a fisheye lens, its curved field of view enables capturing the entire 360° circle in just ${results.shotsPerCircle} shots with generous vertical coverage.`
        : `Because this is a rectilinear lens (${Math.round(results.effectiveFocalLengthMm)}mm equiv), multiple shots (${results.shotsPerCircle} around) are required to avoid edge stretching while ensuring sufficient keypoints.`,
      stitchAdvice:
        'In PTGui or Hugin, align with "Heavy Overlap" mode. Notice that the nadir and zenith will blend cleanest when the 4 or 6 perimeter frames are shot with consistent angular spacing.',
    },
    aperture: {
      title: 'Aperture Sweet Spot & Edge-to-Edge Sharpness',
      badge: `${results.recommendedApertureString} (Diffraction: ${results.diffractionStatus})`,
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      calculatedValue: results.recommendedApertureString,
      calculatedLabel: 'Diffraction-Safe Sweet Spot',
      why360: `Unlike standard portraits where background blur is desirable, 360° virtual tours require tack-sharp focus from the nearest table leg to the farthest wall. We recommend ${results.recommendedApertureString} because it balances maximum depth of field with the diffraction limit of ${selectedCamera.model}'s ${selectedCamera.pixelPitchUm}μm pixel pitch.`,
      proTip:
        `Resist the temptation to shoot at f/16 or f/22. On high-density digital sensors (${selectedCamera.megapixels} MP), optical diffraction (Airy disk blur ~${results.airyDiskDiameterUm}μm) softens microscopic details across the entire image. Stick between f/5.6 and f/9.0.`,
      mistakeToAvoid:
        'Shooting wide open (e.g. f/2.8 or f/3.5). While fast, wide apertures suffer from corner vignette falloff and soft perimeter edges, making the overlap stitching seams visibly blurry.',
      gearContext: `Tested sweet spot profile for ${selectedLens.model}: peak center and edge MTF resolution occurs between ${selectedLens.sweetSpotAperture || 'f/5.6 - f/8'}.`,
      stitchAdvice:
        'Matching aperture across all frames keeps lens vignetting and optical falloff uniform, allowing automated blender algorithms to eliminate seam lines completely.',
    },
    nodal_point: {
      title: 'No-Parallax Point (NPP) & Rail Calibration',
      badge: `Upper Rail: ${formatDualMm(nppVal)}`,
      icon: <Crosshair className="w-5 h-5 text-amber-400" />,
      calculatedValue: formatDualMm(nppVal),
      calculatedLabel: 'Entrance Pupil (NPP) Rail Mark',
      why360:
        'When your camera rotates on a standard tripod head, nearby objects (like a doorframe or table) shift position relative to the background wallpaper. This angular shift is called parallax error and makes clean stitching impossible. Setting the upper rail to the lens Entrance Pupil ensures the optical center remains stationary during rotation.',
      proTip:
        'To verify your NPP in 60 seconds: align a vertical window mullion with a tree branch 20 feet away. Pan the camera left to right through the viewfinder. If the branch moves behind the mullion, slide the upper rail forward or backward until they remain locked together.',
      mistakeToAvoid:
        'Using the camera tripod socket as the pivot point. The tripod mount is located 30mm to 80mm behind the optical entrance pupil, which introduces severe stitching seams whenever indoor objects are closer than 2 meters.',
      gearContext: `For ${selectedPanoHead.brand} ${selectedPanoHead.model} paired with ${selectedLens.model}, slide the upper rail front stop to ${formatDualMm(nppVal)}.`,
      stitchAdvice:
        'When the NPP is calibrated within ±1.5mm, PTGui control point distance errors drop under 1.2 pixels, producing zero ghosting on parquet floors and door frames.',
    },
    focus: {
      title: 'Focus Strategy & Manual Ring Locking',
      badge: `Focus Ring: ~${formatDualDistance(results.focusDistanceM, 1)} (Hyperfocal: ${formatDualDistance(results.hyperfocalDistanceM, 1)})`,
      icon: <Focus className="w-5 h-5 text-sky-400" />,
      calculatedValue: `~${formatDualDistance(results.focusDistanceM, 1)}`,
      calculatedLabel: 'Hyperfocal Safe Distance',
      why360:
        'Auto-Focus (AF) is the #1 destroyer of 360° panoramas. If AF hunts between shots, one frame will focus on a close wall while the next focuses on infinity, causing catastrophic seam blurring and alignment errors. Setting Manual Focus at the hyperfocal distance ensures everything from near foreground to infinity is sharp.',
      proTip:
        'Use Live View 10x digital zoom to manually focus on a high-contrast object approximately 1.2m to 2.0m away. Once sharp, switch the lens barrel switch to MF (Manual Focus) and apply a small piece of blue painters tape across the focus ring so it cannot accidentally turn.',
      mistakeToAvoid:
        'Focusing directly on infinity (∞). Focusing on infinity wastes 50% of your forward depth of field, rendering foreground floors, rugs, and interior furniture soft.',
      gearContext: `With ${selectedLens.model} at ${results.recommendedApertureString}, your hyperfocal near limit starts at ${formatDualDistance(results.hyperfocalNearLimitM, 2)} and carries all the way to infinity.`,
      stitchAdvice:
        'Uniform sharpness across all 360° tiles allows seam blend algorithms to transition seamlessly without resolution jumps.',
    },
    shutter: {
      title: 'Shutter Speed & Vibration Mitigation',
      badge: `${results.recommendedShutterSpeed} · ${tripodOn ? 'Tripod Mode (Locked)' : 'Handheld'}`,
      icon: <Camera className="w-5 h-5 text-emerald-400" />,
      calculatedValue: results.recommendedShutterSpeed,
      calculatedLabel: 'Base Scene Shutter Speed',
      why360:
        'Every single frame in the 360° sphere must have identical exposure. In Manual (M) mode, the shutter speed is locked at a fixed duration so exposure does not change when the lens points toward a sunny window versus a dark room corner.',
      proTip:
        'Always use a 2-second self-timer delay or a wireless shutter remote. Even touching the shutter button with your finger transmits micro-vibrations through the tripod that cause noticeable softness on 24MP+ cameras.',
      mistakeToAvoid:
        'Leaving Image Stabilization (IBIS or Optical IS) turned ON while mounted on a solid tripod. Stabilization gyros try to correct phantom movements on a rigid tripod, creating micro-jitter blur during 1/15s to 2s exposures.',
      gearContext: selectedCamera.mirrorLockUp
        ? `${selectedCamera.model} is a DSLR with reflex mirror: enable Mirror Lock-Up (MLU) or Electronic Front Curtain Shutter (EFCS) to prevent mirror slap vibration.`
        : `${selectedCamera.model} is mirrorless: electronic shutter / EFCS provides silent, completely vibration-free capture.`,
      stitchAdvice:
        'Locked shutter speed guarantees that all 4-8 perimeter frames blend with uniform tonal luminosity in PTGui without exposure seams.',
    },
    iso: {
      title: 'ISO Sensitivity & Clean Shadow Recovery',
      badge: `Base ISO ${results.recommendedIso} (Max Dynamic Range)`,
      icon: <Sun className="w-5 h-5 text-sky-400" />,
      calculatedValue: `ISO ${results.recommendedIso}`,
      calculatedLabel: 'Native Sensor Base ISO',
      why360:
        `Your camera's native base ISO (${results.recommendedIso}) yields the cleanest shadow detail, lowest digital noise, and highest dynamic range (~${selectedCamera.dynamicRangeEv || 13} EV). Because panoramic photography is executed on a rigid tripod, there is no need to raise ISO; you can comfortably let the shutter stay open longer.`,
      proTip:
        'Never set ISO to Auto (A-ISO). If one shot is taken at ISO 100 facing a window and the next shot increases to ISO 800 facing a closet, noise levels and color grain will clash across the stitched panorama.',
      mistakeToAvoid:
        'Using Extended Low ISO (e.g. ISO 50 on some cameras) thinking it is cleaner. Extended low ISO actually compresses highlight headroom, causing sunny windows to clip earlier.',
      gearContext: `${selectedCamera.brand} ${selectedCamera.model} features a high-fidelity ${selectedCamera.sensorFormat} sensor optimized for clean base ISO performance.`,
      stitchAdvice:
        'Low noise at base ISO ensures that automated keypoint extractors (SIFT/SURF) find crisp corner points instead of mistaking digital noise pixels for features.',
    },
    aeb_hdr: {
      title: 'HDR Auto-Exposure Bracketing (AEB) Strategy',
      badge: results.aebRecommended
        ? `${results.aebFrames} Frames @ ±${results.aebEvStep} EV (${results.totalRawShotsWithBracketing} RAWs)`
        : 'Single Exposure Mode',
      icon: <Layers className="w-5 h-5 text-purple-400" />,
      calculatedValue: results.aebRecommended
        ? `${results.aebFrames}× AEB (±${results.aebEvStep} EV)`
        : 'Single Shot (SDR)',
      calculatedLabel: 'Dynamic Range Protocol',
      why360:
        `Real-world 360° scenes often encompass a 16+ EV brightness difference between sunny outdoor windows and shadowed under-bed corners. ${results.aebRecommended ? `Our algorithm detected high dynamic range in ${selectedScenario.name}, requiring a ${results.aebFrames}-shot bracket sequence to expand dynamic range to ${results.totalDynamicRangeStops} stops.` : 'Scene contrast is moderate; single exposure is sufficient.'}`,
      proTip:
        'Set your camera drive mode to Continuous High Bracketing. When you press the shutter (with 2s timer or remote), the camera rapidly fires all 3 exposures in under 1.5 seconds without you needing to touch the camera between exposures.',
      mistakeToAvoid:
        'Bracketing with aperture instead of shutter speed! Ensure your camera brackets exclusively via shutter speed. Changing aperture between bracket frames changes depth of field and Airy disk size, which ruins HDR tone-mapping.',
      gearContext: `Total RAW tour files to capture: ${results.shotsPerCircle} positions × ${results.aebRecommended ? results.aebFrames : 1} bracketed frames = ${results.totalRawShotsWithBracketing} RAW files.`,
      stitchAdvice:
        'In PTGui Pro, load all RAW files and check "Align and Blend HDR Brackets". PTGui will automatically group the 3 frames per rotation position and fuse them into a 32-bit HDR panorama.',
    },
    white_balance: {
      title: 'White Balance Lock & Color Consistency',
      badge: `Locked WB: ${results.whiteBalance}`,
      icon: <Lock className="w-5 h-5 text-amber-400" />,
      calculatedValue: results.whiteBalance,
      calculatedLabel: 'Preset Kelvin / Profile',
      why360:
        'Auto White Balance (AWB) evaluates each shot individually. If shot 1 faces cool daylight from a window and shot 2 faces warm incandescent light from a lamp, AWB will shift the color temperature between shots. This produces unsightly rainbow discoloration and color seam bands across walls.',
      proTip:
        'Lock WB to a fixed preset like "Daylight (5500K)" or "Tungsten (3200K)" depending on your dominant light source. If shooting in RAW, you can also set a single Kelvin value (e.g. 4500K) and batch-apply it across all frames in Lightroom prior to stitching.',
      mistakeToAvoid:
        'Leaving Auto White Balance (AWB) on during rotation. Even with RAW files, AWB tags each file with different Kelvin temperatures, requiring manual normalization in post.',
      gearContext: `Recommended for ${selectedScenario.name}: "${results.whiteBalance}" locks color temperature across all ${results.shotsPerCircle} shots.`,
      stitchAdvice:
        'Identical white balance across all tiles ensures that color matching algorithms do not need to apply aggressive chromatic gradients at seam borders.',
    },
  };

  const activeTip = tipsData[activeKey];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden relative">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm shrink-0">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  360° Panoramic Optimization Tips
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  Context-Aware Field Guide
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculated advice tailored for <strong className="text-slate-200">{selectedCamera.model}</strong> + <strong className="text-slate-200">{selectedLens.model}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700"
            title="Close Optimization Tips"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Sidebar Categories + Content Details */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Left Categories List */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800 p-3 bg-slate-950/60 overflow-x-auto md:overflow-y-auto flex md:flex-col gap-1.5 shrink-0 scrollbar-thin">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold px-2 py-1 hidden md:block">
              Calculation Parameters:
            </div>
            {(Object.keys(tipsData) as TipCategoryKey[]).map((key) => {
              const item = tipsData[key];
              const isSelected = activeKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveKey(key)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left shrink-0 md:shrink ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <div className={`shrink-0 ${isSelected ? 'text-slate-950' : ''}`}>
                    {item.icon}
                  </div>
                  <div className="truncate">
                    <span className="block truncate">{item.title.split('&')[0].trim()}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Active Tip Details */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col gap-5 bg-slate-900/50">
            {/* Top Stat Banner */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  {activeTip.icon}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">
                    {activeTip.calculatedLabel}
                  </span>
                  <div className="text-lg sm:text-xl font-black text-amber-400 font-mono mt-0.5">
                    {activeTip.calculatedValue}
                  </div>
                </div>
              </div>

              <div className="text-right self-end sm:self-auto">
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold inline-block">
                  {activeTip.badge}
                </span>
              </div>
            </div>

            {/* Why This Setting Matters in 360° Panoramas */}
            <div className="flex flex-col gap-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Why This Matters for 360° Virtual Tours</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                {activeTip.why360}
              </p>
            </div>

            {/* Pro Tip & Common Mistake 2-Column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Field Pro-Tip */}
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wide">
                  <CheckCircle className="w-4 h-4" />
                  <span>Field Pro-Tip</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeTip.proTip}
                </p>
              </div>

              {/* Common Beginner Mistake */}
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wide">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Mistake to Avoid</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeTip.mistakeToAvoid}
                </p>
              </div>
            </div>

            {/* Gear-Specific Context */}
            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400 leading-relaxed">
              <Camera className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200 block mb-0.5">Hardware Context:</strong>
                <span>{activeTip.gearContext}</span>
              </div>
            </div>

            {/* Stitching Software Advice (PTGui / Lightroom) */}
            <div className="p-3.5 rounded-xl bg-sky-950/20 border border-sky-500/30 flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
              <Layers className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-sky-300 block mb-0.5">Post-Processing & PTGui Integration:</strong>
                <span>{activeTip.stitchAdvice}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Rig: {selectedCamera.brand} {selectedCamera.model} + {selectedLens.brand} {selectedLens.model}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm ml-auto"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
