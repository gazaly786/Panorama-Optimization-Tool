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
  Plus,
  RotateCcw,
  AlertTriangle,
  X,
  Sliders,
} from 'lucide-react';
import { formatDualMm } from '../utils/units';

export const SavedSetupsPage: React.FC<{ onNavigateToOptimizer: () => void }> = ({
  onNavigateToOptimizer,
}) => {
  const {
    savedSetups,
    loadSetup,
    deleteSetup,
    clearAllSetups,
    resetSetupsToDefault,
    saveCurrentSetup,
    selectedCamera,
    selectedLens,
    selectedPanoHead,
    currentFocalLengthMm,
    targetOverlapPct,
    results,
    cameras,
    lenses,
    exportDatabaseJson,
    importDatabaseJson,
  } = usePanorama();

  const [importJsonText, setImportJsonText] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  // In-app Delete & Clear Modal States (avoiding window.confirm)
  const [presetToDelete, setPresetToDelete] = useState<UserRigPreset | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState<boolean>(false);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [saveName, setSaveName] = useState<string>('');
  const [saveDescription, setSaveDescription] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleDownloadJson = () => {
    const json = exportDatabaseJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `panooptix_saved_rigs_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported saved rigs JSON successfully');
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJsonText.trim()) return;
    setImportError(null);
    const ok = importDatabaseJson(importJsonText.trim());
    if (ok) {
      setImportSuccess(true);
      setTimeout(() => {
        setImportSuccess(false);
        setImportModalOpen(false);
        setImportJsonText('');
        showToast('Presets imported successfully!');
      }, 1200);
    } else {
      setImportError('Invalid JSON structure. Please ensure the file contains valid cameras, lenses, or presets.');
    }
  };

  const confirmDeleteSingle = () => {
    if (!presetToDelete) return;
    const name = presetToDelete.name;
    deleteSetup(presetToDelete.id);
    setPresetToDelete(null);
    showToast(`Deleted rig: "${name}"`);
  };

  const handleClearAll = () => {
    clearAllSetups();
    setShowClearAllModal(false);
    showToast('Cleared all saved rigs from storage.');
  };

  const handleResetFactory = () => {
    resetSetupsToDefault();
    setShowClearAllModal(false);
    showToast('Restored factory reference rig.');
  };

  const handleOpenSaveModal = () => {
    setSaveName(`${selectedCamera.brand} ${selectedCamera.model} + ${selectedLens.brand} ${selectedLens.model}`);
    setSaveDescription(`Configured with ${selectedPanoHead.brand} ${selectedPanoHead.model} (${results.shotsPerCircle} shots @ ${Math.round(360 / results.shotsPerCircle)}°)`);
    setShowSaveModal(true);
  };

  const handleSaveCurrentRig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveName.trim()) return;
    saveCurrentSetup(saveName.trim(), saveDescription.trim());
    setShowSaveModal(false);
    showToast(`Saved rig "${saveName.trim()}" to Section 10!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 px-4 py-3 rounded-2xl font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-slate-950" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-black text-white">Section 10 · Saved Photographer Rigs & Presets</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Access your saved camera and lens combinations, panoramic head rail settings, and field-tested setups.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Save Current Active Rig */}
          <button
            type="button"
            onClick={handleOpenSaveModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Save Active Rig</span>
          </button>

          {/* Clear All Saved Rigs */}
          {savedSetups.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearAllModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition"
              title="Clear all saved rigs or reset to defaults"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Rigs ({savedSetups.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setImportError(null);
              setImportModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Import</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {savedSetups.length === 0 && (
        <div className="p-10 rounded-3xl bg-slate-900/60 border border-dashed border-slate-800 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Bookmark className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Saved Rigs in Section 10</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              You haven't saved any equipment configurations yet, or you cleared them. You can save your current active setup or restore the reference setup.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleOpenSaveModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Save Current Active Rig ({selectedCamera.model} + {selectedLens.model})</span>
            </button>
            <button
              type="button"
              onClick={handleResetFactory}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Restore Golden Reference Rig</span>
            </button>
          </div>
        </div>
      )}

      {/* Rigs Grid */}
      {savedSetups.length > 0 && (
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
                      Saved Rig
                    </span>
                    <button
                      type="button"
                      onClick={() => setPresetToDelete(preset)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title={`Delete "${preset.name}"`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">{preset.name}</h3>
                  {preset.description && (
                    <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-2">
                      {preset.description}
                    </p>
                  )}

                  {/* Rig Specs */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 mb-4">
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
                      <span className="font-bold text-slate-300">{formatDualMm(preset.upperRailOffsetMm || 45)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block">Pano Head</span>
                      <span className="font-bold text-slate-300 truncate block">{preset.panoramicHeadModel || 'Standard'}</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      loadSetup(preset);
                      showToast(`Loaded "${preset.name}" into active session!`);
                      onNavigateToOptimizer();
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition shadow"
                  >
                    <span>1-Click Load into Optimizer</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* In-App Confirmation Modal for Single Rig Deletion */}
      {presetToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Saved Rig?</h3>
                <p className="text-xs text-slate-400">This action will remove this preset from Section 10.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
              <div className="font-bold text-white">{presetToDelete.name}</div>
              <div className="text-slate-400 text-[11px] mt-0.5">{presetToDelete.description}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPresetToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteSingle}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow"
              >
                Yes, Delete Rig
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal for Clear All */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Clear All Saved Rigs?</h3>
                <p className="text-xs text-slate-400">
                  You currently have {savedSetups.length} saved rigs in Section 10.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Do you want to completely clear all saved rigs, or would you like to reset back to the factory reference preset (Canon 90D + Sigma 8mm Fisheye)?
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowClearAllModal(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetFactory}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition"
              >
                Reset to Factory Rig
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow"
              >
                Wipe All Rigs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Active Rig Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Bookmark className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Save Rig to Section 10</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCurrentRig} className="flex flex-col gap-4 text-xs font-mono">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Rig Title / Preset Name:</label>
                <input
                  type="text"
                  required
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="e.g. Canon 90D + Sigma 8mm [Real Estate Interior]"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Field Notes / Description (Optional):</label>
                <textarea
                  rows={2}
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="e.g. Sharpness optimized at f/8, 6 shots around with NN4 rotator detent..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-sans"
                />
              </div>

              {/* Rig Settings Preview */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] grid grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-slate-500 block">Camera:</span>
                  <span className="font-bold text-white">{selectedCamera.brand} {selectedCamera.model}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Lens:</span>
                  <span className="font-bold text-amber-400">{selectedLens.model} ({currentFocalLengthMm}mm)</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Panoramic Head:</span>
                  <span className="font-bold text-white">{selectedPanoHead.brand} {selectedPanoHead.model}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Rotation Detents:</span>
                  <span className="font-bold text-emerald-400">{results.shotsPerCircle} shots ({Math.round(360 / results.shotsPerCircle)}°)</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Upper Rail (NPP):</span>
                  <span className="font-bold text-amber-300">{formatDualMm(selectedLens.entrancePupilOffsetMm || 45)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Overlap:</span>
                  <span className="font-bold text-sky-400">{results.overlapPct}%</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black hover:bg-amber-400 transition shadow"
                >
                  Save to Section 10
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Import Presets / Database JSON</h3>
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Paste your exported JSON database string below to restore custom cameras, lenses, and rig setups.
            </p>

            {importError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{importError}</span>
              </div>
            )}

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
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition shadow"
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
