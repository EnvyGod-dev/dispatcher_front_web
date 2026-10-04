
import http from "../../index";
import { CreateLocationInput, Location, LocationResponse, UpdateLocationType } from './types';

const locationService = {
getLocations: async ({ offset, limit }: { offset?: number; limit?: number }) => {
  const response = await http.get<Location[]>("/api/internal/locations", {
    params: {
      offset, limit
    } 
  })


  return {
    data: response.body,
    totalCount: parseInt(response.headers?.get("x-total-count") || "0", 10),
  } as LocationResponse
},
getLocation: async (id: string) => {
  return await http.get<Location>("/api/internal/location", {
    params: { id },
  }) 
},
createLocation: async (body: CreateLocationInput) => {
  return await http.post<Location>("/api/admin/location", { body })
},
updateLocation: async (body: UpdateLocationType) => {
  return await http.put<Location>("/api/admin/location", { body })
},
deleteLocation: async (id: string) => {
  return await http.delete<boolean>("/api/admin/location", { body: { id } })
}
}

export default locationService
