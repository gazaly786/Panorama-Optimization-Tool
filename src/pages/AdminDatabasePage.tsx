import React, { useState } from 'react';
import { usePanorama } from '../context/PanoramaContext';
import { CameraSpec, LensSpec, SensorFormat, ProjectionType } from '../types';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { ExcelGearUploadModal } from '../components/ExcelGearUploadModal';
import { downloadSampleExcelTemplate } from '../utils/excelGearParser';
import {
  Database,
  Plus,
  Trash2,
  Copy,
  Edit2,
  Download,
  Upload,
  Camera,
  Layers,
  CheckCircle,
  FileSpreadsheet,
  UserCheck,
  Sparkles,
} from 'lucide-react';

export const AdminDatabasePage: React.FC = () => {
  const {
    cameras,
    lenses,
    addCamera,
    updateCamera,
    deleteCamera,
    addLens,
    updateLens,
    deleteLens,
    exportDatabaseJson,
    exportDatabaseCsv,
    importDatabaseJson,
  } = usePanorama();

  const [activeTab, setActiveTab] = useState<'CAMERAS' | 'LENSES'>('CAMERAS');
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [lensModalOpen, setLensModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [excelModalOpen, setExcelModalOpen] = useState(false);

  // New Camera Form State
  const [cameraForm, setCameraForm] = useState<Partial<CameraSpec>>({
    brand: '',
    model: '',
    cameraType: 'Mirrorless',
    sensorFormat: 'APS-C Canon',
    sensorWidthMm: 22.3,
    sensorHeightMm: 14.9,
    cropFactor: 1.61,
    megapixels: 24.0,
    nativeResolution: [6000, 4000],
    nativeIso: 100,
    isoRange: [100, 25600],
    aebCapability: true,
    maxAebRangeEv: 3,
    maxAebFrameCount: 5,
    mirrorLockUp: false,
    efcs: true,
    selfTimerSeconds: [2, 10],
    remoteTriggerSupport: true,
    lensMount: 'Canon RF',
    ibis: false,
    mechanicalShutter: true,
    electronicShutter: true,
    maxShutterSpeed: '1/8000',
    minShutterSpeed: '30s',
    rawSupport: true,
  });

  // New Lens Form State
  const [lensForm, setLensForm] = useState<Partial<LensSpec>>({
    brand: '',
    model: '',
    focalLengthMinMm: 8,
    focalLengthMaxMm: 8,
    maxAperture: 3.5,
    minAperture: 22,
    projectionType: 'fisheye_circular',
    lensMount: 'Canon EF',
    minFocusDistanceM: 0.2,
    sweetSpotAperture: 'f/5.6 - f/8',
    entrancePupilOffsetMm: 45,
    opticalStabilization: false,
    filterSupport: false,
  });

  const handleSaveCamera = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cameraForm.brand || !cameraForm.model) {
      alert('Brand and Model are required.');
      return;
    }
    const [w, h] = cameraForm.nativeResolution || [6000, 4000];
    const sw = cameraForm.sensorWidthMm || 22.3;
    const sh = cameraForm.sensorHeightMm || 14.9;
    const sd = Math.sqrt(sw ** 2 + sh ** 2);
    const pixelPitch = Math.round((sw / w) * 1000 * 100) / 100;

    const newCam: CameraSpec = {
      id: `cam-${Date.now()}`,
      brand: cameraForm.brand,
      model: cameraForm.model,
      cameraType: cameraForm.cameraType as any,
      sensorFormat: cameraForm.sensorFormat as any,
      sensorWidthMm: sw,
      sensorHeightMm: sh,
      sensorDiagonalMm: Math.round(sd * 100) / 100,
      cropFactor: cameraForm.cropFactor || 1.61,
      megapixels: cameraForm.megapixels || 24,
      nativeResolution: [w, h],
      pixelPitchUm: pixelPitch,
      isoRange: cameraForm.isoRange || [100, 25600],
      nativeIso: cameraForm.nativeIso || 100,
      rawSupport: true,
      rawBitDepth: 14,
      ibis: cameraForm.ibis || false,
      mechanicalShutter: true,
      electronicShutter: cameraForm.electronicShutter || false,
      maxShutterSpeed: cameraForm.maxShutterSpeed || '1/8000',
      minShutterSpeed: cameraForm.minShutterSpeed || '30s',
      aebCapability: cameraForm.aebCapability ?? true,
      maxAebRangeEv: cameraForm.maxAebRangeEv || 3,
      maxAebFrameCount: cameraForm.maxAebFrameCount || 5,
      mirrorLockUp: cameraForm.mirrorLockUp || false,
      efcs: cameraForm.efcs ?? true,
      selfTimerSeconds: cameraForm.selfTimerSeconds || [2, 10],
      remoteTriggerSupport: true,
      lensMount: cameraForm.lensMount || 'Canon EF',
      isCustom: true,
      provenance: {
        source: 'User Manual Entry',
        status: 'USER VERIFIED',
        confidence: 'MEDIUM',
        dateVerified: new Date().toISOString().slice(0, 10),
      },
    };

    addCamera(newCam);
    setCameraModalOpen(false);
  };

  const handleSaveLens = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lensForm.brand || !lensForm.model) {
      alert('Brand and Model are required.');
      return;
    }
    const newLens: LensSpec = {
      id: `lens-${Date.now()}`,
      brand: lensForm.brand,
      model: lensForm.model,
      focalLengthMinMm: lensForm.focalLengthMinMm || 8,
      focalLengthMaxMm: lensForm.focalLengthMaxMm || lensForm.focalLengthMinMm || 8,
      maxAperture: lensForm.maxAperture || 3.5,
      minAperture: lensForm.minAperture || 22,
      lensMount: lensForm.lensMount || 'Canon EF',
      sensorCompatibility: ['Full-Frame', 'APS-C Canon', 'APS-C (Nikon/Sony/Fuji)', 'Micro Four Thirds'],
      projectionType: lensForm.projectionType as any || 'fisheye_circular',
      minFocusDistanceM: lensForm.minFocusDistanceM || 0.2,
      sweetSpotAperture: lensForm.sweetSpotAperture || 'f/5.6 - f/8',
      entrancePupilOffsetMm: lensForm.entrancePupilOffsetMm || 45,
      opticalStabilization: lensForm.opticalStabilization || false,
      filterSupport: lensForm.filterSupport || false,
      isCustom: true,
      provenance: {
        source: 'User Manual Entry',
        status: 'USER VERIFIED',
        confidence: 'MEDIUM',
        dateVerified: new Date().toISOString().slice(0, 10),
      },
    };

    addLens(newLens);
    setLensModalOpen(false);
  };

  const handleExportJson = () => {
    const json = exportDatabaseJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `panooptix_database_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const { camerasCsv, lensesCsv } = exportDatabaseCsv();
    // Download cameras CSV
    const blob1 = new Blob([camerasCsv], { type: 'text/csv' });
    const url1 = URL.createObjectURL(blob1);
    const a1 = document.createElement('a');
    a1.href = url1;
    a1.download = `panooptix_cameras_${new Date().toISOString().slice(0, 10)}.csv`;
    a1.click();
    URL.revokeObjectURL(url1);

    // Download lenses CSV
    const blob2 = new Blob([lensesCsv], { type: 'text/csv' });
    const url2 = URL.createObjectURL(blob2);
    const a2 = document.createElement('a');
    a2.href = url2;
    a2.download = `panooptix_lenses_${new Date().toISOString().slice(0, 10)}.csv`;
    a2.click();
    URL.revokeObjectURL(url2);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-black text-white">Database Management & Administration</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Add custom equipment, edit optical specifications, verify provenance data, and import/export the entire camera & lens library.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setExcelModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Upload Gear Excel</span>
          </button>
          <button
            type="button"
            onClick={downloadSampleExcelTemplate}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            title="Download blank sample Excel template with Cameras & Lenses columns"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Excel Template</span>
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Export JSON</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Upload className="w-4 h-4 text-slate-400" />
            <span>Import JSON</span>
          </button>
        </div>
      </div>

      {/* Creator Attribution & Master Database Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white">App Creator & Lead Optical Architect: Gazaly Samsadeen</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400 font-bold">
                MASTER CURATOR
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified optical calibration benchmarks, sensor formats, entrance pupil measurements, and high-precision panoramic presets.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExcelModalOpen(true)}
          className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Batch Update via Excel</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('CAMERAS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-mono transition ${
              activeTab === 'CAMERAS'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Cameras ({cameras.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LENSES')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-mono transition ${
              activeTab === 'LENSES'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Lenses ({lenses.length})</span>
          </button>
        </div>

        {activeTab === 'CAMERAS' ? (
          <button
            type="button"
            onClick={() => setCameraModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Camera</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setLensModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lens</span>
          </button>
        )}
      </div>

      {/* Tab Content: Cameras Table */}
      {activeTab === 'CAMERAS' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Brand & Model</th>
                  <th className="py-3 px-4">Sensor & Crop</th>
                  <th className="py-3 px-4">Resolution</th>
                  <th className="py-3 px-4">Pixel Pitch</th>
                  <th className="py-3 px-4">AEB Capability</th>
                  <th className="py-3 px-4">Provenance</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {cameras.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 text-slate-300">
                    <td className="py-3 px-4">
                      <span className="font-bold text-white block">{c.brand} {c.model}</span>
                      <span className="text-[11px] text-slate-500">{c.cameraType} · {c.lensMount}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-amber-400 font-bold block">{c.cropFactor}x Crop</span>
                      <span className="text-[11px] text-slate-400">{c.sensorFormat}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span>{c.megapixels} MP</span>
                      <span className="text-[11px] text-slate-500 block">{c.nativeResolution.join('×')}</span>
                    </td>
                    <td className="py-3 px-4 text-sky-400 font-bold">
                      {c.pixelPitchUm} μm
                    </td>
                    <td className="py-3 px-4 text-emerald-400">
                      {c.aebCapability ? `${c.maxAebFrameCount}f (±${c.maxAebRangeEv}EV)` : 'No'}
                    </td>
                    <td className="py-3 px-4">
                      <ConfidenceBadge status={c.provenance.status} source={c.provenance.source} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const duplicate = { ...c, id: `cam-${Date.now()}`, model: `${c.model} (Copy)` };
                            addCamera(duplicate);
                          }}
                          className="p-1 text-slate-400 hover:text-white"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete camera "${c.brand} ${c.model}"?`)) {
                              deleteCamera(c.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Lenses Table */}
      {activeTab === 'LENSES' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Brand & Model</th>
                  <th className="py-3 px-4">Projection</th>
                  <th className="py-3 px-4">Focal Length</th>
                  <th className="py-3 px-4">Aperture</th>
                  <th className="py-3 px-4">Sweet Spot</th>
                  <th className="py-3 px-4">Entrance Pupil</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {lenses.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/40 text-slate-300">
                    <td className="py-3 px-4">
                      <span className="font-bold text-white block">{l.brand} {l.model}</span>
                      <span className="text-[11px] text-slate-500">{l.lensMount}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        l.projectionType.startsWith('fisheye')
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                      }`}>
                        {l.projectionType.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-amber-400">
                      {l.focalLengthMinMm === l.focalLengthMaxMm
                        ? `${l.focalLengthMinMm} mm`
                        : `${l.focalLengthMinMm}–${l.focalLengthMaxMm} mm`}
                    </td>
                    <td className="py-3 px-4">
                      f/{l.maxAperture} – f/{l.minAperture}
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">
                      {l.sweetSpotAperture || 'f/5.6 - f/8'}
                    </td>
                    <td className="py-3 px-4 text-sky-400">
                      ~{l.entrancePupilOffsetMm || 45} mm
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const duplicate = { ...l, id: `lens-${Date.now()}`, model: `${l.model} (Copy)` };
                            addLens(duplicate);
                          }}
                          className="p-1 text-slate-400 hover:text-white"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete lens "${l.brand} ${l.model}"?`)) {
                              deleteLens(l.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Camera Modal */}
      {cameraModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col gap-4">
            <h2 className="text-xl font-bold text-white">Add New Camera Body</h2>
            <form onSubmit={handleSaveCamera} className="flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Manufacturer Brand</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Canon"
                    value={cameraForm.brand}
                    onChange={(e) => setCameraForm({ ...cameraForm, brand: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Model Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EOS 90D"
                    value={cameraForm.model}
                    onChange={(e) => setCameraForm({ ...cameraForm, model: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Sensor Format</label>
                  <select
                    value={cameraForm.sensorFormat}
                    onChange={(e) => setCameraForm({ ...cameraForm, sensorFormat: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="Full-Frame">Full-Frame (1.0x)</option>
                    <option value="APS-C Canon">APS-C Canon (1.61x)</option>
                    <option value="APS-C (Nikon/Sony/Fuji)">APS-C Nikon/Sony/Fuji (1.53x)</option>
                    <option value="Micro Four Thirds">Micro Four Thirds (2.0x)</option>
                    <option value="1 inch">1 inch (2.7x)</option>
                    <option value="Medium Format 44x33">Medium Format 44x33 (0.79x)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Megapixels</label>
                  <input
                    type="number"
                    step="0.1"
                    value={cameraForm.megapixels}
                    onChange={(e) => setCameraForm({ ...cameraForm, megapixels: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Sensor Width (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={cameraForm.sensorWidthMm}
                    onChange={(e) => setCameraForm({ ...cameraForm, sensorWidthMm: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Sensor Height (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={cameraForm.sensorHeightMm}
                    onChange={(e) => setCameraForm({ ...cameraForm, sensorHeightMm: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Lens Mount</label>
                  <input
                    type="text"
                    placeholder="e.g. Canon RF"
                    value={cameraForm.lensMount}
                    onChange={(e) => setCameraForm({ ...cameraForm, lensMount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Native ISO</label>
                  <input
                    type="number"
                    value={cameraForm.nativeIso}
                    onChange={(e) => setCameraForm({ ...cameraForm, nativeIso: parseInt(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCameraModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition"
                >
                  Save Camera
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Lens Modal */}
      {lensModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col gap-4">
            <h2 className="text-xl font-bold text-white">Add New Lens Specification</h2>
            <form onSubmit={handleSaveLens} className="flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Manufacturer Brand</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sigma"
                    value={lensForm.brand}
                    onChange={(e) => setLensForm({ ...lensForm, brand: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Model Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 8mm f/3.5 Circular Fisheye"
                    value={lensForm.model}
                    onChange={(e) => setLensForm({ ...lensForm, model: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Projection Type</label>
                  <select
                    value={lensForm.projectionType}
                    onChange={(e) => setLensForm({ ...lensForm, projectionType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="fisheye_circular">Fisheye (Circular 180°+)</option>
                    <option value="fisheye_equisolid">Fisheye (Equisolid / Fullframe)</option>
                    <option value="fisheye_stereographic">Fisheye (Stereographic)</option>
                    <option value="fisheye_equidistant">Fisheye (Equidistant)</option>
                    <option value="rectilinear">Rectilinear (Standard Perspective)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Focal Length (mm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={lensForm.focalLengthMinMm}
                    onChange={(e) => setLensForm({ ...lensForm, focalLengthMinMm: parseFloat(e.target.value), focalLengthMaxMm: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Entrance Pupil Offset (mm)</label>
                  <input
                    type="number"
                    value={lensForm.entrancePupilOffsetMm}
                    onChange={(e) => setLensForm({ ...lensForm, entrancePupilOffsetMm: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Sweet Spot Aperture</label>
                  <input
                    type="text"
                    placeholder="e.g. f/5.6 - f/8"
                    value={lensForm.sweetSpotAperture}
                    onChange={(e) => setLensForm({ ...lensForm, sweetSpotAperture: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setLensModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition"
                >
                  Save Lens
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
            <h3 className="text-lg font-bold text-white">Import Entire Database (JSON)</h3>
            <p className="text-xs text-slate-400">
              Paste exported JSON to merge or overwrite equipment records.
            </p>
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
                type="button"
                onClick={() => {
                  if (importDatabaseJson(importJsonText)) {
                    alert('Database imported successfully!');
                    setImportModalOpen(false);
                    setImportJsonText('');
                  } else {
                    alert('Invalid JSON structure.');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition"
              >
                Import Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Upload Modal */}
      <ExcelGearUploadModal
        isOpen={excelModalOpen}
        onClose={() => setExcelModalOpen(false)}
      />
    </div>
  );
};
