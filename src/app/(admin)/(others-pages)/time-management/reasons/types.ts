import type {
  ReasonType,
  RepairReasonCategory,
} from '@/services/internal/equipment-shift-log';

/**
 * Технологийн сул зогсолт → цаг ашиглалт (idle-reasons).
 * Техникийн сул зогсолт, засварын төрөл → засвар (repair-reasons).
 */
export type ReasonCategory = 'technological_idle' | RepairReasonCategory;

export const reasonCategoryOptions: {
  value: ReasonCategory;
  label: string;
  hint: string;
}[] = [
  {
    value: 'technological_idle',
    label: 'Технологийн сул зогсолт',
    hint: 'Цаг ашиглалт руу орно',
  },
  {
    value: 'technical_idle',
    label: 'Техникийн сул зогсолт',
    hint: 'Засвар руу орно',
  },
  {
    value: 'repair',
    label: 'Засварын төрөл',
    hint: 'Засвар руу орно',
  },
];

export const reasonCategoryLabel = (category: ReasonCategory) =>
  reasonCategoryOptions.find((option) => option.value === category)?.label ??
  category;

export const isIdleCategory = (category: ReasonCategory) =>
  category === 'technological_idle';

export type ReasonRow = ReasonType & { rowCategory: ReasonCategory };
