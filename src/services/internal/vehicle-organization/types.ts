export type VehicleOrganization = {
  id: string
  name: string 
  organizationId: string
  vehicleCount: number
  createdAt: string
  updatedAt: string 
}
export type CreateVehicleOrganizationInput = {
  name: string
}

export type VehicleOrganizationResponse = {
  data: VehicleOrganization[]
  totalCount: number
}
