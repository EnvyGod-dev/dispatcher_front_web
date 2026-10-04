export interface MarkshaderReport {
  id: string
  organizationId: string
  actualProduction: string | null
  disVolume: string | null
  loadingSiteMeasurement: string | null
  dispatcherMarkshaderDiscrepancy: string | null
  notes: string | null
  attachmentUrls: string[] | null
  recordedBy: string
  createdAt: string
  updatedAt: string
}

export interface MarkshaderReportResponse {
  data: MarkshaderReport[]
  totalCount: number
}

export interface MarkshaderStats {
  totalActualProduction: number
  totalDisVolume: number
  totalLoadingSite: number
  totalDumpingSite: number
  avgDispatcherDiscrepancy: number
  reportCount: number
}

export interface CreateMarkshaderReportInput {
  loadingSiteMeasurement: string
  actualProduction?: string
  disVolume?: string
  dispatcherMarkshaderDiscrepancy?: string
  notes?: string
  attachmentUrls?: string[]
}

export interface UpdateMarkshaderReportInput extends Partial<CreateMarkshaderReportInput> {
  id: string
}