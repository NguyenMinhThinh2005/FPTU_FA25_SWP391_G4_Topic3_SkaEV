export const mockData = {
  users: [
    {
      userId: 1,
      fullName: 'Nguyen Van A',
      email: 'nguyenvana@example.com',
    },
    {
      userId: 2,
      fullName: 'Tran Thi B',
      email: 'tranthib@example.com',
    }
  ],
  bookings: [
    {
      bookingId: 101,
      stationId: 1,
      slotId: 11,
      userId: 1,
      status: 'completed',
      actualStartTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      actualEndTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 45).toISOString(),
      totalEnergyKwh: 12.5,
      totalAmount: 187500 // VND
    },
    {
      bookingId: 102,
      stationId: 1,
      slotId: 12,
      userId: 2,
      status: 'in_progress',
      actualStartTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      actualEndTime: null,
      totalEnergyKwh: 0,
      totalAmount: 0
    }
  ]
};
