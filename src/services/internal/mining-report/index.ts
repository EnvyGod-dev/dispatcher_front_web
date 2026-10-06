import http from '../../index';
import type { Crew, CrewPeriod, CrewPeriodInput, CrewSchedule, MiningReport } from './types';

const miningReportService = {
  /** Уулын ажлын тайлан (хамгийн ихдээ 93 хоног). */
  getReport: async (from: string, to: string) =>
    (await http.get<MiningReport>('/api/internal/mining-report', { params: { from, to } })).body,

  /** Ээлжийн (А/Б/В/Г) хуваарь, одоогийн ээлж. */
  getCrewSchedule: async (weeks = 8, from?: string) =>
    (await http.get<CrewSchedule>('/api/internal/crews/schedule', { params: { weeks: String(weeks), from } })).body,

  // ── Ээлжийн хуваарийг гараар удирдах ─────────────────────
  getCrewPeriods: async (from?: string, to?: string) =>
    (await http.get<CrewPeriod[]>('/api/internal/crews/periods', { params: { from, to } })).body,
  createCrewPeriod: (input: CrewPeriodInput) =>
    http.post<CrewPeriod>('/api/internal/crews/periods', { body: input as unknown as Record<string, unknown> }),
  updateCrewPeriod: (id: string, input: CrewPeriodInput) =>
    http.put<CrewPeriod>(`/api/internal/crews/periods/${id}`, { body: input as unknown as Record<string, unknown> }),
  deleteCrewPeriod: (id: string) => http.delete<CrewPeriod>(`/api/internal/crews/periods/${id}`),
  generateCrewPeriods: (input: { startDate: string; weeks: number; dayOrder: Crew[]; replace: boolean }) =>
    http.post<CrewPeriod[]>('/api/internal/crews/periods/generate', { body: input as unknown as Record<string, unknown> }),
};

export default miningReportService;
