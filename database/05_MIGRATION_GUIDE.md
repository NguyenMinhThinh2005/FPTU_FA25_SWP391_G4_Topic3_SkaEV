# LỘ TRÌNH TÍCH HỢP & MIGRATION GUIDE

## 1. BẢN ĐỒ THAY THẾ MOCK DATA → REAL API

### 1.1 Authentication Flow

| Mock Source                     | Database Query                                                                | API Endpoint              | Notes                          |
| ------------------------------- | ----------------------------------------------------------------------------- | ------------------------- | ------------------------------ |
| `authStore.js:16-42 (login)`    | `SELECT * FROM users WHERE email=? AND password_hash=crypt(?, password_hash)` | `POST /api/auth/login`    | Verify password với bcrypt     |
| `authStore.js:44-82 (register)` | `INSERT INTO users (...) RETURNING *`                                         | `POST /api/auth/register` | Hash password trước khi insert |
| `mockUsers array`               | `users` + `user_profiles` tables                                              | -                         | Split thành 2 tables           |

**Files cần update:**

- `src/store/authStore.js` → Thay mock API calls bằng real API
- `src/services/api.js` hoặc `apiReal.js` → Implement endpoints

---

### 1.2 Station Management

| Mock Source                                   | Database Query                                                                                         | API Endpoint                                          | Frontend Component                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- | ----------------------------------- |
| `stationStore.js:48-54 (fetchStations)`       | `SELECT * FROM v_available_stations WHERE status='active'`                                             | `GET /api/stations`                                   | `FindStations.jsx`                  |
| `stationStore.js:56-84 (fetchNearbyStations)` | `SELECT *, calculate_distance(?, ?, latitude, longitude) as distance FROM charging_stations WHERE ...` | `GET /api/stations/nearby?lat=...&lng=...&radius=...` | `FindStations.jsx`, `Dashboard.jsx` |
| `mockStations[x].charging.chargingPosts`      | `SELECT * FROM charging_posts WHERE station_id=? JOIN charging_slots ON ...`                           | `GET /api/stations/:id/posts`                         | `StationDetail.jsx`                 |
| `mockStations[x].charging.availablePorts`     | Real-time từ `charging_slots.status`                                                                   | `GET /api/stations/:id/availability`                  | Real-time updates                   |

**SQL Migration Query:**

```sql
-- Convert nested mock structure to relational
-- Station 1 post → Insert charging_posts row
-- Station 1 post slots → Insert multiple charging_slots rows
-- Maintain FK relationships
```

**Files cần update:**

- `src/store/stationStore.js:48-84`
- `src/pages/customer/FindStations.jsx`
- `src/pages/admin/StationManagement.jsx`
- `src/services/stationDataService.js`

---

### 1.3 Booking & Charging Flow

| Mock Source                                        | Database Query                                                                                                                         | API Endpoint                            | Frontend Component    |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | --------------------- |
| `bookingStore.js:16-77 (createBooking)`            | `INSERT INTO bookings (...) RETURNING *`                                                                                               | `POST /api/bookings`                    | `ChargingFlow.jsx`    |
| `bookingStore.js:137-160 (scanQRCode)`             | `UPDATE bookings SET status='confirmed', qr_scanned=TRUE, qr_scanned_at=NOW(), slot_id=(SELECT slot_id FROM qr_codes WHERE qr_data=?)` | `POST /api/bookings/:id/scan-qr`        | `QRScannerDemo.jsx`   |
| `bookingStore.js:167-194 (startCharging)`          | `UPDATE bookings SET status='charging', charging_started=TRUE, charging_started_at=NOW(); INSERT INTO soc_tracking (...)`              | `POST /api/bookings/:id/start-charging` | `ChargingSession.jsx` |
| `bookingStore.js:197-246 (updateChargingProgress)` | `UPDATE soc_tracking SET current_soc_percent=?, ...; INSERT INTO soc_charging_history (...)`                                           | `PUT /api/bookings/:id/soc`             | Real-time WebSocket   |
| `bookingStore.js:276-286 (stopCharging)`           | `UPDATE bookings SET status='completed', actual_end_time=NOW(), ...; UPDATE soc_tracking SET status='completed'`                       | `POST /api/bookings/:id/stop-charging`  | `ChargingSession.jsx` |
| `mockBookings array`                               | `bookings` table                                                                                                                       | `GET /api/bookings?customerId=...`      | `BookingHistory.jsx`  |

**Real-time SOC Updates:**

- Frontend: WebSocket connection (`ws://api.skaev.com/soc/:bookingId`)
- Backend: Publish SOC updates every 3 seconds
- Store: `bookingStore.js:197-246 (updateChargingProgress)`

**Files cần update:**

- `src/store/bookingStore.js` (toàn bộ)
- `src/pages/customer/ChargingFlow.jsx`
- `src/pages/customer/ChargingSession.jsx`
- `src/pages/customer/BookingHistory.jsx`
- `src/data/mockAPI.js:231-419 (bookingsAPI, socAPI, qrAPI)`

---

### 1.4 Vehicle Management

| Mock Source                                 | Database Query                                                                                             | API Endpoint                        | Frontend Component      |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------- | ----------------------- |
| `vehicleStore.js:39-50 (addVehicle)`        | `INSERT INTO vehicles (...) RETURNING *`                                                                   | `POST /api/vehicles`                | `VehicleManagement.jsx` |
| `vehicleStore.js:52-68 (updateVehicle)`     | `UPDATE vehicles SET ... WHERE id=?`                                                                       | `PUT /api/vehicles/:id`             | `VehicleManagement.jsx` |
| `vehicleStore.js:70-76 (deleteVehicle)`     | `DELETE FROM vehicles WHERE id=?`                                                                          | `DELETE /api/vehicles/:id`          | `VehicleManagement.jsx` |
| `vehicleStore.js:78-87 (setDefaultVehicle)` | `UPDATE vehicles SET is_default=FALSE WHERE customer_id=?; UPDATE vehicles SET is_default=TRUE WHERE id=?` | `PUT /api/vehicles/:id/set-default` | `VehicleManagement.jsx` |
| `mockUsers[x].vehicle`                      | `vehicles` table                                                                                           | `GET /api/vehicles?customerId=...`  | -                       |

**Files cần update:**

- `src/store/vehicleStore.js`
- `src/pages/customer/VehicleManagement.jsx`

---

### 1.5 Payment & Invoice

| Mock Source                                         | Database Query                                                          | API Endpoint                                       | Frontend Component   |
| --------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------- | -------------------- |
| `mockPaymentMethods array`                          | `SELECT * FROM payment_methods WHERE customer_id=?`                     | `GET /api/payment-methods`                         | `PaymentMethods.jsx` |
| -                                                   | `INSERT INTO payment_methods (...) RETURNING *`                         | `POST /api/payment-methods`                        | `PaymentMethods.jsx` |
| `invoiceService.js:42-76 (generateChargingInvoice)` | `INSERT INTO invoices (...) RETURNING *`                                | `POST /api/invoices` (auto after booking complete) | Backend trigger      |
| -                                                   | `SELECT * FROM invoices WHERE customer_id=? ORDER BY invoice_date DESC` | `GET /api/invoices`                                | `PaymentHistory.jsx` |

**Invoice Generation Flow:**

1. Booking completed → Backend trigger
2. Calculate: subtotal = energy_cost + parking_cost
3. Calculate: tax = subtotal \* 0.1
4. Calculate: total = subtotal + tax
5. Insert invoice with auto-generated invoice_number
6. Send notification

**Files cần update:**

- `src/services/invoiceService.js`
- `src/pages/customer/PaymentHistory.jsx`
- `src/pages/customer/PaymentMethods.jsx`

---

### 1.6 Notification System

| Mock Source                                        | Database Query                                                 | API Endpoint                      | Frontend Component       |
| -------------------------------------------------- | -------------------------------------------------------------- | --------------------------------- | ------------------------ |
| `notificationStore.js:23-44 (addNotification)`     | `INSERT INTO notifications (...) RETURNING *`                  | WebSocket push                    | `NotificationCenter.jsx` |
| `notificationStore.js:46-62 (markAsRead)`          | `UPDATE notifications SET read=TRUE, read_at=NOW() WHERE id=?` | `PUT /api/notifications/:id/read` | `NotificationCenter.jsx` |
| `notificationStore.js:83-107 (updateSettings)`     | `UPDATE notification_settings SET ... WHERE user_id=?`         | `PUT /api/notification-settings`  | `NotificationCenter.jsx` |
| `notificationStore.js:306-357 (send*Notification)` | Backend logic                                                  | WebSocket broadcast               | Backend events           |

**Real-time Architecture:**

- **Transport:** WebSocket (Socket.IO hoặc native WebSocket)
- **Channel:** `/notifications/:userId`
- **Events:**
  - `charging_complete`
  - `booking_reminder`
  - `payment_success`
  - `maintenance_notice`

**Files cần update:**

- `src/store/notificationStore.js`
- `src/components/NotificationCenter.jsx`
- `src/services/notificationService.js`

---

### 1.7 Analytics & Reporting

| Mock Source                                 | Database Query                                                                                                                                                  | API Endpoint                                | Frontend Component      |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ----------------------- |
| `mockAnalytics.systemOverview`              | Complex aggregation từ `bookings`, `charging_stations`                                                                                                          | `GET /api/analytics/overview`               | `Dashboard.jsx` (Admin) |
| `mockAnalytics.revenueData`                 | `SELECT DATE_TRUNC('month', created_at) as month, SUM(total_amount_vnd) as revenue, COUNT(*) as sessions FROM bookings WHERE status='completed' GROUP BY month` | `GET /api/analytics/revenue?period=monthly` | `AdvancedAnalytics.jsx` |
| `mockAnalytics.stationUsage`                | `SELECT station_id, ... FROM bookings GROUP BY station_id`                                                                                                      | `GET /api/analytics/stations`               | `Dashboard.jsx`         |
| `bookingStore.js:370-395 (getBookingStats)` | `SELECT COUNT(*), SUM(energy_delivered_kwh), SUM(total_amount_vnd), ... FROM bookings WHERE customer_id=?`                                                      | `GET /api/customers/:id/stats`              | `CustomerProfile.jsx`   |

**Files cần update:**

- `src/pages/admin/Dashboard.jsx`
- `src/pages/admin/AdvancedAnalytics.jsx`
- `src/pages/customer/Analytics.jsx`
- `src/store/customerStore.js`

---

## 2. API ENDPOINTS CẦN IMPLEMENT

### 2.1 Authentication

```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login with email/password
POST   /api/auth/logout            - Logout
POST   /api/auth/refresh-token     - Refresh JWT
GET    /api/auth/me                - Get current user profile
PUT    /api/auth/profile           - Update profile
POST   /api/auth/forgot-password   - Send reset email
POST   /api/auth/reset-password    - Reset password
```

### 2.2 Stations

```
GET    /api/stations                       - List all stations (with filters)
GET    /api/stations/nearby                - Nearby stations (lat, lng, radius)
GET    /api/stations/:id                   - Station details
GET    /api/stations/:id/availability      - Real-time availability
GET    /api/stations/:id/posts             - All posts and slots
POST   /api/stations                       - Create station (Admin)
PUT    /api/stations/:id                   - Update station
DELETE /api/stations/:id                   - Delete station
GET    /api/stations/:id/pricing           - Current pricing tiers
```

### 2.3 Bookings

```
POST   /api/bookings                       - Create new booking
GET    /api/bookings                       - List bookings (filter by customer/status)
GET    /api/bookings/:id                   - Booking details
PUT    /api/bookings/:id                   - Update booking
POST   /api/bookings/:id/scan-qr           - Scan QR code (confirm slot)
POST   /api/bookings/:id/start-charging    - Start charging session
PUT    /api/bookings/:id/soc               - Update SOC (real-time)
POST   /api/bookings/:id/stop-charging     - Stop charging
DELETE /api/bookings/:id                   - Cancel booking
POST   /api/bookings/:id/rate              - Rate completed booking
```

### 2.4 Vehicles

```
GET    /api/vehicles                       - List customer vehicles
POST   /api/vehicles                       - Add vehicle
GET    /api/vehicles/:id                   - Vehicle details
PUT    /api/vehicles/:id                   - Update vehicle
DELETE /api/vehicles/:id                   - Delete vehicle
PUT    /api/vehicles/:id/set-default       - Set default vehicle
```

### 2.5 Payments & Invoices

```
GET    /api/payment-methods                - List payment methods
POST   /api/payment-methods                - Add payment method
PUT    /api/payment-methods/:id            - Update payment method
DELETE /api/payment-methods/:id            - Delete payment method
PUT    /api/payment-methods/:id/set-default - Set default

GET    /api/invoices                       - List invoices
GET    /api/invoices/:id                   - Invoice details
GET    /api/invoices/:id/pdf               - Download PDF
POST   /api/invoices/:id/send-email        - Resend invoice email
```

### 2.6 Notifications

```
GET    /api/notifications                  - List notifications
PUT    /api/notifications/:id/read         - Mark as read
PUT    /api/notifications/mark-all-read    - Mark all as read
DELETE /api/notifications/:id              - Delete notification
DELETE /api/notifications/clear-all        - Clear all

GET    /api/notification-settings          - Get settings
PUT    /api/notification-settings          - Update settings
```

### 2.7 Analytics

```
GET    /api/analytics/overview             - System overview (Admin)
GET    /api/analytics/revenue              - Revenue analytics
GET    /api/analytics/stations             - Station utilization
GET    /api/analytics/customers/:id/stats  - Customer statistics
GET    /api/analytics/export               - Export report (CSV/Excel)
```

### 2.8 Admin

```
GET    /api/admin/users                    - User management
POST   /api/admin/users                    - Create user
PUT    /api/admin/users/:id                - Update user
DELETE /api/admin/users/:id                - Delete user
PUT    /api/admin/users/:id/role           - Change role
```

---

## 3. KẾ HOẠCH MIGRATION CHI TIẾT

### **Phase 1: Core Setup (Week 1 - Milestone 1)**

#### Day 1-2: Database Setup

- [ ] Provision PostgreSQL 16 instance (local/staging/prod)
- [ ] Install extensions (uuid-ossp, pgcrypto, postgis)
- [ ] Run `03_SCHEMA.sql` - Create all tables, enums, constraints
- [ ] Verify schema với `\d+` commands
- [ ] Run `04_SEED_DATA.sql` - Populate development data
- [ ] Test queries:
  - Nearby stations
  - User authentication
  - Booking flow

#### Day 3-4: Backend API Foundation

- [ ] Setup Node.js/Express hoặc Python/FastAPI hoặc Java/Spring Boot
- [ ] Database connection pool (pg, psycopg2, JDBC)
- [ ] Environment variables (.env)
  ```
  DATABASE_URL=postgresql://user:pass@host:5432/skaev
  JWT_SECRET=...
  BCRYPT_ROUNDS=10
  ```
- [ ] ORM setup (nếu dùng)
  - TypeORM / Prisma (Node.js)
  - SQLAlchemy (Python)
  - Hibernate (Java)

#### Day 5-7: Authentication APIs

- [ ] Implement `/api/auth/*` endpoints
- [ ] JWT token generation + refresh
- [ ] Password hashing (bcrypt)
- [ ] Test với Postman/Insomnia
- [ ] Update frontend `authStore.js` để call real API

**Deliverable:** Authentication working end-to-end

---

### **Phase 2: Station & Booking Core (Week 2 - Milestone 2)**

#### Day 8-10: Station APIs

- [ ] Implement `/api/stations` CRUD
- [ ] Nearby search với PostGIS
- [ ] Real-time availability updates
- [ ] Update frontend `stationStore.js`
- [ ] Test FindStations page với real data

#### Day 11-14: Booking APIs

- [ ] Implement booking creation
- [ ] QR code validation logic
- [ ] Start/stop charging endpoints
- [ ] Update frontend `bookingStore.js`
- [ ] Test ChargingFlow page

**Deliverable:** End-to-end booking flow working

---

### **Phase 3: Real-time Features (Week 3 - Milestone 3)**

#### Day 15-17: SOC Tracking Real-time

- [ ] Setup WebSocket server (Socket.IO)
- [ ] SOC update broadcasts every 3 seconds
- [ ] Frontend WebSocket client
- [ ] Update `ChargingSession.jsx` for real-time SOC
- [ ] Test concurrent charging sessions

#### Day 18-19: Notification System

- [ ] Implement notification push via WebSocket
- [ ] Browser notification permissions
- [ ] Email notification background job
- [ ] SMS notification (optional)
- [ ] Update `NotificationCenter.jsx`

#### Day 20-21: Vehicle & Payment APIs

- [ ] Implement vehicle CRUD
- [ ] Payment method CRUD (PCI-compliant)
- [ ] Invoice generation trigger
- [ ] Update frontend stores

**Deliverable:** Real-time charging + notifications working

---

### **Phase 4: Analytics & Admin (Week 4 - Milestone 4)**

#### Day 22-24: Analytics APIs

- [ ] System overview aggregations
- [ ] Revenue analytics
- [ ] Customer statistics
- [ ] Export functionality (CSV)
- [ ] Update Admin Dashboard

#### Day 25-26: Admin Management

- [ ] User management CRUD
- [ ] Station management for staff
- [ ] Role-based access control (RBAC)
- [ ] Audit logging

#### Day 27-28: Testing & Optimization

- [ ] Load testing (Artillery, k6)
- [ ] Database query optimization
- [ ] Index verification
- [ ] Frontend performance audit

**Deliverable:** Production-ready system

---

## 4. ROLLBACK STRATEGY

### Fallback Mechanism:

```javascript
// src/services/api.js
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === "true";

export const fetchStations = async () => {
  if (USE_MOCK_DATA) {
    return mockAPI.stations.getAll();
  }
  return axios.get("/api/stations");
};
```

### Environment Variables:

```env
# .env.development
VITE_USE_MOCK_DATA=false
VITE_API_BASE_URL=http://localhost:3000

# .env.production
VITE_USE_MOCK_DATA=false
VITE_API_BASE_URL=https://api.skaev.com
```

---

## 5. DATABASE MIGRATION VERSIONING

### Migration Files:

```
database/migrations/
├── 001_initial_schema.sql           (03_SCHEMA.sql)
├── 002_seed_data.sql                (04_SEED_DATA.sql)
├── 003_add_subscription_tables.sql  (future)
├── 004_add_loyalty_points.sql       (future)
└── ...
```

### Migration Tool Options:

1. **Node.js:** node-pg-migrate, db-migrate
2. **Python:** Alembic (SQLAlchemy)
3. **Go:** golang-migrate
4. **SQL only:** Custom bash script

### Rollback Command:

```bash
# Forward migration
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Check migration status
npm run migrate:status
```

---

## 6. MONITORING & OBSERVABILITY

### Metrics to Track:

- **Database:**

  - Query response time (P50, P95, P99)
  - Connection pool usage
  - Slow queries (> 100ms)
  - Table sizes

- **API:**

  - Request rate (requests/sec)
  - Error rate (5xx responses)
  - Endpoint latency
  - WebSocket connections

- **Business:**
  - Active charging sessions
  - Bookings per hour
  - Revenue per day
  - Station utilization %

### Tools:

- **APM:** New Relic, DataDog, Sentry
- **Logging:** ELK Stack, CloudWatch
- **Database:** pgAdmin, Grafana + Prometheus
- **Tracing:** Jaeger, Zipkin

---

## 7. TESTING CHECKLIST

### Unit Tests:

- [ ] Database query functions
- [ ] Business logic (price calculation, SOC updates)
- [ ] Authentication utils

### Integration Tests:

- [ ] API endpoints (all CRUD operations)
- [ ] WebSocket connections
- [ ] Database transactions

### E2E Tests (Playwright/Cypress):

- [ ] User registration + login
- [ ] Find station + create booking
- [ ] Scan QR + start charging
- [ ] Monitor SOC real-time
- [ ] Complete booking + view invoice

### Load Tests:

- [ ] 100 concurrent users
- [ ] 1000 bookings/minute
- [ ] Real-time SOC updates (100 simultaneous sessions)

---

## 8. DEPLOYMENT CHECKLIST

### Pre-deployment:

- [ ] Run all migrations on staging
- [ ] Verify seed data
- [ ] Test all API endpoints
- [ ] Run E2E tests
- [ ] Performance benchmarks

### Deployment:

- [ ] Backup production database
- [ ] Run migrations
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Verify health checks

### Post-deployment:

- [ ] Monitor error rates
- [ ] Check database load
- [ ] Verify real-time features
- [ ] Test critical user flows

---

## 9. DOCUMENTATION DELIVERABLES

- [x] `01_ANALYSIS.md` - Entity analysis + flows
- [x] `02_ERD.md` - Entity Relationship Diagram
- [x] `03_SCHEMA.sql` - Complete DDL
- [x] `04_SEED_DATA.sql` - Development seed data
- [x] `05_MIGRATION_GUIDE.md` - This file
- [ ] `06_API_DOCUMENTATION.md` - OpenAPI/Swagger spec
- [ ] `07_DEPLOYMENT_GUIDE.md` - Infrastructure setup
- [ ] `08_TROUBLESHOOTING.md` - Common issues

---

## 10. CONTACT & SUPPORT

### Migration Team:

- **Database Architect:** [Name]
- **Backend Lead:** [Name]
- **Frontend Lead:** [Name]
- **DevOps:** [Name]

### Support Channels:

- Slack: #skaev-migration
- Jira: SKAEV-MIGRATION project
- Wiki: [link]

---

**Last Updated:** 2024-12-26
**Version:** 1.0
**Status:** ✅ Ready for implementation
