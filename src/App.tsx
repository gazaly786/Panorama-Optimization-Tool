import React, { useState } from 'react';
import { PanoramaProvider, usePanorama } from './context/PanoramaContext';
import { Navigation, PageId } from './components/Navigation';
import { OptimizerPage } from './pages/OptimizerPage';
import { CameraDatabasePage } from './pages/CameraDatabasePage';
import { LensDatabasePage } from './pages/LensDatabasePage';
import { EquipmentBuilderPage } from './pages/EquipmentBuilderPage';
import { OpticalCalculatorPage } from './pages/OpticalCalculatorPage';
import { PanoramaCalculatorPage } from './pages/PanoramaCalculatorPage';
import { ShootingConditionsPage } from './pages/ShootingConditionsPage';
import { AdvancedSettingsPage } from './pages/AdvancedSettingsPage';
import { AiKnowledgePage } from './pages/AiKnowledgePage';
import { SavedSetupsPage } from './pages/SavedSetupsPage';
import { AdminDatabasePage } from './pages/AdminDatabasePage';
import { ComparisonPage } from './pages/ComparisonPage';
import { ExcelGearUploadModal } from './components/ExcelGearUploadModal';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('optimizer');
  const [excelModalOpen, setExcelModalOpen] = useState<boolean>(false);
  const { isDarkMode } = usePanorama();

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} flex flex-col font-sans transition-colors duration-200`}>
      <Navigation
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        onOpenExcelModal={() => setExcelModalOpen(true)}
      />

      <main className="flex-1 w-full">
        {currentPage === 'optimizer' && <OptimizerPage />}
        {currentPage === 'cameras' && (
          <CameraDatabasePage
            onNavigateToOptimizer={() => setCurrentPage('optimizer')}
            onNavigateToAdmin={() => setCurrentPage('admin')}
          />
        )}
        {currentPage === 'lenses' && (
          <LensDatabasePage
            onNavigateToOptimizer={() => setCurrentPage('optimizer')}
            onNavigateToAdmin={() => setCurrentPage('admin')}
          />
        )}
        {currentPage === 'builder' && (
          <EquipmentBuilderPage onNavigateToOptimizer={() => setCurrentPage('optimizer')} />
        )}
        {currentPage === 'optical' && <OpticalCalculatorPage />}
        {currentPage === 'panorama' && <PanoramaCalculatorPage />}
        {currentPage === 'conditions' && (
          <ShootingConditionsPage onNavigateToOptimizer={() => setCurrentPage('optimizer')} />
        )}
        {currentPage === 'advanced' && <AdvancedSettingsPage />}
        {currentPage === 'knowledge' && <AiKnowledgePage />}
        {currentPage === 'saved' && (
          <SavedSetupsPage onNavigateToOptimizer={() => setCurrentPage('optimizer')} />
        )}
        {currentPage === 'admin' && <AdminDatabasePage />}
        {currentPage === 'compare' && (
          <ComparisonPage onNavigateToOptimizer={() => setCurrentPage('optimizer')} />
        )}
      </main>

      {/* Global Excel Import Modal */}
      <ExcelGearUploadModal
        isOpen={excelModalOpen}
        onClose={() => setExcelModalOpen(false)}
      />

      {/* Footer with Creator Attribution */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-5 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span className="font-bold text-slate-300">PanoOptix™ Professional Optical Engine</span>
            <span className="text-slate-600 hidden sm:inline">·</span>
            <span className="text-amber-400 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Created by Gazaly Samsadeen
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Master Optical Database & Field Verification by Gazaly Samsadeen
          </span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <PanoramaProvider>
      <AppContent />
    </PanoramaProvider>
  );
}
