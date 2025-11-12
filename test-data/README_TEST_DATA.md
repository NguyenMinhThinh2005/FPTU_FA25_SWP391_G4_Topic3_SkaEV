# Test Data CSV Files

## 📋 Danh sách file CSV test

### 1. **users.csv**
- 6 users: 3 customers, 2 staff, 1 admin
- Tất cả password: `123456`
- Roles: customer, staff, admin

### 2. **vehicles.csv**
- 8 xe test
- Bao gồm: car (ô tô) và motorcycle (xe máy)
- Brands: VinFast, Tesla, Honda, BMW, Audi, Nissan

### 3. **stations.csv**
- 5 trạm sạc
- Địa điểm: Hanoi, HCMC, Da Nang
- Có tọa độ GPS (latitude, longitude)

### 4. **bookings.csv**
- 5 booking mẫu
- Liên kết user, vehicle, station
- Thời gian: 27-29/10/2025

### 5. **charging_sessions.csv**
- 5 phiên sạc
- Energy consumed, cost, payment status

## 🚀 Cách sử dụng

### **Import vào database:**

```sql
-- Import users (adjust path)
BULK INSERT users
FROM 'D:\University\SWP\FPTU_FA25_SWP391_G4_Topic3_SkaEV\test-data\users.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\n',
    TABLOCK
);
```

### **Test trong API:**

1. **Test Login:**
   - Email: `customer1@test.com`
   - Password: `123456`

2. **Test Add Vehicle:**
   ```json
   {
     "vehicleName": "VinFast VF e34",
     "licensePlate": "29A-12345",
     "vehicleModel": "VF e34",
     "vehicleMake": "VinFast",
     "vehicleType": "car",
     "vehicleYear": 2024,
     "batteryCapacity": 42.0,
     "connectorType": "CCS2",
     "isDefault": true
   }
   ```

3. **Test Create Booking:**
   ```json
   {
     "vehicleId": 1,
     "slotId": 1,
     "stationId": 1,
     "schedulingType": "immediate",
     "scheduledStartTime": "2025-10-27T14:00:00Z",
     "estimatedArrival": "2025-10-27T13:55:00Z",
     "targetSoc": 80,
     "estimatedDuration": 60
   }
   ```

## 📊 Data Statistics

- **Users:** 6 (3 customers, 2 staff, 1 admin)
- **Vehicles:** 8 (6 cars, 2 motorcycles)
- **Stations:** 5 (Hanoi, HCMC, Da Nang)
- **Bookings:** 5
- **Charging Sessions:** 5

## 🔑 Test Accounts

| Email | Password | Role | Full Name |
|-------|----------|------|-----------|
| customer1@test.com | 123456 | customer | Nguyen Van A |
| customer2@test.com | 123456 | customer | Tran Thi B |
| staff1@test.com | 123456 | staff | Pham Thi D |
| admin1@test.com | 123456 | admin | Vu Thi F |

## 🎯 Use Cases Covered

1. ✅ User registration & authentication
2. ✅ Vehicle management (car & motorcycle)
3. ✅ Station search by location
4. ✅ Booking creation (immediate & scheduled)
5. ✅ Charging session tracking
6. ✅ Payment processing

## 📝 Notes

- Tất cả datetime theo format: `YYYY-MM-DD HH:MM:SS`
- GPS coordinates thật từ các địa điểm ở VN
- Connector types: CCS2, CHAdeMO, Type 2
- Vehicle types: car, motorcycle (match CHECK constraint)
