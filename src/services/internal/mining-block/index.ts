
import http from '../../index';
import {
  CreateMiningBlockInput,
  MiningBlock,
  MiningBlockFilters,
  MiningBlockResponse,
  UpdateMiningBlockInput,
} from './types';

const miningBlockService = {
  getMiningBlocks: async ({
    offset,
    limit,
    search,
    isActive,
    layerNumber,
  }: { offset?: number; limit?: number } & MiningBlockFilters) => {
    const response = await http.get<MiningBlock[]>('/api/internal/mining-blocks', {
      params: {
        offset,
        limit,
        search,
        isActive,
        layerNumber,
      },
    });

    return {
      data: response.body,
      totalCount: parseInt(response.headers?.get('x-total-count') || '0', 10),
    } as MiningBlockResponse;
  },
  createMiningBlock: async (body: CreateMiningBlockInput) => {
    return await http.post<MiningBlock>('/api/internal/mining-block', { body });
  },
  updateMiningBlock: async (body: UpdateMiningBlockInput) => {
    return await http.put<MiningBlock>('/api/internal/mining-block', { body });
  },
  deleteMiningBlock: async (id: string) => {
    return await http.delete<boolean>('/api/internal/mining-block', {
      body: { id },
    });
  },
};

export default miningBlockService;
