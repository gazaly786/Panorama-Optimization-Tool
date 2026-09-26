import React from 'react';
import {
  Compass,
  Camera,
  Layers,
  Wrench,
  Calculator,
  Globe,
  SunMedium,
  Sliders,
  Sparkles,
  Bookmark,
  Database,
  ArrowLeftRight,
  Sun,
  Moon,
  FileSpreadsheet,
} from 'lucide-react';
import { usePanorama } from '../context/PanoramaContext';

export type PageId =
  | 'optimizer'
  | 'cameras'
  | 'lenses'
  | 'builder'
  | 'optical'
  | 'panorama'
  | 'conditions'
  | 'advanced'
  | 'knowledge'
  | 'saved'
  | 'admin'
  | 'compare';

interface NavigationProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  onOpenExcelModal?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onSelectPage, onOpenExcelModal }) => {
  const { selectedCamera, selectedLens, isDarkMode, toggleTheme } = usePanorama();

  const navItems: { id: PageId; label: string; icon: React.ReactNode; shortLabel?: string }[] = [
    { id: 'optimizer', label: '1. Optimizer', icon: <Compass className="w-4 h-4" /> },
    { id: 'cameras', label: '2. Cameras', icon: <Camera className="w-4 h-4" /> },
    { id: 'lenses', label: '3. Lenses', icon: <Layers className="w-4 h-4" /> },
    { id: 'builder', label: '4. Rig Builder', icon: <Wrench className="w-4 h-4" /> },
    { id: 'optical', label: '5. Optics & DOF', icon: <Calculator className="w-4 h-4" /> },
    { id: 'panorama', label: '6. Pano Geometry', icon: <Globe className="w-4 h-4" /> },
    { id: 'conditions', label: '7. Scenarios', icon: <SunMedium className="w-4 h-4" /> },
    { id: 'advanced', label: '8. Advanced', icon: <Sliders className="w-4 h-4" /> },
    { id: 'knowledge', label: '9. AI Knowledge', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'saved', label: '10. Saved Rigs', icon: <Bookmark className="w-4 h-4" /> },
    { id: 'admin', label: '11. Admin DB', icon: <Database className="w-4 h-4" /> },
    { id: 'compare', label: 'Compare', icon: <ArrowLeftRight className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-md">
      {/* Top branding bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onSelectPage('optimizer')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-md">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-black text-base text-white tracking-tight">PANO<span className="text-amber-400">OPTIX</span></span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold">
                  PRO
                </span>
                <span className="hidden md:inline-flex items-center text-[10px] font-semibold text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  By Gazaly Samsadeen
                </span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-0.5 flex items-center gap-1.5">
                <span>Panorama Camera & Lens Optical Optimization Engine</span>
                <span className="md:hidden text-amber-400 font-bold">· Gazaly Samsadeen</span>
              </p>
            </div>
          </div>
        </div>

        {/* Current Active Rig Summary Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono">
          <span className="text-slate-400">Active Rig:</span>
          <span className="font-bold text-slate-200">{selectedCamera.brand} {selectedCamera.model}</span>
          <span className="text-slate-600">+</span>
          <span className="font-bold text-amber-400">{selectedLens.model}</span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          {onOpenExcelModal && (
            <button
              type="button"
              onClick={onOpenExcelModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold transition shadow-sm"
              title="Import Camera and Lens Database from Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import Excel</span>
              <span className="sm:hidden">Excel</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
            title="Toggle Dark / Light Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-none flex items-center gap-1 pb-2">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectPage(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
