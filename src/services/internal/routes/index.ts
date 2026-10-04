import http from "../../index";
import { 
  CreateRouteInput, 
  Route, 
  RouteResponse, 
  UpdateRouteInput 
} from './types';

const routeService = {
  getRoutes: async ({ 
    offset, 
    limit 
  }: { 
    offset?: number; 
    limit?: number 
  }) => {
    const response = await http.get<Route[]>("/api/internal/routes", {
      params: {
        offset, 
        limit
      } 
    })

    return {
      data: response.body,
      totalCount: parseInt(response.headers?.get("x-total-count") || "0", 10),
    } as RouteResponse
  },
  
  getRoute: async (id: string) => {
    return await http.get<Route>("/api/internal/route", {
      params: { id },
    }) 
  },
  
  createRoute: async (body: CreateRouteInput) => {
    return await http.post<Route>("/api/internal/route", { body })
  },
  
  updateRoute: async (body: UpdateRouteInput) => {
    return await http.put<Route>("/api/internal/route", { body })
  },
  
  deleteRoute: async (id: string) => {
    return await http.delete<boolean>("/api/internal/route", { 
      body: { id } 
    })
  }
}

export default routeService