export type Route = {
  id: string
  organizationId: string
  routeCode: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export type CreateRouteInput = {
  routeCode: string
  description?: string
}

export type UpdateRouteInput = {
  id: string
  routeCode?: string
  description?: string
}

export type RouteResponse = {
  data: Route[]
  totalCount: number
}