import React from 'react';
import { FovVisualizer } from './FovVisualizer';

interface FovVisualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FovVisualizerModal: React.FC<FovVisualizerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <FovVisualizer isModal onCloseModal={onClose} />
    </div>
  );
};
