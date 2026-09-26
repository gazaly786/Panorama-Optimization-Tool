import React, { useState } from 'react';
import { usePanorama } from '../context/PanoramaContext';
import { LensSpec, ProjectionType } from '../types';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { ExcelGearUploadModal } from '../components/ExcelGearUploadModal';
import {
  Layers,
  Search,
  CheckCircle,
  Eye,
  ArrowRight,
  Plus,
  Scale,
  Sparkles,
  Crosshair,
  FileSpreadsheet,
} from 'lucide-react';

export const LensDatabasePage: React.FC<{ onNavigateToOptimizer: () => void; onNavigateToAdmin: () => void }> = ({
  onNavigateToOptimizer,
  onNavigateToAdmin,
}) => {
  const {
    lenses,
    selectedLens,
    setSelectedLens,
    comparisonLensIds,
    toggleLensComparison,
  } = usePanorama();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjection, setSelectedProjection] = useState<string>('ALL');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [modalLens, setModalLens] = useState<LensSpec | null>(null);
  const [excelModalOpen, setExcelModalOpen] = useState<boolean>(false);

  const filteredLenses = lenses.filter((lens) => {
    const matchesSearch =
      lens.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lens.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lens.lensMount.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lens.projectionType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProjection =
      selectedProjection === 'ALL' ||
      (selectedProjection === 'FISHEYE' && lens.projectionType.startsWith('fisheye')) ||
      (selectedProjection === 'RECTILINEAR' && lens.projectionType === 'rectilinear') ||
      lens.projectionType === selectedProjection;

    const matchesBrand = selectedBrand === 'ALL' || lens.brand.includes(selectedBrand);

    return matchesSearch && matchesProjection && matchesBrand;
  });

  const brands = Array.from(new Set(lenses.map((l) => l.brand.split('/')[0].trim())));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-black text-white">Lens Database</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Browse optical specifications, projection geometry, entrance pupil offsets, and sweet-spot sharpness profiles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExcelModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Upload Excel (.xlsx)</span>
          </button>
          <button
            type="button"
            onClick={onNavigateToAdmin}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add Custom Lens</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search lens (e.g. 'Sigma 8', 'Fisheye', '10-18', 'Laowa')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedProjection}
            onChange={(e) => setSelectedProjection(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Projections</option>
            <option value="FISHEYE">Fisheye Lenses Only (Circular & Fullframe)</option>
            <option value="RECTILINEAR">Rectilinear Ultra-Wides</option>
            <option value="fisheye_circular">Fisheye Circular</option>
            <option value="fisheye_equisolid">Fisheye Equisolid</option>
            <option value="fisheye_stereographic">Fisheye Stereographic</option>
          </select>
        </div>
      </div>

      {/* Lens Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLenses.map((lens) => {
          const isSelected = selectedLens.id === lens.id;
          const isCompared = comparisonLensIds.includes(lens.id);
          const isFisheye = lens.projectionType.startsWith('fisheye');

          return (
            <div
              key={lens.id}
              className={`flex flex-col justify-between p-5 rounded-2xl bg-slate-900/90 border transition-all ${
                isSelected
                  ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-xl'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Brand & Model */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[11px] font-mono uppercase text-slate-400 block font-semibold">
                      {lens.brand}
                    </span>
                    <h3 className="text-base font-black text-white">
                      {lens.model}
                    </h3>
                  </div>
                  <ConfidenceBadge status={lens.provenance.status} source={lens.provenance.source} />
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                    isFisheye
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                  }`}>
                    {lens.projectionType.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {lens.focalLengthMinMm === lens.focalLengthMaxMm
                      ? `${lens.focalLengthMinMm}mm Prime`
                      : `${lens.focalLengthMinMm}–${lens.focalLengthMaxMm}mm Zoom`}
                  </span>
                </div>

                {/* Specs Matrix */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800 mb-4">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Aperture Range</span>
                    <span className="font-bold text-slate-200">f/{lens.maxAperture} – f/{lens.minAperture}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Sweet Spot</span>
                    <span className="font-bold text-amber-400">{lens.sweetSpotAperture || 'f/5.6 - f/8'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Diagonal FOV</span>
                    <span className="font-bold text-sky-400">{lens.manufacturerDFOV ? `${lens.manufacturerDFOV}°` : 'Calculated'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Min Focus</span>
                    <span className="font-bold text-slate-300">{lens.minFocusDistanceM} m</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Entrance Pupil</span>
                    <span className="font-bold text-emerald-400">~{lens.entrancePupilOffsetMm || 45} mm</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Mount</span>
                    <span className="font-bold text-slate-300 truncate block">{lens.lensMount}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setModalLens(lens)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Full Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleLensComparison(lens.id)}
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
                    setSelectedLens(lens);
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

      {/* Lens Modal */}
      {modalLens && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col gap-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">{modalLens.brand}</span>
                <h2 className="text-2xl font-black text-white">{modalLens.model}</h2>
                <div className="mt-1">
                  <ConfidenceBadge status={modalLens.provenance.status} source={modalLens.provenance.source} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalLens(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Projection Type</span>
                <span className="font-bold text-white">{modalLens.projectionType}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Focal Length</span>
                <span className="font-bold text-amber-400">{modalLens.focalLengthMinMm}–{modalLens.focalLengthMaxMm} mm</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Aperture Range</span>
                <span className="font-bold text-white">f/{modalLens.maxAperture} – f/{modalLens.minAperture}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Sweet Spot</span>
                <span className="font-bold text-emerald-400">{modalLens.sweetSpotAperture || 'f/5.6 - f/8'}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Min Focus</span>
                <span className="font-bold text-white">{modalLens.minFocusDistanceM} m</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Entrance Pupil Offset</span>
                <span className="font-bold text-sky-400">~{modalLens.entrancePupilOffsetMm || 45} mm</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Mount</span>
                <span className="font-bold text-white">{modalLens.lensMount}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Weight</span>
                <span className="font-bold text-white">{modalLens.weightG ? `${modalLens.weightG} g` : 'UNKNOWN'}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Stabilization</span>
                <span className="font-bold text-white">{modalLens.opticalStabilization ? 'Yes (IS/VR/OS)' : 'None'}</span>
              </div>
            </div>

            {/* Sharpness Profile */}
            {modalLens.sharpnessProfile && (
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col gap-2">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase">
                  Aperture Sharpness Curve (Optical Profile)
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 text-center text-xs font-mono">
                  {Object.entries(modalLens.sharpnessProfile).map(([ap, rating]) => (
                    <div key={ap} className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">{ap}</span>
                      <span className={`font-bold text-[11px] block mt-0.5 ${
                        rating === 'peak' ? 'text-emerald-400' :
                        rating === 'high' ? 'text-amber-400' :
                        rating === 'good' ? 'text-sky-400' :
                        rating === 'diffraction_reduced' ? 'text-rose-400' : 'text-slate-400'
                      }`}>
                        {rating.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400">
              <strong className="text-slate-300">Data Source:</strong> {modalLens.provenance.source}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalLens(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedLens(modalLens);
                  setModalLens(null);
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

      {/* Excel Upload Modal */}
      <ExcelGearUploadModal
        isOpen={excelModalOpen}
        onClose={() => setExcelModalOpen(false)}
      />
    </div>
  );
};
