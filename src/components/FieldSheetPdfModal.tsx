import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import * as htmlToImage from 'html-to-image';
import {
  CameraSpec,
  LensSpec,
  OpticalCalculationResults,
  PanoHeadSpec,
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
  FileDown,
  Loader2,
  Layout,
  Check,
} from 'lucide-react';

interface FieldSheetPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  camera: CameraSpec;
  lens: LensSpec;
  panoHeadName: string;
  panoHead?: PanoHeadSpec;
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
  panoHead,
  upperRailMm,
  lowerRailMm,
  subjectDistanceM,
  results,
  shotsPerCircle,
  rigTitle,
  notes,
}) => {
  const [printTheme, setPrintTheme] = useState<'light' | 'dark'>('light');
  const [pageSetupMode, setPageSetupMode] = useState<'fit_one_page' | 'multi_page'>('fit_one_page');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfNotification, setPdfNotification] = useState<string | null>(null);

  const singlePageRef = useRef<HTMLDivElement>(null);
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);

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

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfNotification('Rendering high-resolution PDF...');

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 8;
      const availWidth = pageWidth - margin * 2; // 194 mm
      const availHeight = pageHeight - margin * 2; // 281 mm

      if (pageSetupMode === 'fit_one_page') {
        const element = singlePageRef.current;
        if (!element) throw new Error('Preview element not ready');

        // Render crisp 2x retina image using browser native layout engine without shadow distortion
        const dataUrl = await htmlToImage.toPng(element, {
          quality: 0.98,
          pixelRatio: 2,
          backgroundColor: printTheme === 'light' ? '#ffffff' : '#0f172a',
          cacheBust: true,
          skipFonts: true,
          style: {
            boxShadow: 'none',
            margin: '0',
            transform: 'none',
          },
        });

        const img = new Image();
        img.src = dataUrl;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load rendered image'));
        });

        const imgAspect = img.height / img.width;
        let renderWidth = availWidth;
        let renderHeight = renderWidth * imgAspect;

        // Fit proportionally inside Page 1 height so NOTHING spills onto page 2
        if (renderHeight > availHeight) {
          const scale = availHeight / renderHeight;
          renderWidth = renderWidth * scale;
          renderHeight = availHeight;
        }

        // Mathematical centering horizontally and vertically on A4 page
        const xOffset = (pageWidth - renderWidth) / 2;
        const yOffset = (pageHeight - renderHeight) / 2;

        pdf.addImage(dataUrl, 'PNG', xOffset, yOffset, renderWidth, renderHeight, undefined, 'FAST');

        const filename = `PanoOptix_Field_Sheet_${camera.model.replace(/\s+/g, '_')}_${lens.model.replace(/\s+/g, '_')}.pdf`;
        pdf.save(filename);
        setPdfNotification('1-Page PDF downloaded successfully!');
      } else {
        // Multi-Page (2 Clean Dedicated Pages)
        const el1 = page1Ref.current;
        const el2 = page2Ref.current;
        if (!el1 || !el2) throw new Error('Multi-page elements not ready');

        const [dataUrl1, dataUrl2] = await Promise.all([
          htmlToImage.toPng(el1, {
            quality: 0.98,
            pixelRatio: 2,
            backgroundColor: printTheme === 'light' ? '#ffffff' : '#0f172a',
            cacheBust: true,
            skipFonts: true,
            style: {
              boxShadow: 'none',
              margin: '0',
              transform: 'none',
            },
          }),
          htmlToImage.toPng(el2, {
            quality: 0.98,
            pixelRatio: 2,
            backgroundColor: printTheme === 'light' ? '#ffffff' : '#0f172a',
            cacheBust: true,
            skipFonts: true,
            style: {
              boxShadow: 'none',
              margin: '0',
              transform: 'none',
            },
          }),
        ]);

        // Page 1: Hardware & Calibration
        const img1 = new Image();
        img1.src = dataUrl1;
        await new Promise<void>((r) => { img1.onload = () => r(); });
        let w1 = availWidth;
        let h1 = w1 * (img1.height / img1.width);
        if (h1 > availHeight) {
          const s = availHeight / h1;
          w1 *= s;
          h1 = availHeight;
        }
        pdf.addImage(dataUrl1, 'PNG', (pageWidth - w1) / 2, (pageHeight - h1) / 2, w1, h1, undefined, 'FAST');

        // Page 2: Optical, Exposure & Checklist
        pdf.addPage();
        const img2 = new Image();
        img2.src = dataUrl2;
        await new Promise<void>((r) => { img2.onload = () => r(); });
        let w2 = availWidth;
        let h2 = w2 * (img2.height / img2.width);
        if (h2 > availHeight) {
          const s = availHeight / h2;
          w2 *= s;
          h2 = availHeight;
        }
        pdf.addImage(dataUrl2, 'PNG', (pageWidth - w2) / 2, (pageHeight - h2) / 2, w2, h2, undefined, 'FAST');

        const filename = `PanoOptix_Field_Sheet_${camera.model.replace(/\s+/g, '_')}_${lens.model.replace(/\s+/g, '_')}_2Pages.pdf`;
        pdf.save(filename);
        setPdfNotification('2-Page PDF downloaded successfully!');
      }

      setTimeout(() => setPdfNotification(null), 3500);
    } catch (err: any) {
      console.error('Failed to generate PDF file directly', err);
      setPdfNotification(`Direct PDF error: ${err?.message || 'Rendering failed'}. Opening browser print dialog...`);
      setTimeout(() => {
        window.print();
        setPdfNotification(null);
      }, 1500);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadHtml = () => {
    const activeEl = pageSetupMode === 'fit_one_page' ? singlePageRef.current : page1Ref.current;
    if (!activeEl) return;
    const content = activeEl.innerHTML;
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PanoOptix Field Sheet - ${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #ffffff; color: #0f172a; padding: 24px; line-height: 1.4; }
    .print-container { max-width: 820px; margin: 0 auto; }
  </style>
</head>
<body class="bg-slate-100 p-6 flex justify-center">
  <div class="print-container w-full">
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

  // Reusable Component: Demographic Header Banner
  const renderHeaderBanner = (isPage2 = false) => (
    <div className={`border-b pb-3 mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
      printTheme === 'light' ? 'border-slate-300' : 'border-slate-800'
    }`}>
      <div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center text-white font-black text-xs shadow-sm">
            P
          </div>
          <span className="text-[10px] font-mono font-black tracking-wider uppercase text-amber-600">
            PanoOptix™ Pro Field Specification {isPage2 ? '· Section B: Field Execution' : ''}
          </span>
        </div>
        <h1 className="text-lg sm:text-xl font-black mt-0.5 tracking-tight">
          {title}
        </h1>
        <p className={`text-[11px] mt-0.5 ${printTheme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
          Standard Field Reference Sheet · Created by <strong className="text-amber-600">Gazaly Samsadeen</strong> · Generated {currentDate} {isPage2 ? '(Page 2 of 2)' : ''}
        </p>
      </div>

      {/* Quick Spec Demographic Pill */}
      <div className={`p-2 rounded-xl border text-right text-xs shrink-0 ${
        printTheme === 'light' ? 'bg-amber-50/80 border-amber-200 text-slate-800' : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
      }`}>
        <div className="font-mono font-black text-xs sm:text-sm text-amber-600">
          {shotsPerCircle} Shots · {rotationAngle}° Click
        </div>
        <div className="text-[10px] font-medium mt-0.5">
          Overlap: <strong>{results.overlapPct}%</strong> · NPP: <strong>{formatDualMm(upperRailMm)}</strong>
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">
          Default Distance: <strong>{formatDualDistance(subjectDistanceM)}</strong>
        </div>
      </div>
    </div>
  );

  // Reusable Component: Hardware Specs (Camera + Lens)
  const renderHardwareSpecs = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
      {/* Section 1: Camera & Sensor Demographic */}
      <div className={`p-3 rounded-xl border flex flex-col gap-1.5 ${
        printTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
      }`}>
        <div className="flex items-center gap-1.5 border-b pb-1.5 border-slate-200 dark:border-slate-800">
          <Camera className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Camera & Sensor Demographic
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
          <div>
            <span className="text-[9px] uppercase font-mono text-slate-500 block">Camera Model</span>
            <span className="font-bold">{camera.brand} {camera.model}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono text-slate-500 block">Sensor Format</span>
            <span className="font-bold">{camera.sensorFormat}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono text-slate-500 block">Physical Dimensions</span>
            <span className="font-mono text-[10px] font-semibold">
              {formatDualDimensions(camera.sensorWidthMm, camera.sensorHeightMm)}
            </span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono text-slate-500 block">Crop Factor</span>
            <span className="font-bold">{camera.cropFactor.toFixed(1)}x</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono text-slate-500 block">Resolution</span>
            <span className="font-semibold">{camera.megapixels} MP ({camera.nativeResolution[0]} × {camera.nativeResolution[1]})</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono text-slate-500 block">Pixel Pitch</span>
            <span className="font-mono font-semibold">{results.pixelPitchUm.toFixed(2)} µm</span>
          </div>
        </div>
      </div>

      {/* Section 2: Lens & Optical Demographic */}
      <div className={`p-3 rounded-xl border flex flex-col gap-1.5 ${
        printTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
      }`}>
        <div className="flex items-center gap-1.5 border-b pb-1.5 border-slate-200 dark:border-slate-800">
          <Layers className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Lens & Optical Demographic
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
          <div>
            <span className="text-[9px] uppercase font-mono text-slate-500 block">Lens Model</span>
            <span className="font-bold">{lens.brand} {lens.model}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono text-slate-500 block">Focal Length</span>
            <span className="font-bold">{formatDualMm(results.effectiveFocalLengthMm / camera.cropFactor)}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono text-slate-500 block">Projection Type</span>
            <span className="font-semibold capitalize">{lens.projectionType.replace(/_/g, ' ')}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono text-slate-500 block">Field of View (H × V)</span>
            <span className="font-mono font-bold text-amber-600">
              {results.horizontalFovDeg}° × {results.verticalFovDeg}°
            </span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono text-slate-500 block">Lens Mount</span>
            <span className="font-semibold">{lens.lensMount}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono text-slate-500 block">Orientation</span>
            <span className="font-bold text-emerald-600">Portrait (Vertical)</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Reusable Component: Panoramic Head & Rail Calibration
  const renderPanoHeadRails = () => (
    <div className={`p-3.5 rounded-xl border mb-3 ${
      printTheme === 'light' ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-950/10 border-amber-500/20'
    }`}>
      <div className="flex items-center justify-between border-b pb-1.5 border-slate-200 dark:border-slate-800 mb-2">
        <div className="flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Panoramic Head & Rail Calibration ({panoHead?.brand ? `${panoHead.brand} ${panoHead.model}` : panoHeadName})
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold text-amber-600">
          {panoHead ? `${panoHead.type} · ${panoHead.loadCapacity}` : 'Dual Standard Metrics'}
        </span>
      </div>

      {panoHead && (
        <div className={`mb-2.5 p-2 rounded-lg border text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 ${
          printTheme === 'light' ? 'bg-white/80 border-amber-200 text-slate-700' : 'bg-slate-900/80 border-slate-800 text-slate-300'
        }`}>
          <div>
            <span className="font-bold text-amber-600 mr-1.5">Rotator Detent System:</span>
            <span>{panoHead.rotatorDetentOptions}</span>
          </div>
          <div className="shrink-0 text-[10px] font-mono">
            <span className="text-slate-500 mr-1">Setup:</span>
            <span className="font-semibold">{panoHead.setupMethod}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        {/* Upper Rail Setting */}
        <div className={`p-2.5 rounded-lg border ${
          printTheme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <span className="text-[9px] font-mono uppercase text-slate-500 block">Upper Rail (Entrance Pupil / NPP)</span>
          <span className="text-base font-black font-mono text-amber-600 block mt-0.5">
            {formatDualMm(upperRailMm)}
          </span>
          <span className="text-[9px] text-slate-500 block mt-0.5">
            Align front index to eliminate parallax
          </span>
        </div>

        {/* Lower Rail Setting */}
        <div className={`p-2.5 rounded-lg border ${
          printTheme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <span className="text-[9px] font-mono uppercase text-slate-500 block">Lower Rail (Optical Axis Center)</span>
          <span className="text-base font-black font-mono text-sky-600 block mt-0.5">
            {formatDualMm(lowerRailMm)}
          </span>
          <span className="text-[9px] text-slate-500 block mt-0.5">
            Centers lens centerline over rotator base
          </span>
        </div>

        {/* Rotator Detent Setting */}
        <div className={`p-2.5 rounded-lg border ${
          printTheme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <span className="text-[9px] font-mono uppercase text-slate-500 block">Rotator Detent Ring Stop</span>
          <span className="text-base font-black font-mono text-emerald-600 block mt-0.5">
            {rotationAngle}° ({shotsPerCircle} shots)
          </span>
          <span className="text-[9px] text-slate-500 block mt-0.5">
            Yields {results.overlapPct}% stitching overlap
          </span>
        </div>
      </div>

      {/* Graphic Rail Visualizer Line */}
      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono">
        <span className="text-slate-500">Rail Calibrator Gauge:</span>
        <span className="font-bold">Upper Rail: [{upperRailMm}mm / {mmToInches(upperRailMm).toFixed(2)}"]</span>
        <span className="text-slate-400">·</span>
        <span className="font-bold">Lower Rail: [{lowerRailMm}mm / {mmToInches(lowerRailMm).toFixed(2)}"]</span>
      </div>
    </div>
  );

  // Reusable Component: 360 Rotation Compass
  const renderCompassDetents = () => (
    <div className={`p-3.5 rounded-xl border mb-3 ${
      printTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
    }`}>
      <div className="flex items-center justify-between border-b pb-1.5 border-slate-200 dark:border-slate-800 mb-2">
        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider">
            360° Rotation Compass & Detent Sequence ({shotsPerCircle} Shots Around)
          </span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
          results.overlapPct >= 25 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
        }`}>
          {results.overlapPct}% Overlap · {results.overlapPct >= 25 ? 'Optimal Margin' : 'Tight Margin'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs">
        {detentAngles.map((angle, idx) => (
          <div
            key={idx}
            className={`p-1.5 rounded-lg border text-center font-mono ${
              printTheme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="text-[9px] text-slate-500 font-sans">Shot {idx + 1}</div>
            <div className="text-xs sm:text-sm font-black text-amber-600">{angle}°</div>
            <div className="text-[9px] text-slate-400 mt-0.5">
              {idx === 0 ? 'Front (0°)' : idx === Math.floor(shotsPerCircle / 4) ? 'Right (90°)' : idx === Math.floor(shotsPerCircle / 2) ? 'Back (180°)' : `${angle}°`}
            </div>
          </div>
        ))}

        {/* Zenith & Nadir */}
        <div className={`p-1.5 rounded-lg border text-center font-mono ${
          printTheme === 'light' ? 'bg-sky-50 border-sky-200' : 'bg-sky-950/40 border-sky-800'
        }`}>
          <div className="text-[9px] text-slate-500 font-sans">Cap Shot</div>
          <div className="text-xs sm:text-sm font-black text-sky-600">+90°</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Zenith (Up)</div>
        </div>

        <div className={`p-1.5 rounded-lg border text-center font-mono ${
          printTheme === 'light' ? 'bg-indigo-50 border-indigo-200' : 'bg-indigo-950/40 border-indigo-800'
        }`}>
          <div className="text-[9px] text-slate-500 font-sans">Floor Shot</div>
          <div className="text-xs sm:text-sm font-black text-indigo-600">-90°</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Nadir (Down)</div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-200 dark:border-slate-800">
        <span>Total Frames: <strong>{shotsPerCircle + 2} shots</strong></span>
        <span>Side rotation step: <strong>{rotationAngle}°</strong></span>
        <span>Detent clicks: <strong>{detentAngles.join('° → ')}°</strong></span>
      </div>
    </div>
  );

  // Reusable Component: Focus & Exposure
  const renderFocusAndExposure = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
      {/* Focus & Depth of Field */}
      <div className={`p-3 rounded-xl border flex flex-col gap-1.5 ${
        printTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
      }`}>
        <div className="flex items-center gap-1.5 border-b pb-1.5 border-slate-200 dark:border-slate-800">
          <Crosshair className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Focus Distance & Depth of Field (Dual Units)
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
          <div>
            <span className="text-[9px] uppercase font-mono text-slate-500 block">Default Room Distance</span>
            <span className="font-bold text-amber-600">{formatDualDistance(subjectDistanceM)}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono text-slate-500 block">Recommended Focus Mark</span>
            <span className="font-bold">{formatDualDistance(results.recommendedFocusDistanceM)}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono text-slate-500 block">Hyperfocal Distance (H)</span>
            <span className="font-bold font-mono">{formatDualDistance(results.hyperfocalDistanceM)}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono text-slate-500 block">Sharp Foreground Limit</span>
            <span className="font-bold text-emerald-600 font-mono">
              {formatDualDistance(results.hyperfocalNearLimitM)}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-[9px] uppercase font-mono text-slate-500 block">Total Sharp Zone</span>
            <span className="font-semibold">
              {formatDualDistance(results.hyperfocalNearLimitM)} to Infinity (∞)
            </span>
          </div>
        </div>
      </div>

      {/* Exposure & AEB Bracketing */}
      <div className={`p-3 rounded-xl border flex flex-col gap-1.5 ${
        printTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
      }`}>
        <div className="flex items-center gap-1.5 border-b pb-1.5 border-slate-200 dark:border-slate-800">
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Exposure & AEB Bracketing Plan
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
          <div>
            <span className="text-[9px] uppercase font-mono text-slate-500 block">Aperture (Sweet Spot)</span>
            <span className="font-black text-amber-600">{results.recommendedApertureString}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono text-slate-500 block">Baseline Shutter Speed</span>
            <span className="font-bold">{results.recommendedShutterSpeed}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono text-slate-500 block">ISO Sensitivity</span>
            <span className="font-bold">ISO {results.recommendedIso}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono text-slate-500 block">White Balance</span>
            <span className="font-semibold">{results.whiteBalance}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono text-slate-500 block">AEB Bracket Strategy</span>
            <span className="font-bold text-sky-600">
              {results.aebRecommended ? `${results.aebFrames} Frames @ ±${results.aebEvStep} EV` : 'Single Exposure'}
            </span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono text-slate-500 block">Total Dynamic Range</span>
            <span className="font-bold">{results.totalDynamicRangeStops} EV Stops</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Reusable Component: Checklist & Sign-off
  const renderChecklistAndSignoff = () => (
    <>
      {/* Section 6: Pre-Flight Field Checklist */}
      <div className={`p-3 rounded-xl border mb-3 ${
        printTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
      }`}>
        <div className="flex items-center gap-1.5 border-b pb-1.5 border-slate-200 dark:border-slate-800 mb-2">
          <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Pre-Flight Field Checklist
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-start gap-1.5">
            <input type="checkbox" className="mt-0.5 rounded border-slate-400" />
            <span>1. Level tripod base using integrated spirit bubble within 0.5°.</span>
          </div>
          <div className="flex items-start gap-1.5">
            <input type="checkbox" className="mt-0.5 rounded border-slate-400" />
            <span>2. Set upper rail to <strong>{formatDualMm(upperRailMm)}</strong> & lower rail to <strong>{formatDualMm(lowerRailMm)}</strong>.</span>
          </div>
          <div className="flex items-start gap-1.5">
            <input type="checkbox" className="mt-0.5 rounded border-slate-400" />
            <span>3. Switch lens AF to <strong>Manual Focus (MF)</strong>; lock focus ring.</span>
          </div>
          <div className="flex items-start gap-1.5">
            <input type="checkbox" className="mt-0.5 rounded border-slate-400" />
            <span>4. Lock camera to <strong>Manual Exposure (M)</strong>; fixed White Balance.</span>
          </div>
          <div className="flex items-start gap-1.5">
            <input type="checkbox" className="mt-0.5 rounded border-slate-400" />
            <span>5. Turn camera/lens image stabilization (IS/VR/IBIS) <strong>OFF</strong>.</span>
          </div>
          <div className="flex items-start gap-1.5">
            <input type="checkbox" className="mt-0.5 rounded border-slate-400" />
            <span>6. Rotate through all {shotsPerCircle} detents ({rotationAngle}°) cleanly.</span>
          </div>
        </div>
      </div>

      {/* Footer Sign-off */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-1 text-[9px] text-slate-500 font-mono">
        <span>PanoOptix Optical Verification System · Field Spec ID: #{camera.id.toUpperCase()}-{shotsPerCircle}S</span>
        <span>Lead Optical Architect: <strong className="text-amber-600">Gazaly Samsadeen</strong></span>
        <span>Photographer Sign-off: __________________________</span>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Top Control Bar (Hidden in Print) */}
        <div className="no-print flex items-center justify-between p-3.5 bg-slate-950 border-b border-slate-800 shrink-0 flex-wrap gap-2.5">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Printable Field Specification Sheet</h2>
                {pdfNotification && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {pdfNotification}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Visual demographic datasheet with dual metric & imperial measurements.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Page Setup Toggle: Fit 1 Page vs 2 Pages */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setPageSetupMode('fit_one_page')}
                className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                  pageSetupMode === 'fit_one_page' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Fit all specifications perfectly on 1 single A4 page without cutoffs"
              >
                <span>Fit 1 Page</span>
                <span className="text-[9px] opacity-75">(Standard)</span>
              </button>
              <button
                type="button"
                onClick={() => setPageSetupMode('multi_page')}
                className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                  pageSetupMode === 'multi_page' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Format across 2 spacious pages with dedicated sections"
              >
                <span>2 Pages</span>
              </button>
            </div>

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

            {/* Direct PDF Download Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-black transition shadow-md"
              title="Download high-resolution .PDF file directly to your device"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-slate-950" />
                  <span>Download PDF (.pdf)</span>
                </>
              )}
            </button>

            {/* HTML Download Button */}
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
              title="Download standalone offline HTML file"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">HTML</span>
            </button>

            {/* Browser Print Dialog */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
              title="Open browser system print dialog"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/60">
          {/* ========================================================================= */}
          {/* OPTION 1: 1-PAGE COMPACT FIT (Recommended - Fits 100% on Page 1)          */}
          {/* ========================================================================= */}
          {pageSetupMode === 'fit_one_page' && (
            <div
              id="pano-printable-field-sheet"
              ref={singlePageRef}
              className={`max-w-3xl mx-auto rounded-xl border p-4 sm:p-5 shadow-xl transition font-sans ${
                printTheme === 'light'
                  ? 'bg-white text-slate-900 border-slate-300'
                  : 'bg-slate-900 text-slate-100 border-slate-800'
              }`}
            >
              {renderHeaderBanner(false)}
              {renderHardwareSpecs()}
              {renderPanoHeadRails()}
              {renderCompassDetents()}
              {renderFocusAndExposure()}
              {renderChecklistAndSignoff()}
            </div>
          )}

          {/* ========================================================================= */}
          {/* OPTION 2: 2-PAGE DEDICATED LAYOUT (No cards cut in half!)                 */}
          {/* ========================================================================= */}
          {pageSetupMode === 'multi_page' && (
            <div className="flex flex-col gap-6 max-w-3xl mx-auto">
              {/* Page 1: Equipment Specs & Panoramic Head Alignment */}
              <div
                ref={page1Ref}
                className={`rounded-xl border p-5 sm:p-6 shadow-xl transition font-sans ${
                  printTheme === 'light'
                    ? 'bg-white text-slate-900 border-slate-300'
                    : 'bg-slate-900 text-slate-100 border-slate-800'
                }`}
              >
                {renderHeaderBanner(false)}
                {renderHardwareSpecs()}
                {renderPanoHeadRails()}
                {renderCompassDetents()}

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>PanoOptix Optical Verification System</span>
                  <span>Page 1 of 2 · Equipment Calibration & Alignment</span>
                  <span>Lead Optical Architect: <strong className="text-amber-600">Gazaly Samsadeen</strong></span>
                </div>
              </div>

              {/* Visual Divider in Modal View */}
              <div className="no-print flex items-center justify-center gap-2 text-xs font-mono text-slate-500">
                <span className="w-16 h-px bg-slate-800"></span>
                <span>── Page 2 of 2 ──</span>
                <span className="w-16 h-px bg-slate-800"></span>
              </div>

              {/* Page 2: Optical Physics, Exposure Brackets, Field Checklist & Sign-Off */}
              <div
                ref={page2Ref}
                className={`rounded-xl border p-5 sm:p-6 shadow-xl transition font-sans ${
                  printTheme === 'light'
                    ? 'bg-white text-slate-900 border-slate-300'
                    : 'bg-slate-900 text-slate-100 border-slate-800'
                }`}
              >
                {renderHeaderBanner(true)}
                {renderFocusAndExposure()}
                {renderChecklistAndSignoff()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
