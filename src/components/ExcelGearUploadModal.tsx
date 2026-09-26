import React, { useState, useRef } from 'react';
import { usePanorama } from '../context/PanoramaContext';
import { CameraSpec, LensSpec } from '../types';
import { parseExcelGearFile, downloadSampleExcelTemplate, ParseExcelResult } from '../utils/excelGearParser';
import {
  FileSpreadsheet,
  Upload,
  Download,
  X,
  CheckCircle,
  AlertTriangle,
  Camera,
  Layers,
  ShieldCheck,
  UserCheck,
  Sparkles,
  ArrowRight,
  Info,
  RefreshCw,
} from 'lucide-react';

interface ExcelGearUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExcelGearUploadModal: React.FC<ExcelGearUploadModalProps> = ({ isOpen, onClose }) => {
  const { cameras, lenses, addCamera, addLens } = usePanorama();

  const [isCreatorMode, setIsCreatorMode] = useState<boolean>(true); // Gazaly Samsadeen
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<ParseExcelResult | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setIsProcessing(true);
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (buffer) {
          const result = parseExcelGearFile(buffer, cameras, lenses, isCreatorMode);
          setParseResult(result);
        }
      } catch (err: any) {
        setParseResult({
          newCameras: [],
          newLenses: [],
          skippedCameras: [],
          skippedLenses: [],
          errors: [err.message || 'Failed to read file. Please ensure it is a valid Excel (.xlsx, .xls) or CSV file.'],
        });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setIsProcessing(false);
      setParseResult({
        newCameras: [],
        newLenses: [],
        skippedCameras: [],
        skippedLenses: [],
        errors: ['File reading error.'],
      });
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult) return;

    // Add all non-existing cameras
    parseResult.newCameras.forEach((cam) => {
      addCamera(cam);
    });

    // Add all non-existing lenses
    parseResult.newLenses.forEach((lens) => {
      addLens(lens);
    });

    setImportSuccess(true);
    setTimeout(() => {
      setImportSuccess(false);
      onClose();
    }, 2500);
  };

  const handleReset = () => {
    setParseResult(null);
    setFileName('');
    setImportSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Import Equipment Database from Excel</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  .XLSX · .XLS · .CSV
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload your camera and lens spreadsheet. Existing models are automatically skipped to preserve calibration.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4">
          {/* Creator vs Visitor Role Switcher */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {isCreatorMode ? 'Gazaly Samsadeen (App Creator & Lead Architect)' : 'Visitor / Local User Mode'}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {isCreatorMode
                    ? 'Master Database Mode: Updates global gear database with verified manufacturer data.'
                    : 'Local Device Mode: Gear is imported into your local browser storage for current PC use only.'}
                </span>
              </div>
            </div>

            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setIsCreatorMode(true)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  isCreatorMode
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Gazaly (Creator)
              </button>
              <button
                type="button"
                onClick={() => setIsCreatorMode(false)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  !isCreatorMode
                    ? 'bg-sky-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Visitor (Local)
              </button>
            </div>
          </div>

          {/* Download Sample Template Banner */}
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-slate-300">
                Need the official Excel template? Download pre-formatted <strong className="text-amber-300">Cameras & Lenses</strong> columns.
              </span>
            </div>
            <button
              type="button"
              onClick={downloadSampleExcelTemplate}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition whitespace-nowrap text-xs shadow-sm flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Get Sample Excel</span>
            </button>
          </div>

          {/* Drag & Drop File Upload Zone */}
          {!parseResult && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-amber-400 bg-amber-500/10'
                  : 'border-slate-700 bg-slate-950/60 hover:border-slate-600 hover:bg-slate-950'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-sm">
                <Upload className="w-7 h-7" />
              </div>

              <div>
                <span className="text-sm font-bold text-white block">
                  Click to select your Excel file or drag & drop here
                </span>
                <span className="text-xs text-slate-400 block mt-1">
                  Supports Microsoft Excel (.xlsx, .xls) and CSV sheets
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-1">
                <span>✓ Auto-Deduplication</span>
                <span>•</span>
                <span>✓ Skip Existing Models</span>
                <span>•</span>
                <span>✓ Instant Verification</span>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
              <span className="text-xs font-mono">Analyzing Excel worksheets and mapping camera/lens specifications...</span>
            </div>
          )}

          {/* Parsed Result Summary */}
          {parseResult && (
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono text-slate-300 font-bold truncate max-w-[280px]">
                    {fileName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-white transition underline"
                >
                  Choose different file
                </button>
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/20">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">New Cameras</span>
                  <span className="text-xl font-bold font-mono text-emerald-400 mt-0.5 block">
                    +{parseResult.newCameras.length}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-sky-500/20">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">New Lenses</span>
                  <span className="text-xl font-bold font-mono text-sky-400 mt-0.5 block">
                    +{parseResult.newLenses.length}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Existing Cameras Skipped</span>
                  <span className="text-xl font-bold font-mono text-slate-400 mt-0.5 block">
                    {parseResult.skippedCameras.length}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Existing Lenses Skipped</span>
                  <span className="text-xl font-bold font-mono text-slate-400 mt-0.5 block">
                    {parseResult.skippedLenses.length}
                  </span>
                </div>
              </div>

              {/* Duplicate Notice */}
              {(parseResult.skippedCameras.length > 0 || parseResult.skippedLenses.length > 0) && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-200 font-semibold block">Deduplication Protection Active:</span>
                    <span>
                      {parseResult.skippedCameras.length + parseResult.skippedLenses.length} items already exist in the database and will be preserved without modification. Only brand-new equipment will be appended.
                    </span>
                  </div>
                </div>
              )}

              {/* Preview of New Items */}
              {parseResult.newCameras.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span>New Cameras to Add ({parseResult.newCameras.length}):</span>
                  </span>
                  <div className="max-h-32 overflow-y-auto rounded-xl bg-slate-950 border border-slate-800 divide-y divide-slate-800/60 p-1">
                    {parseResult.newCameras.map((c, i) => (
                      <div key={i} className="px-3 py-1.5 flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{c.brand} {c.model}</span>
                        <span className="text-[11px] font-mono text-slate-400">{c.sensorFormat} · {c.megapixels}MP</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parseResult.newLenses.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    <span>New Lenses to Add ({parseResult.newLenses.length}):</span>
                  </span>
                  <div className="max-h-32 overflow-y-auto rounded-xl bg-slate-950 border border-slate-800 divide-y divide-slate-800/60 p-1">
                    {parseResult.newLenses.map((l, i) => (
                      <div key={i} className="px-3 py-1.5 flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{l.brand} {l.model}</span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {l.focalLengthMinMm}mm · f/{l.maxAperture} · {l.projectionType}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parseResult.errors.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Parsing Notices:</span>
                    <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                      {parseResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {importSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    Successfully added {parseResult.newCameras.length} cameras and {parseResult.newLenses.length} lenses to the {isCreatorMode ? 'Master' : 'Local'} database!
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Database Lead: <strong className="text-amber-400">Gazaly Samsadeen</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>

            {parseResult && (parseResult.newCameras.length > 0 || parseResult.newLenses.length > 0) && (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={importSuccess}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-black transition shadow-lg flex items-center gap-1.5"
              >
                <span>Confirm & Update Database</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
