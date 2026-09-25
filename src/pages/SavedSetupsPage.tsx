import React, { useState } from 'react';
import { usePanorama } from '../context/PanoramaContext';
import { UserRigPreset } from '../types';
import {
  Bookmark,
  CheckCircle,
  Trash2,
  ArrowRight,
  Download,
  Upload,
  Camera,
  Layers,
  Sparkles,
  Calendar,
} from 'lucide-react';

export const SavedSetupsPage: React.FC<{ onNavigateToOptimizer: () => void }> = ({
  onNavigateToOptimizer,
}) => {
  const {
    savedSetups,
    loadSetup,
    deleteSetup,
    cameras,
    lenses,
    exportDatabaseJson,
    importDatabaseJson,
  } = usePanorama();

  const [importJsonText, setImportJsonText] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleDownloadJson = () => {
    const json = exportDatabaseJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `panooptix_saved_rigs_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJsonText.trim()) return;
    const ok = importDatabaseJson(importJsonText.trim());
    if (ok) {
      setImportSuccess(true);
      setTimeout(() => {
        setImportSuccess(false);
        setImportModalOpen(false);
        setImportJsonText('');
      }, 1500);
    } else {
      alert('Invalid JSON format. Please verify the JSON structure.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-black text-white">Saved Photographer Rigs & Presets</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Access your saved camera and lens combinations, panoramic head rail settings, and field-tested setups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Export Rigs (JSON)</span>
          </button>
          <button
            type="button"
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Upload className="w-4 h-4 text-amber-400" />
            <span>Import Rigs</span>
          </button>
        </div>
      </div>

      {/* Rigs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedSetups.map((preset) => {
          const cam = cameras.find((c) => c.id === preset.cameraId);
          const lens = lenses.find((l) => l.id === preset.lensId);

          return (
            <div
              key={preset.id}
              className="flex flex-col justify-between p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                    Custom Preset
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete preset "${preset.name}"?`)) {
                        deleteSetup(preset.id);
                      }
                    }}
                    className="p-1 text-slate-500 hover:text-rose-400 transition"
                    title="Delete Preset"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-white mb-1">{preset.name}</h3>
                {preset.description && (
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    {preset.description}
                  </p>
                )}

                {/* Rig Specs */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800 mb-4">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Camera</span>
                    <span className="font-bold text-slate-200 truncate block">{cam?.model || preset.cameraId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Lens</span>
                    <span className="font-bold text-amber-400 truncate block">{lens?.model || preset.lensId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Aperture</span>
                    <span className="font-bold text-emerald-400">f/{preset.aperture || 8}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Overlap</span>
                    <span className="font-bold text-sky-400">{preset.overlapPct}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Upper Rail</span>
                    <span className="font-bold text-slate-300">{preset.upperRailOffsetMm || 45} mm</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Pano Head</span>
                    <span className="font-bold text-slate-300 truncate block">{preset.panoramicHeadModel || 'Standard'}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    loadSetup(preset);
                    onNavigateToOptimizer();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition shadow"
                >
                  <span>1-Click Load into Optimizer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4">
            <h3 className="text-lg font-bold text-white">Import Presets / Database JSON</h3>
            <p className="text-xs text-slate-400">
              Paste your exported JSON database string below to restore custom cameras, lenses, and rig setups.
            </p>
            <form onSubmit={handleImport} className="flex flex-col gap-3">
              <textarea
                rows={8}
                placeholder="Paste JSON here..."
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition"
                >
                  {importSuccess ? 'Imported Successfully!' : 'Import Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
