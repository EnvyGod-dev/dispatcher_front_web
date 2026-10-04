export type LocationType = 'pick_up' | 'drop_off' | 'both';

export const blockTypeMap = [
  { value: 'pick_up', label: 'Тэсэлгээний блок (Ачих)' },
  { value: 'drop_off', label: 'Овоолгын блок (Буулгах)' },
  { value: 'both', label: 'Хоёулаа' },
];

export const materialTypeMap = [
  { value: 'coal', label: 'Нүүрс' },
  { value: 'soil', label: 'Хөрс' },
];

export type MiningBlock = {
  id: string;
  name: string;
  type: string;
  layerNumber: string;
  isActive: boolean;
  latitude: string | null;
  longitude: string | null;
  createdAt: string;
  updatedAt: string;
  description: string | null;
  organizationId?: string;
  linkedPlanCount?: number;
};

export type MiningBlockFilters = {
  search?: string;
  isActive?: boolean;
  layerNumber?: string;
};

export type CreateMiningBlockInput = {
  name: string;
  layerNumber?: string;
  description?: string;
  latitude?: string;
  longitude?: string;
};

export type MiningBlockResponse = {
  data: MiningBlock[];
  totalCount: number;
};

export type UpdateMiningBlockInput = Partial<CreateMiningBlockInput> & {
  id: string;
};
