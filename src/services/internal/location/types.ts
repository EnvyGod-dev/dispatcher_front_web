export type LocationType =   'pick_up' | 'drop_off'| 'both'

export type Location = {
  id: string 
  name: string 
  code: string 
  type: LocationType
  description: string 
  isActive: boolean 
  latitude: string 
  longitude: string 
  createdAt: string
}

export type CreateLocationInput = {
  name:string,
  code:string,
  type: LocationType
  description:string,
  latitude:string
  longitude:string
}

export type LocationResponse = {
  data: Location[] 
  totalCount: number
}

export type UpdateLocationType = CreateLocationInput & {
  id: string
}