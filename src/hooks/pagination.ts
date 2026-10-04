import { useState } from "react"

interface PaginationConfig {
  initialPage?: number
  initialPageSize?: number
}

interface PaginationResult {
  page: number
  pageSize: number
  offset: number
  limit: number
  paginate: (newPage: number, newPageSize: number) => void
  reset: () => void
}

export function usePagination({
  initialPage = 1,
  initialPageSize = 20,
}: PaginationConfig = {}): PaginationResult {
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const paginate = (newPage: number, newPageSize: number) => {
    setPage(newPage)
    setPageSize(newPageSize)
  }

  const reset = () => {
    setPage(initialPage)
    setPageSize(initialPageSize)
  }

  return {
    page,
    pageSize,
    offset: pageSize * (page - 1),
    limit: pageSize,
    paginate,
    reset,
  }
}
