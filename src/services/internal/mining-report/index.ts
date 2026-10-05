import http from '../../index';
import type { CrewSchedule, MiningReport } from './types';

const miningReportService = {
  /** Уулын ажлын тайлан (хамгийн ихдээ 93 хоног). */
  getReport: async (from: string, to: string) =>
    (await http.get<MiningReport>('/api/internal/mining-report', { params: { from, to } })).body,

  /** Ээлжийн (А/Б/В/Г) хуваарь, одоогийн ээлж. */
  getCrewSchedule: async (weeks = 8) =>
    (await http.get<CrewSchedule>('/api/internal/crews/schedule', { params: { weeks: String(weeks) } })).body,
};

export default miningReportService;
