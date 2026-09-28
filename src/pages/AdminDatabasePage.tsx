import React, { useState } from 'react';
import { usePanorama } from '../context/PanoramaContext';
import { CameraSpec, LensSpec, SensorFormat, ProjectionType, PanoHeadSpec, PanoHeadType } from '../types';
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
  Sliders,
  Compass,
  Crosshair,
  RotateCw,
  Search,
  RotateCcw,
  Check,
  Shield,
  Info,
} from 'lucide-react';

export const AdminDatabasePage: React.FC = () => {
  const {
    cameras,
    lenses,
    panoHeads,
    selectedPanoHead,
    setSelectedPanoHead,
    addCamera,
    updateCamera,
    deleteCamera,
    addLens,
    updateLens,
    deleteLens,
    addPanoHead,
    updatePanoHead,
    deletePanoHead,
    resetPanoHeadsToDefault,
    exportDatabaseJson,
    exportDatabaseCsv,
    importDatabaseJson,
  } = usePanorama();

  const [activeTab, setActiveTab] = useState<'CAMERAS' | 'LENSES' | 'PANO_HEADS'>('CAMERAS');
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [lensModalOpen, setLensModalOpen] = useState(false);
  const [headModalOpen, setHeadModalOpen] = useState(false);
  const [editingHeadId, setEditingHeadId] = useState<string | null>(null);
  const [importJsonText, setImportJsonText] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [excelModalOpen, setExcelModalOpen] = useState(false);

  // Search and filter for Pano Heads
  const [headSearchTerm, setHeadSearchTerm] = useState('');
  const [headTypeFilter, setHeadTypeFilter] = useState('ALL');
  const [headStatusFilter, setHeadStatusFilter] = useState('ALL');

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

  // Panoramic Head Form State
  const [headForm, setHeadForm] = useState<Partial<PanoHeadSpec>>({
    brand: 'Fanotec / Nodal Ninja',
    model: '',
    type: 'Multi-row Spherical',
    loadCapacity: '~3.5kg',
    rotatorDetentOptions: 'Interchangeable detent rings (4, 6, 8, 10, 12 stops)',
    detentStopsDeg: [90, 60, 45, 30],
    supportedShots: [4, 6, 8, 12],
    setupMethod: 'Sliding rails with mm scales for no-parallax point (NPP)',
    compatibility: 'Compact and Mirrorless cameras',
    status: 'Active',
    lowerRailMaxMm: 120,
    upperRailMaxMm: 140,
    isRingClamp: false,
    isSlant: false,
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
    const pitch = (sw / w) * 1000;

    const newCam: CameraSpec = {
      id: `custom-cam-${Date.now()}`,
      brand: cameraForm.brand,
      model: cameraForm.model,
      cameraType: cameraForm.cameraType || 'Mirrorless',
      sensorFormat: cameraForm.sensorFormat || 'APS-C Canon',
      sensorWidthMm: sw,
      sensorHeightMm: sh,
      sensorDiagonalMm: Math.round(sd * 100) / 100,
      cropFactor: cameraForm.cropFactor || 1.61,
      megapixels: cameraForm.megapixels || 24,
      nativeResolution: [w, h],
      pixelPitchUm: Math.round(pitch * 100) / 100,
      nativeIso: cameraForm.nativeIso || 100,
      isoRange: cameraForm.isoRange || [100, 25600],
      aebCapability: cameraForm.aebCapability ?? true,
      maxAebRangeEv: cameraForm.maxAebRangeEv || 3,
      maxAebFrameCount: cameraForm.maxAebFrameCount || 5,
      mirrorLockUp: cameraForm.mirrorLockUp ?? false,
      efcs: cameraForm.efcs ?? true,
      selfTimerSeconds: [2, 10],
      remoteTriggerSupport: true,
      lensMount: cameraForm.lensMount || 'Universal',
      ibis: cameraForm.ibis ?? false,
      mechanicalShutter: cameraForm.mechanicalShutter ?? true,
      electronicShutter: cameraForm.electronicShutter ?? true,
      maxShutterSpeed: cameraForm.maxShutterSpeed || '1/8000',
      minShutterSpeed: cameraForm.minShutterSpeed || '30s',
      rawSupport: true,
      provenance: {
        source: 'User Custom Entry (Local Storage)',
        status: 'USER VERIFIED',
        confidence: 'MEDIUM',
        dateVerified: new Date().toISOString().split('T')[0],
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
      id: `custom-lens-${Date.now()}`,
      brand: lensForm.brand,
      model: lensForm.model,
      focalLengthMinMm: lensForm.focalLengthMinMm || 8,
      focalLengthMaxMm: lensForm.focalLengthMaxMm || 8,
      maxAperture: lensForm.maxAperture || 3.5,
      minAperture: lensForm.minAperture || 22,
      projectionType: lensForm.projectionType || 'fisheye_circular',
      lensMount: lensForm.lensMount || 'Universal',
      sensorCompatibility: ['Full-Frame', 'APS-C Canon', 'APS-C (Nikon/Sony/Fuji)', 'Micro Four Thirds'],
      minFocusDistanceM: lensForm.minFocusDistanceM || 0.2,
      sweetSpotAperture: lensForm.sweetSpotAperture || 'f/5.6 - f/8',
      entrancePupilOffsetMm: lensForm.entrancePupilOffsetMm || 45,
      opticalStabilization: lensForm.opticalStabilization ?? false,
      filterSupport: lensForm.filterSupport ?? false,
      provenance: {
        source: 'User Custom Entry (Local Storage)',
        status: 'USER VERIFIED',
        confidence: 'MEDIUM',
        dateVerified: new Date().toISOString().split('T')[0],
      },
    };

    addLens(newLens);
    setLensModalOpen(false);
  };

  const handleOpenAddHeadModal = () => {
    setEditingHeadId(null);
    setHeadForm({
      brand: 'Fanotec / Nodal Ninja',
      model: '',
      type: 'Multi-row Spherical',
      loadCapacity: '~3.5kg',
      rotatorDetentOptions: 'Interchangeable detent rings (4, 6, 8, 10, 12 stops)',
      detentStopsDeg: [90, 60, 45, 30],
      supportedShots: [4, 6, 8, 12],
      setupMethod: 'Sliding rails with mm scales for no-parallax point (NPP)',
      compatibility: 'Standard DSLRs with standard/wide lenses',
      status: 'Active',
      lowerRailMaxMm: 120,
      upperRailMaxMm: 140,
      isRingClamp: false,
      isSlant: false,
    });
    setHeadModalOpen(true);
  };

  const handleOpenEditHeadModal = (head: PanoHeadSpec) => {
    setEditingHeadId(head.id);
    setHeadForm({ ...head });
    setHeadModalOpen(true);
  };

  const handleSaveHead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headForm.brand || !headForm.model) {
      alert('Brand and Model are required.');
      return;
    }

    const stops = headForm.detentStopsDeg && headForm.detentStopsDeg.length > 0
      ? headForm.detentStopsDeg
      : [90, 60, 45, 30];
    const shots = stops.map(s => Math.round(360 / s));

    const headItem: PanoHeadSpec = {
      id: editingHeadId || `head-${Date.now()}`,
      brand: headForm.brand,
      model: headForm.model,
      type: headForm.type || 'Multi-row Spherical',
      loadCapacity: headForm.loadCapacity || '~3.5kg',
      rotatorDetentOptions: headForm.rotatorDetentOptions || 'Standard detents',
      detentStopsDeg: stops,
      supportedShots: shots,
      setupMethod: headForm.setupMethod || 'Sliding rails with mm scale',
      compatibility: headForm.compatibility || 'Universal',
      status: headForm.status || 'Active',
      lowerRailMaxMm: headForm.lowerRailMaxMm || 120,
      upperRailMaxMm: headForm.upperRailMaxMm || 140,
      isRingClamp: headForm.isRingClamp ?? false,
      isSlant: headForm.isSlant ?? false,
      provenance: {
        source: 'User Entry (Local Storage)',
        status: 'USER VERIFIED',
        confidence: 'HIGH',
        dateVerified: new Date().toISOString().split('T')[0],
      },
    };

    if (editingHeadId) {
      updatePanoHead(headItem);
    } else {
      addPanoHead(headItem);
    }
    setHeadModalOpen(false);
  };

  const handleExportJson = () => {
    const json = exportDatabaseJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PanoOptix_Master_Database_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const { camerasCsv, lensesCsv, panoHeadsCsv } = exportDatabaseCsv();
    const combined = `=== CAMERAS ===\n${camerasCsv}\n\n=== LENSES ===\n${lensesCsv}\n\n=== PANORAMIC HEADS ===\n${panoHeadsCsv}`;
    const blob = new Blob([combined], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PanoOptix_Equipment_Database_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered panoramic heads
  const filteredPanoHeads = panoHeads.filter((h) => {
    const matchesSearch =
      headSearchTerm === '' ||
      h.brand.toLowerCase().includes(headSearchTerm.toLowerCase()) ||
      h.model.toLowerCase().includes(headSearchTerm.toLowerCase()) ||
      h.compatibility.toLowerCase().includes(headSearchTerm.toLowerCase());

    const matchesType = headTypeFilter === 'ALL' || h.type === headTypeFilter;
    const matchesStatus = headStatusFilter === 'ALL' || h.status === headStatusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-black text-white">Hardware & Optical Database Hub</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage camera bodies, fisheye/rectilinear lenses, and panoramic tripod heads. Supports Excel/CSV batch import, deduplication, and export.
          </p>
        </div>

        {/* Global Action Buttons */}
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
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
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export JSON</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Download className="w-4 h-4 text-sky-400" />
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
              <span className="text-sm font-black text-white">Master Equipment Database & Verified Presets</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400 font-bold">
                VERIFIED RIGS
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
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
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

          <button
            type="button"
            onClick={() => setActiveTab('PANO_HEADS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-mono transition ${
              activeTab === 'PANO_HEADS'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Panoramic Heads ({panoHeads.length})</span>
          </button>
        </div>

        {activeTab === 'CAMERAS' && (
          <button
            type="button"
            onClick={() => setCameraModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Camera</span>
          </button>
        )}

        {activeTab === 'LENSES' && (
          <button
            type="button"
            onClick={() => setLensModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lens</span>
          </button>
        )}

        {activeTab === 'PANO_HEADS' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetPanoHeadsToDefault}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition border border-slate-700"
              title="Reset Panoramic Heads to default factory list"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset Factory Heads</span>
            </button>
            <button
              type="button"
              onClick={handleOpenAddHeadModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add Pano Head</span>
            </button>
          </div>
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
                  <th className="py-3 px-4">AEB Support</th>
                  <th className="py-3 px-4">Mount</th>
                  <th className="py-3 px-4">Provenance</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {cameras.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{c.brand} {c.model}</div>
                      <div className="text-[10px] text-slate-500">{c.cameraType}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-amber-400 font-semibold">{c.sensorFormat}</span>
                      <div className="text-[10px] text-slate-500">{c.sensorWidthMm} × {c.sensorHeightMm} mm ({c.cropFactor}x)</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-white font-bold">{c.megapixels} MP</div>
                      <div className="text-[10px] text-slate-500">{c.nativeResolution[0]} × {c.nativeResolution[1]}</div>
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">
                      {c.pixelPitchUm} µm
                    </td>
                    <td className="py-3 px-4">
                      {c.aebCapability ? (
                        <span className="text-emerald-400">Yes (±{c.maxAebRangeEv} EV, {c.maxAebFrameCount}f)</span>
                      ) : (
                        <span className="text-slate-500">Manual</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{c.lensMount}</td>
                    <td className="py-3 px-4">
                      <ConfidenceBadge
                        confidence={c.provenance.confidence}
                        status={c.provenance.status}
                        source={c.provenance.source}
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => deleteCamera(c.id)}
                        disabled={cameras.length <= 1}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 disabled:opacity-30 transition"
                        title="Delete camera"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
                  <th className="py-3 px-4">Focal Length</th>
                  <th className="py-3 px-4">Projection</th>
                  <th className="py-3 px-4">Aperture</th>
                  <th className="py-3 px-4">Entrance Pupil (NPP)</th>
                  <th className="py-3 px-4">Mount</th>
                  <th className="py-3 px-4">Provenance</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {lenses.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{l.brand} {l.model}</div>
                      <div className="text-[10px] text-slate-500">{l.sweetSpotAperture || 'Standard'}</div>
                    </td>
                    <td className="py-3 px-4 text-amber-400 font-bold">
                      {l.focalLengthMinMm === l.focalLengthMaxMm
                        ? `${l.focalLengthMinMm}mm (Prime)`
                        : `${l.focalLengthMinMm}-${l.focalLengthMaxMm}mm (Zoom)`}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                        {l.projectionType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white">f/{l.maxAperture}</td>
                    <td className="py-3 px-4 text-sky-400 font-bold">
                      {l.entrancePupilOffsetMm ? `${l.entrancePupilOffsetMm} mm` : 'Estimated (45mm)'}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{l.lensMount}</td>
                    <td className="py-3 px-4">
                      <ConfidenceBadge
                        confidence={l.provenance.confidence}
                        status={l.provenance.status}
                        source={l.provenance.source}
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => deleteLens(l.id)}
                        disabled={lenses.length <= 1}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 disabled:opacity-30 transition"
                        title="Delete lens"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Panoramic Heads Section */}
      {activeTab === 'PANO_HEADS' && (
        <div className="flex flex-col gap-4">
          {/* Search & Filters */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search panoramic heads by brand, model, or compatibility..."
                value={headSearchTerm}
                onChange={(e) => setHeadSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={headTypeFilter}
                onChange={(e) => setHeadTypeFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">All Head Types</option>
                <option value="Multi-row Spherical">Multi-row Spherical</option>
                <option value="Single-row Ring Mount">Single-row Ring Mount</option>
                <option value="Single/Multi-row">Single/Multi-row</option>
                <option value="Slant/Single-row">Slant/Single-row</option>
                <option value="Multi-row Spherical Gigapixel">Multi-row Spherical Gigapixel</option>
                <option value="Multi-row Spherical (Gimbal type)">Multi-row Spherical (Gimbal)</option>
              </select>

              <select
                value={headStatusFilter}
                onChange={(e) => setHeadStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">All Status</option>
                <option value="Active">Active</option>
                <option value="Legacy/Active">Legacy/Active</option>
                <option value="Legacy">Legacy</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPanoHeads.map((h) => {
              const isSelected = selectedPanoHead.id === h.id;
              return (
                <div
                  key={h.id}
                  className={`p-5 rounded-2xl border transition flex flex-col justify-between gap-4 ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col gap-2.5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">
                          {h.brand}
                        </span>
                        <h4 className="text-base font-bold text-white mt-0.5">
                          {h.model}
                        </h4>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {h.type}
                        </span>
                        {h.status && (
                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                            h.status.includes('Active')
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {h.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Capacity & Setup */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Load Capacity</span>
                        <span className="font-bold text-slate-200">{h.loadCapacity}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Rail Limits</span>
                        <span className="font-bold text-slate-200">
                          {h.upperRailMaxMm ? `Up: ${h.upperRailMaxMm}mm` : 'Ring Mount'}
                        </span>
                      </div>
                    </div>

                    {/* Detents & Stops */}
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">
                        Rotator Detent Options:
                      </span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {h.rotatorDetentOptions}
                      </p>
                    </div>

                    {/* Available degree stops chips */}
                    {h.detentStopsDeg && h.detentStopsDeg.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {h.detentStopsDeg.map((deg, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-400 border border-slate-800"
                          >
                            {deg}° ({Math.round(360 / deg)}s)
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Setup Method */}
                    <div className="flex flex-col gap-0.5 text-xs pt-1 border-t border-slate-800/60">
                      <span className="text-[10px] text-slate-500 font-mono uppercase">Setup Method:</span>
                      <span className="text-slate-300 text-[11px]">{h.setupMethod}</span>
                    </div>

                    {/* Compatibility */}
                    <div className="flex flex-col gap-0.5 text-xs">
                      <span className="text-[10px] text-slate-500 font-mono uppercase">Compatibility:</span>
                      <span className="text-slate-400 text-[11px]">{h.compatibility}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPanoHead(h)}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Active Rig Head</span>
                        </>
                      ) : (
                        <span>Select for Rig</span>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditHeadModal(h)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
                        title="Edit Panoramic Head"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePanoHead(h.id)}
                        disabled={panoHeads.length <= 1}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 disabled:opacity-30 transition"
                        title="Delete Panoramic Head"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Panoramic Head Add / Edit Modal */}
      {headModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-xl w-full shadow-2xl flex flex-col gap-4 my-auto">
            <h3 className="text-lg font-bold text-white">
              {editingHeadId ? 'Edit Panoramic Head' : 'Add Custom Panoramic Head'}
            </h3>
            <form onSubmit={handleSaveHead} className="flex flex-col gap-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Brand / Manufacturer</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fanotec / Nodal Ninja, Manfrotto, Bushman"
                    value={headForm.brand}
                    onChange={(e) => setHeadForm({ ...headForm, brand: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Model Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NN4, Gobi, 303SPH"
                    value={headForm.model}
                    onChange={(e) => setHeadForm({ ...headForm, model: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Head Type</label>
                  <select
                    value={headForm.type}
                    onChange={(e) => setHeadForm({ ...headForm, type: e.target.value as PanoHeadType })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="Multi-row Spherical">Multi-row Spherical</option>
                    <option value="Single-row Ring Mount">Single-row Ring Mount</option>
                    <option value="Single/Multi-row">Single/Multi-row</option>
                    <option value="Slant/Single-row">Slant/Single-row</option>
                    <option value="Multi-row Spherical Gigapixel">Multi-row Spherical Gigapixel</option>
                    <option value="Multi-row Spherical (Gimbal type)">Multi-row Spherical (Gimbal)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Load Capacity</label>
                  <input
                    type="text"
                    placeholder="e.g. ~3.5kg, 8kg, Up to 10kg"
                    value={headForm.loadCapacity}
                    onChange={(e) => setHeadForm({ ...headForm, loadCapacity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Rotator Detent Options</label>
                <input
                  type="text"
                  placeholder="e.g. Interchangeable detent rings (4, 6, 8, 10, 12 stops)"
                  value={headForm.rotatorDetentOptions}
                  onChange={(e) => setHeadForm({ ...headForm, rotatorDetentOptions: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Setup Method</label>
                <input
                  type="text"
                  placeholder="e.g. Sliding rails with mm scales for no-parallax point (NPP)"
                  value={headForm.setupMethod}
                  onChange={(e) => setHeadForm({ ...headForm, setupMethod: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Camera / Lens Compatibility</label>
                <input
                  type="text"
                  placeholder="e.g. Standard DSLRs with standard/wide lenses"
                  value={headForm.compatibility}
                  onChange={(e) => setHeadForm({ ...headForm, compatibility: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Max Upper Rail (mm)</label>
                  <input
                    type="number"
                    value={headForm.upperRailMaxMm}
                    onChange={(e) => setHeadForm({ ...headForm, upperRailMaxMm: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Status</label>
                  <select
                    value={headForm.status}
                    onChange={(e) => setHeadForm({ ...headForm, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Legacy/Active">Legacy/Active</option>
                    <option value="Legacy">Legacy</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={headForm.isRingClamp || false}
                    onChange={(e) => setHeadForm({ ...headForm, isRingClamp: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 accent-amber-500"
                  />
                  <span className="text-slate-300">Lens Ring Clamp (Pre-set NPP)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={headForm.isSlant || false}
                    onChange={(e) => setHeadForm({ ...headForm, isSlant: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 accent-amber-500"
                  />
                  <span className="text-slate-300">Slant Pre-Angled Bracket</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setHeadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition"
                >
                  Save Panoramic Head
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Camera Modal */}
      {cameraModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-xl w-full shadow-2xl flex flex-col gap-4 my-auto">
            <h3 className="text-lg font-bold text-white">Add Custom Camera Body</h3>
            <form onSubmit={handleSaveCamera} className="flex flex-col gap-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Brand</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Canon, Sony"
                    value={cameraForm.brand}
                    onChange={(e) => setCameraForm({ ...cameraForm, brand: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Model</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EOS R6, A7C"
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
                    <option value="Full-Frame">Full-Frame (36x24mm)</option>
                    <option value="APS-C Canon">APS-C Canon (1.61x)</option>
                    <option value="APS-C (Nikon/Sony/Fuji)">APS-C Nikon/Sony/Fuji (1.53x)</option>
                    <option value="Micro Four Thirds">Micro Four Thirds (2.0x)</option>
                    <option value="1 inch">1 inch (2.7x)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Megapixels (MP)</label>
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

      {/* New Lens Modal */}
      {lensModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-xl w-full shadow-2xl flex flex-col gap-4 my-auto">
            <h3 className="text-lg font-bold text-white">Add Custom Lens</h3>
            <form onSubmit={handleSaveLens} className="flex flex-col gap-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Brand</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Samyang, Sigma"
                    value={lensForm.brand}
                    onChange={(e) => setLensForm({ ...lensForm, brand: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Model</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 8mm f/2.8 UMC Fisheye"
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
