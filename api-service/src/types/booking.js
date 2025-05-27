// filepath: api-service/src/types/booking.js
export interface Booking {
  id: string;
  userId: string;
  vehicleId: string;
  pickupLocation: string;
  dropoffLocation: string;
  startTime: string; // ISO 8601 format
  endTime: string; // ISO 8601 format
  status: 'pending' | 'confirmed' | 'canceled';
}

export interface BookingResponse {
  success: boolean;
  message?: string;
  booking?: Booking;
}