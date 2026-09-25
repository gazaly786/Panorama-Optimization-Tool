import React from 'react';
import { VerificationStatus } from '../types';
import { ShieldCheck, Cpu, UserCheck, Eye, Sparkles } from 'lucide-react';

interface ConfidenceBadgeProps {
  status: VerificationStatus;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  source?: string;
  className?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  status,
  confidence = 'HIGH',
  source,
  className = '',
}) => {
  let badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  let icon = <Cpu className="w-3.5 h-3.5" />;

  switch (status) {
    case 'MANUFACTURER DATA':
      badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      icon = <ShieldCheck className="w-3.5 h-3.5" />;
      break;
    case 'MEASURED LENS DATA':
      badgeColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      icon = <Eye className="w-3.5 h-3.5" />;
      break;
    case 'USER VERIFIED':
      badgeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      icon = <UserCheck className="w-3.5 h-3.5" />;
      break;
    case 'CALCULATED':
      badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      icon = <Cpu className="w-3.5 h-3.5" />;
      break;
    case 'ESTIMATED OPTICAL MODEL':
      badgeColor = 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      icon = <Cpu className="w-3.5 h-3.5" />;
      break;
    case 'AI-INFERRED':
      badgeColor = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      icon = <Sparkles className="w-3.5 h-3.5" />;
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono font-medium border ${badgeColor} ${className}`}
      title={source ? `Source: ${source}` : `Confidence: ${confidence}`}
    >
      {icon}
      <span>{status}</span>
    </span>
  );
};
