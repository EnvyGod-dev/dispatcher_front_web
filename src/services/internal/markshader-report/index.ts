import http from "../../index";

export interface MarkshaderReport {
  id: string
  organizationId: string
  reportDate: string
  vehicleId: string
  operatorId: string | null
  masterId: string | null
  blockNumbers: string[] | null
  markProduction: string | null
  disSoil: string | null
  disCoal: string | null
  disReisSoil: number | null
  disReisCoal: number | null
  disTotalProduction: string | null
  disCoefficient: string | null
  markDisDiscrepancy: string | null
  notes: string | null
  recordedBy: string
  createdAt: string
  updatedAt: string
  vehicle?: {
    id: string
    name: string
    mineNumber: string | null
  }
  operatorName?: string | null
  masterName?: string | null
  totalCount?: number
}

export interface MarkshaderReportResponse {
  data: MarkshaderReport[]
  totalCount: number
}

export interface MarkshaderStats {
  totalMarkProduction: number | null
  totalDisSoil: number | null
  totalDisCoal: number | null
  totalDisReisSoil: number | null
  totalDisReisCoal: number | null
  totalDisProduction: number | null
  avgDiscrepancy: number | null
  reportCount: number
}

export interface CreateMarkshaderReportInput {
  reportDate: string
  vehicleId: string
  operatorId?: string
  masterId?: string
  blockNumbers?: string[]
  markProduction: string
  disSoil?: string
  disCoal?: string
  disReisSoil?: number
  disReisCoal?: number
  disTotalProduction?: string
  disCoefficient?: string
  markDisDiscrepancy?: string
  notes?: string
}

export interface UpdateMarkshaderReportInput extends Partial<CreateMarkshaderReportInput> {
  id: string
}

export interface ExcavatorItem {
  vehicleId: string
  vehicleName: string
  mineNumber: string | null
  operatorId: string
  operatorName: string | null
}

export interface ActualProductionResult {
  disSoil: number
  disCoal: number
  disTotalProduction: number
  disReisSoil: number
  disReisCoal: number
  disCoefficient: number
}

export interface ImportResult {
  success: boolean
  inserted: number
  skipped: number
  errors: string[]
  excavatorNames: string[]
}

const markshaderReportService = {
  getReports: async ({
    offset,
    limit,
    startDate,
    endDate,
  }: {
    offset?: number
    limit?: number
    startDate?: string
    endDate?: string
  }): Promise<MarkshaderReportResponse> => {
    const response = await http.get<MarkshaderReport[]>("/api/internal/markshader/reports", {
      params: { offset, limit, startDate, endDate },
    })
    return {
      data: response.body,
      totalCount: parseInt(response.headers?.get("x-total-count") || "0", 10),
    }
  },

  getReportById: async (id: string) => {
    return await http.get<MarkshaderReport>("/api/internal/markshader/report", {
      params: { id },
    })
  },

  getStats: async ({ startDate, endDate }: { startDate?: string; endDate?: string }) => {
    return await http.get<MarkshaderStats>("/api/internal/markshader/stats", {
      params: { startDate, endDate },
    })
  },

  createReport: async (body: CreateMarkshaderReportInput) => {
    return await http.post<MarkshaderReport>("/api/internal/markshader/report", { body })
  },

  updateReport: async (body: UpdateMarkshaderReportInput) => {
    return await http.put<MarkshaderReport>("/api/internal/markshader/reports", { body })
  },

  deleteReport: async (id: string) => {
    return await http.delete<{ message: string }>(`/api/internal/markshader/reports/${id}`)
  },

  getExcavatorsByDate: async (date: string) => {
    const response = await http.get<ExcavatorItem[]>("/api/internal/markshader/excavators", {
      params: { date },
    })
    return response.body
  },

  getActualProductionByVehicle: async ({
    date,
    vehicleId,
  }: {
    date: string
    vehicleId: string
  }) => {
    const response = await http.get<ActualProductionResult>("/api/internal/markshader/actual-production", {
      params: { date, vehicleId },
    })
    return response.body
  },

  importFromExcel: async ({
    file,
    year,
    month,
  }: {
    file: File
    year: string
    month: string
  }): Promise<ImportResult> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('year', year)
    formData.append('month', month)

    const result = await http.request<ImportResult>({
      method: 'POST',
      url: '/api/internal/markshader/import',
      body: formData as unknown as Record<string, unknown>,
    })
    return result.body
  },

  exportToExcel: async ({
    startDate,
    endDate,
    vehicleId,
  }: {
    startDate?: string
    endDate?: string
    vehicleId?: string
  }) => {
    const result = await http.get<string>('/api/internal/markshader/export', {
      params: { startDate, endDate, vehicleId },
    })

    // Base64 эсвэл binary string-ийг blob болгох
    const byteArray = Uint8Array.from(
      atob(result.body as unknown as string),
      (c) => c.charCodeAt(0)
    )
    const blob = new Blob([byteArray], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.download = 'markshader.xlsx'
    a.href = url
    a.click()
    URL.revokeObjectURL(url)
  },
}
export default markshaderReportService