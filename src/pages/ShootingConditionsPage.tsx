import React, { useState } from 'react';
import { usePanorama } from '../context/PanoramaContext';
import { PanoramaScenario } from '../types';
import {
  SunMedium,
  CheckCircle,
  ArrowRight,
  Sliders,
  Layers,
  Camera,
  Sun,
  Moon,
  Building2,
  Home,
  Utensils,
  ShoppingBag,
  Trees,
} from 'lucide-react';

export const ShootingConditionsPage: React.FC<{ onNavigateToOptimizer: () => void }> = ({
  onNavigateToOptimizer,
}) => {
  const { scenarios, selectedScenario, setSelectedScenario } = usePanorama();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = ['ALL', 'Interior', 'Exterior', 'Commercial', 'Landscape', 'Specialty'];

  const filteredScenarios = scenarios.filter(
    (s) => selectedCategory === 'ALL' || s.category === selectedCategory
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <SunMedium className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-black text-white">Shooting Conditions & Scenario Presets</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Select from 15 curated real-world panorama photography scenarios to instantly optimize exposure EV, bracket settings, and overlap thresholds.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat === 'ALL' ? 'All Scenarios (15)' : cat}
          </button>
        ))}
      </div>

      {/* Scenario Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredScenarios.map((sc) => {
          const isSelected = selectedScenario.id === sc.id;

          return (
            <div
              key={sc.id}
              className={`flex flex-col justify-between p-5 rounded-2xl bg-slate-900/90 border transition-all ${
                isSelected
                  ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-xl'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {sc.category}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    EV {sc.lightLevelEv}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-1.5">{sc.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {sc.description}
                </p>

                {/* Specs Matrix */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800 mb-4">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Typical Distance</span>
                    <span className="font-bold text-slate-200">{sc.defaultSubjectDistanceM} m</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Recommended Overlap</span>
                    <span className="font-bold text-amber-400">{sc.recommendedOverlapPct}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">AEB / HDR</span>
                    <span className="font-bold text-sky-400">
                      {sc.recommendedAeb.enabled ? `${sc.recommendedAeb.frames}f ±${sc.recommendedAeb.evStep}EV` : 'Single Frame'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Quality Mode</span>
                    <span className="font-bold text-emerald-400">{sc.qualityPriority.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 text-[11px] text-slate-400">
                  <strong className="text-slate-300">Field Note:</strong> {sc.notes}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedScenario(sc);
                    onNavigateToOptimizer();
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Active in Optimizer</span>
                    </>
                  ) : (
                    <>
                      <span>Apply Scenario & Optimize</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
