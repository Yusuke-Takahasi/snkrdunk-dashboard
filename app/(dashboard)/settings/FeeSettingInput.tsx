'use client';

type FeeSettingInputProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  suffix: '%' | '円';
};

export function FeeSettingInput({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  suffix,
}: FeeSettingInputProps) {
  const stepForSuffix = suffix === '%' ? 0.5 : 100;
  const effectiveStep = step ?? stepForSuffix;

  const handleDecrement = () => {
    const next = Math.max(min, value - effectiveStep);
    onChange(suffix === '%' ? Math.round(next * 100) / 100 : next);
  };

  const handleIncrement = () => {
    const next = value + effectiveStep;
    onChange(suffix === '%' ? Math.round(next * 100) / 100 : next);
  };

  return (
    <div className="flex flex-col gap-1.5 p-3 bg-slate-50 rounded-lg min-w-0">
      <span className="text-sm font-medium text-slate-700 whitespace-nowrap">{label}</span>
      <div className="flex items-center gap-1 w-fit">
        <button
          type="button"
          onClick={handleDecrement}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors font-medium"
          aria-label={`${label}を減らす`}
        >
          −
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const n = parseFloat(e.target.value);
            if (!Number.isNaN(n)) onChange(n);
          }}
          step={effectiveStep}
          min={min}
          className="w-24 px-2 py-2 text-right border border-slate-300 rounded-lg bg-white text-slate-900 font-mono tabular-nums focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <span className="text-sm text-slate-500 w-6">{suffix}</span>
        <button
          type="button"
          onClick={handleIncrement}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors font-medium"
          aria-label={`${label}を増やす`}
        >
          +
        </button>
      </div>
    </div>
  );
}
