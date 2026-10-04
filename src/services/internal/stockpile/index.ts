
import http from '../../index';
import {
  CreateStockpileInput,
  Stockpile,
  StockpileFilters,
  StockpileResponse,
  UpdateStockpileInput,
} from './types';

const stockpileService = {
  getStockpiles: async ({
    offset,
    limit,
    type,
    layerNumber,
  }: {
    offset?: number;
    limit?: number;
  } & StockpileFilters) => {
    const response = await http.get<Stockpile[]>('/api/internal/stockpiles', {
      params: {
        offset,
        limit,
        type,
        layerNumber,
      },
    });

    return {
      data: response.body,
      totalCount: parseInt(response.headers?.get('x-total-count') || '0', 10),
    } as StockpileResponse;
  },
  getStockpile: async (id: string) => {
    return await http.get<Stockpile>('/api/internal/stockpile', {
      params: { id },
    });
  },
  createStockpile: async (body: CreateStockpileInput) => {
    return await http.post<Stockpile>('/api/internal/stockpile', { body });
  },
  updateStockpile: async (body: UpdateStockpileInput) => {
    return await http.put<Stockpile>('/api/internal/stockpile', { body });
  },
  deleteStockpile: async (id: string) => {
    return await http.delete<boolean>('/api/internal/stockpile', {
      body: { id },
    });
  },
};

export default stockpileService;
