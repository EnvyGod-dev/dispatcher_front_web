export type StockpileType = 'coal' | 'soil' | 'engineering' | 'common' | 'internal' | 'unproductive' | 'blast' | 'humus';

export const stockpileTypeMap = [
  { value: 'coal', label: 'Нүүрс' },
  { value: 'soil', label: 'Хөрс' },
  { value: 'engineering', label: 'Инженерийн ажил' },
  { value: 'common', label: 'Дундын ажил' },
  { value: 'internal', label: 'Дотоод ажил' },
  { value: 'unproductive', label: 'Бүтээлгүй ажил' },
  { value: 'blast', label: 'Тэсэлгээний нурал' },
  { value: 'humus', label: 'Шимт хөрс' },
];

export type Stockpile = {
  id: string;
  organizationId: string;
  type: StockpileType;
  layerNumber: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deactivatedAt: string;
};

export type CreateStockpileInput = {
  type: StockpileType;
  layerNumber: string;
};

export type StockpileResponse = {
  data: Stockpile[];
  totalCount: number;
};

export type StockpileFilters = {
  type?: StockpileType;
  layerNumber?: string;
};

export type UpdateStockpileInput = Partial<Stockpile> & {
  id: string;
};
