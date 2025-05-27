import BookingService from '../../src/services/BookingService';

describe('BookingService', () => {
  let bookingService;

  beforeEach(() => {
    bookingService = new BookingService();
  });

  test('should create a booking successfully', async () => {
    const bookingData = { /* mock booking data */ };
    const response = await bookingService.createBooking(bookingData);
    expect(response).toHaveProperty('id');
    expect(response).toHaveProperty('status', 'confirmed');
  });

  test('should retrieve a booking successfully', async () => {
    const bookingId = '12345';
    const response = await bookingService.getBooking(bookingId);
    expect(response).toHaveProperty('id', bookingId);
  });

  test('should update a booking successfully', async () => {
    const bookingId = '12345';
    const updatedData = { /* mock updated data */ };
    const response = await bookingService.updateBooking(bookingId, updatedData);
    expect(response).toHaveProperty('id', bookingId);
    expect(response).toHaveProperty('status', 'updated');
  });

  test('should cancel a booking successfully', async () => {
    const bookingId = '12345';
    const response = await bookingService.cancelBooking(bookingId);
    expect(response).toHaveProperty('id', bookingId);
    expect(response).toHaveProperty('status', 'canceled');
  });

  test('should handle errors when creating a booking', async () => {
    const bookingData = { /* invalid booking data */ };
    await expect(bookingService.createBooking(bookingData)).rejects.toThrow('Error creating booking');
  });

  test('should handle errors when retrieving a booking', async () => {
    const bookingId = 'invalid-id';
    await expect(bookingService.getBooking(bookingId)).rejects.toThrow('Error retrieving booking');
  });

  test('should handle errors when updating a booking', async () => {
    const bookingId = 'invalid-id';
    const updatedData = { /* mock updated data */ };
    await expect(bookingService.updateBooking(bookingId, updatedData)).rejects.toThrow('Error updating booking');
  });

  test('should handle errors when canceling a booking', async () => {
    const bookingId = 'invalid-id';
    await expect(bookingService.cancelBooking(bookingId)).rejects.toThrow('Error canceling booking');
  });
});