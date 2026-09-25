import React from 'react';

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  helperText?: string;
  presetValues?: { label: string; value: number }[];
  displayValueOverride?: string;
  badgeText?: string;
  badgeColor?: string;
  className?: string;
}

export const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  helperText,
  presetValues,
  displayValueOverride,
  badgeText,
  badgeColor = 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-2 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          {label}
        </label>
        <div className="flex items-center gap-2">
          {badgeText && (
            <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border ${badgeColor}`}>
              {badgeText}
            </span>
          )}
          <span className="font-mono text-sm font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-lg border border-amber-400/20">
            {displayValueOverride || `${value}${unit ? ` ${unit}` : ''}`}
          </span>
        </div>
      </div>

      <div className="relative flex items-center py-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        />
      </div>

      {presetValues && presetValues.length > 0 && (
        <div className="flex items-center justify-between gap-1 mt-0.5 overflow-x-auto pb-1 text-[11px]">
          {presetValues.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChange(preset.value)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors shrink-0 ${
                Math.abs(value - preset.value) < (step / 2 || 0.001)
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {helperText && (
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {helperText}
        </p>
      )}
    </div>
  );
};
