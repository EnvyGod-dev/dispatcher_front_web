import http from '@/services';
import { EndShiftInput, Shift, ShiftResponse, StartShiftInput } from './types';

const shiftService = {
  getShifts: async ({ offset, limit }: { offset?: number; limit?: number }) => {
    const response = await http.get<Shift[]>("/api/internal/shifts", {
      params: {
        offset, limit
      } 
    })

    return {
      data: response.body,
      totalCount: parseInt(response.headers?.get("x-total-count") || "0", 10),
    } as ShiftResponse
  },
  startShift: async (body: StartShiftInput) => {
    return await http.post<Shift>("/api/internal/shift/start", { body })
  },
  endShift: async (body: EndShiftInput) => {
    return await http.post<Shift>("/api/internal/shift/end", {body})
  }
}

export default shiftService