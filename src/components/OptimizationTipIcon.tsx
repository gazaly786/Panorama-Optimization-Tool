import React from 'react';
import { Info, Sparkles } from 'lucide-react';
import { TipCategoryKey } from './OptimizationTipsOverlay';

interface OptimizationTipIconProps {
  tipKey: TipCategoryKey;
  onClick: (tipKey: TipCategoryKey) => void;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const OptimizationTipIcon: React.FC<OptimizationTipIconProps> = ({
  tipKey,
  onClick,
  label = 'View 360° field tip',
  className = '',
  size = 'sm',
}) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(tipKey);
      }}
      className={`inline-flex items-center justify-center rounded-lg transition-all text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 active:scale-95 group focus:outline-none focus:ring-1 focus:ring-amber-500/50 ${
        size === 'sm' ? 'w-5 h-5 p-0.5' : 'w-6 h-6 p-1'
      } ${className}`}
      title={`${label} (Click for context-aware 360° advice)`}
      aria-label={label}
    >
      <Info className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} group-hover:scale-110 transition-transform`} />
    </button>
  );
};
