// filepath: api-service/src/types/vehicle.js
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  type: string;
  capacity: number;
  features: string[];
}

export interface VehicleResponse {
  vehicles: Vehicle[];
  total: number;
  page: number;
  pageSize: number;
}