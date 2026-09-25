import React, { useState } from 'react';
import { usePanorama } from '../context/PanoramaContext';
import { CameraSpec, SensorFormat } from '../types';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import {
  Camera,
  Search,
  SlidersHorizontal,
  CheckCircle,
  Eye,
  ArrowRight,
  ShieldCheck,
  Plus,
  Scale,
  Cpu,
} from 'lucide-react';

export const CameraDatabasePage: React.FC<{ onNavigateToOptimizer: () => void; onNavigateToAdmin: () => void }> = ({
  onNavigateToOptimizer,
  onNavigateToAdmin,
}) => {
  const {
    cameras,
    selectedCamera,
    setSelectedCamera,
    comparisonCameraIds,
    toggleCameraComparison,
  } = usePanorama();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('ALL');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [modalCamera, setModalCamera] = useState<CameraSpec | null>(null);

  // Filter cameras
  const filteredCameras = cameras.filter((cam) => {
    const matchesSearch =
      cam.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.sensorFormat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.lensMount.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFormat = selectedFormat === 'ALL' || cam.sensorFormat === selectedFormat;
    const matchesBrand = selectedBrand === 'ALL' || cam.brand === selectedBrand;

    return matchesSearch && matchesFormat && matchesBrand;
  });

  const brands = Array.from(new Set(cameras.map((c) => c.brand)));
  const sensorFormats = Array.from(new Set(cameras.map((c) => c.sensorFormat)));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-black text-white">Camera Database</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Browse, search, and inspect complete technical specifications and sensor geometry for verified panorama camera bodies.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToAdmin}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Add Custom Camera</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        {/* Search Input */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search camera (e.g. '90D', 'Sony', 'APS-C', 'Z8')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Brand Filter */}
        <div className="sm:col-span-3">
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Brands ({brands.length})</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Format Filter */}
        <div className="sm:col-span-3">
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Sensor Formats</option>
            {sensorFormats.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Camera Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCameras.map((camera) => {
          const isSelected = selectedCamera.id === camera.id;
          const isCompared = comparisonCameraIds.includes(camera.id);

          return (
            <div
              key={camera.id}
              className={`flex flex-col justify-between p-5 rounded-2xl bg-slate-900/90 border transition-all ${
                isSelected
                  ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-xl'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Card Top: Brand, Model, Badges */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[11px] font-mono uppercase text-slate-400 block font-semibold">
                      {camera.brand}
                    </span>
                    <h3 className="text-lg font-black text-white">
                      {camera.model}
                    </h3>
                  </div>
                  <ConfidenceBadge status={camera.provenance.status} source={camera.provenance.source} />
                </div>

                <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-800 text-slate-300 mb-3 border border-slate-700">
                  {camera.sensorFormat} · {camera.cameraType}
                </div>

                {/* Key Optical & Sensor Specifications */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800 mb-4">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Resolution</span>
                    <span className="font-bold text-slate-200">{camera.megapixels} MP ({camera.nativeResolution.join('×')})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Crop Factor</span>
                    <span className="font-bold text-amber-400">{camera.cropFactor}x</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Pixel Pitch</span>
                    <span className="font-bold text-sky-400">{camera.pixelPitchUm} μm</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Sensor Dimensions</span>
                    <span className="font-bold text-slate-300">{camera.sensorWidthMm} × {camera.sensorHeightMm} mm</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">AEB Capability</span>
                    <span className="font-bold text-emerald-400">{camera.aebCapability ? `Up to ${camera.maxAebFrameCount}f ±${camera.maxAebRangeEv}EV` : 'No'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Native ISO</span>
                    <span className="font-bold text-slate-300">ISO {camera.nativeIso}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setModalCamera(camera)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Full Specs</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleCameraComparison(camera.id)}
                  className={`p-2 rounded-xl border transition ${
                    isCompared
                      ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                      : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                  }`}
                  title={isCompared ? 'Remove from Comparison' : 'Add to Side-by-Side Comparison'}
                >
                  <Scale className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCamera(camera);
                    onNavigateToOptimizer();
                  }}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </>
                  ) : (
                    <>
                      <span>Select</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Specs Modal */}
      {modalCamera && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col gap-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">{modalCamera.brand}</span>
                <h2 className="text-2xl font-black text-white">{modalCamera.model}</h2>
                <div className="mt-1">
                  <ConfidenceBadge status={modalCamera.provenance.status} source={modalCamera.provenance.source} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalCamera(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Sensor Format</span>
                <span className="font-bold text-white">{modalCamera.sensorFormat}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Crop Factor</span>
                <span className="font-bold text-amber-400">{modalCamera.cropFactor}x</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Sensor Dimensions</span>
                <span className="font-bold text-white">{modalCamera.sensorWidthMm} × {modalCamera.sensorHeightMm} mm</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Megapixels</span>
                <span className="font-bold text-white">{modalCamera.megapixels} MP</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Pixel Dimensions</span>
                <span className="font-bold text-white">{modalCamera.nativeResolution[0]} × {modalCamera.nativeResolution[1]} px</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Pixel Pitch</span>
                <span className="font-bold text-sky-400">{modalCamera.pixelPitchUm} μm</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Native ISO</span>
                <span className="font-bold text-white">ISO {modalCamera.nativeIso}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">ISO Range</span>
                <span className="font-bold text-white">{modalCamera.isoRange[0]} – {modalCamera.isoRange[1]}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Dynamic Range</span>
                <span className="font-bold text-emerald-400">{modalCamera.dynamicRangeEv ? `${modalCamera.dynamicRangeEv} EV` : 'UNKNOWN'}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">RAW Support</span>
                <span className="font-bold text-white">{modalCamera.rawSupport ? `Yes (${modalCamera.rawBitDepth || 14}-bit)` : 'No'}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">IBIS (Sensor Shift)</span>
                <span className="font-bold text-white">{modalCamera.ibis ? 'Yes' : 'No'}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">AEB Capability</span>
                <span className="font-bold text-white">{modalCamera.aebCapability ? `${modalCamera.maxAebFrameCount} frames up to ±${modalCamera.maxAebRangeEv} EV` : 'No'}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Mirror Lock-Up</span>
                <span className="font-bold text-white">{modalCamera.mirrorLockUp ? 'Supported' : 'N/A (Mirrorless)'}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Electronic Shutter</span>
                <span className="font-bold text-white">{modalCamera.electronicShutter ? 'Available' : 'No'}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Self-Timer</span>
                <span className="font-bold text-white">{modalCamera.selfTimerSeconds.join('s, ')}s</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Lens Mount</span>
                <span className="font-bold text-white">{modalCamera.lensMount}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Body Weight</span>
                <span className="font-bold text-white">{modalCamera.weightG ? `${modalCamera.weightG} g` : 'UNKNOWN'}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Provenance</span>
                <span className="font-bold text-white">{modalCamera.provenance.status}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400">
              <strong className="text-slate-300">Data Provenance Source:</strong> {modalCamera.provenance.source}
              {modalCamera.provenance.dateVerified && ` (Verified: ${modalCamera.provenance.dateVerified})`}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalCamera(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCamera(modalCamera);
                  setModalCamera(null);
                  onNavigateToOptimizer();
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition"
              >
                Use in Optimizer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
