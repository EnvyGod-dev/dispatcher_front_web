import http from '../../index';
import {
  CreateMiningSectionInput,
  MiningSection,
  MiningSectionResponse,
} from './types';

const miningSectionService = {
  getMiningSections: async ({
    limit,
    offset,
  }: {
    limit?: number;
    offset?: number;
  }) => {
    const response = await http.get<MiningSection[]>(
      '/api/internal/mining-sections',
      {
        params: { limit, offset },
      }
    );

    return {
      data: response.body,
      totalCount: parseInt(response.headers?.get('x-total-count') || '0', 25),
    } as MiningSectionResponse;
  },
  createMiningSection: async (body: CreateMiningSectionInput) => {
    return await http.post<CreateMiningSectionInput>(
      '/api/internal/mining-section',
      { body }
    );
  },
  updateMiningSection: async (body: { id: string; name: string }) => {
    return await http.put<CreateMiningSectionInput>(
      '/api/internal/mining-section',
      { body }
    );
  },
  deleteMiningSection: async (id: string) => {
    return await http.delete<boolean>('/api/internal/mining-section', {
      body: { id },
    });
  },
};

export default miningSectionService;
