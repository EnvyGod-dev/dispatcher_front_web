import { StockpileType } from '@/services/internal/stockpile/types';

interface StockpileLabelProps {
  type: StockpileType;
  layerNumber: string;
  className?: string;
}

export default function StockpileLabel({
  type,
  layerNumber,
  className,
}: StockpileLabelProps) {
  const typeLabel = type === 'soil' ? 'Хөрс' : 'Нүүрс';
  const tagClasses =
    type === 'coal'
      ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';

  return (
    <div
      className={`flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 ${className}`}
    >
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${tagClasses}`}>
        {typeLabel}
      </span>
      <span className="px-2 py-0.5 rounded text-xs font-medium">
        #{layerNumber}
      </span>
    </div>
  );
}
