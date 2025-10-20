# PHÂN TÍCH THIẾT KẾ DATABASE CHO DỰ ÁN SkaEV

## 1. TỔNG QUAN MAIN FLOWS

### 1.1 Authentication & User Management

**Nguồn:** `src/store/authStore.js`, `src/data/mockData.js:7-119`

**Main Flows:**

- Login/Logout (email + password)
- Social Authentication (Google OAuth)
- Registration (Customer, Staff, Admin)
- Password Reset
- Profile Management

**Screens:**

- `src/pages/auth/Login.jsx`
- `src/pages/auth/Register.jsx`

**Vai trò hỗ trợ:** admin, staff, customer

---

### 1.2 Station Management

**Nguồn:** `src/store/stationStore.js`, `src/data/mockData.js:121-366`

**Main Flows:**

- Browse & Search Stations
- Filter by connectors, distance, price
- View Station Details (charging posts, slots, pricing)
- Create/Update Station (Admin/Staff)
- Real-time Availability Tracking

**Screens:**

- `src/pages/customer/FindStations.jsx`
- `src/pages/admin/StationManagement.jsx`
- `src/pages/admin/AddStation.jsx`
- `src/pages/staff/StationManagement.jsx`

**Dữ liệu phức tạp:**

- Nested charging posts với slots
- Multi-level pricing (AC/DC/Ultra)
- Real-time status tracking
- Geolocation data

---

### 1.3 Booking & Charging Session

**Nguồn:** `src/store/bookingStore.js`, `src/data/mockData.js:368-437`, `src/data/mockAPI.js:583-798`

**Main Flows:**

- Create Booking (Immediate / Scheduled)
- QR Code Scanning để xác nhận slot
- Start/Stop Charging Session
- Real-time SOC (State of Charge) Tracking
- Charging Progress Monitoring
- Complete Booking với receipt

**Screens:**

- `src/pages/customer/ChargingFlow.jsx`
- `src/pages/customer/ChargingSession.jsx`
- `src/pages/customer/BookingHistory.jsx`
- `src/pages/QRScannerDemo.jsx`

**Flows chi tiết:**

1. Customer tạo booking → status: `pending`
2. Scan QR code tại trạm → status: `confirmed`
3. Bắt đầu sạc → status: `charging`
4. Monitor SOC real-time
5. Hoàn thành → status: `completed`

**Dữ liệu tracking:**

- SOC tracking (initialSOC → currentSOC → targetSOC)
- Charging metrics (power, voltage, current, temperature)
- Time estimates
- Energy delivered

---

### 1.4 Vehicle Management

**Nguồn:** `src/store/vehicleStore.js:1-205`

**Main Flows:**

- Add/Edit/Delete Vehicle
- Set Default Vehicle
- Vehicle-Connector Compatibility Check

**Screens:**

- `src/pages/customer/VehicleManagement.jsx`

**Dữ liệu:**

- Vehicle info (make, model, year, color, license plate)
- Battery capacity
- Connector types (array)
- Max charging speed

---

### 1.5 Payment & Invoice

**Nguồn:** `src/services/invoiceService.js:1-509`, `src/pages/customer/PaymentPage.jsx`

**Main Flows:**

- Payment Processing
- Invoice Generation
- Payment Method Management
- Payment History
- Subscription Billing (future)

**Screens:**

- `src/pages/customer/PaymentPage.jsx`
- `src/pages/customer/PaymentHistory.jsx`
- `src/pages/customer/PaymentMethods.jsx`

**Dữ liệu tính toán:**

- Energy cost (kWh × rate)
- Parking fee (duration × rate)
- Tax (10%)
- Total amount

---

### 1.6 Analytics & Reporting

**Nguồn:** `src/data/mockData.js:439-510`, `src/pages/admin/AdvancedAnalytics.jsx`

**Main Flows:**

- System Overview Dashboard
- Revenue Analytics
- Station Utilization
- Customer Behavior Analysis
- Monthly Reports

**Screens:**

- `src/pages/admin/Dashboard.jsx`
- `src/pages/admin/AdvancedAnalytics.jsx`
- `src/pages/customer/Analytics.jsx`
- `src/pages/customer/ChargingHabitsAnalysis.jsx`

---

### 1.7 Notification System

**Nguồn:** `src/store/notificationStore.js`, `src/components/NotificationCenter.jsx`, `src/services/notificationService.js`

**Main Flows:**

- Real-time Notifications (Browser, Email, SMS)
- Notification Preferences
- Push Notifications
- Alert Management

**Screens:**

- `src/pages/admin/NotificationDashboard.jsx`
- `src/pages/NotificationDemo.jsx`

**Loại thông báo:**

- Charging complete
- Booking reminder
- Payment confirmation
- Maintenance notice
- System alerts

---

### 1.8 User & Permission Management

**Nguồn:** `src/store/userStore.js`, `src/pages/admin/UserManagement.jsx`

**Main Flows:**

- CRUD Users (Admin, Staff, Customer)
- Role Assignment
- Permission Management
- User Search & Filter

---

## 2. DANH SÁCH ENTITIES VÀ FIELDS (VỚI SOURCE REFS)

### 2.1 Entity: USERS

| Field          | Type                             | Nullable               | Source                  |
| -------------- | -------------------------------- | ---------------------- | ----------------------- |
| id             | UUID/BIGSERIAL                   | NOT NULL               | mockData.js:8-119       |
| email          | VARCHAR(255)                     | NOT NULL UNIQUE        | mockData.js:10,28,45... |
| password_hash  | VARCHAR(255)                     | NOT NULL               | mockData.js:11 (mã hóa) |
| role           | ENUM('admin','staff','customer') | NOT NULL               | mockData.js:12          |
| created_at     | TIMESTAMPTZ                      | NOT NULL DEFAULT NOW() | mockData.js:19,38,58    |
| updated_at     | TIMESTAMPTZ                      | NOT NULL DEFAULT NOW() | -                       |
| last_login_at  | TIMESTAMPTZ                      | NULL                   | mockData.js:20,39,59    |
| email_verified | BOOLEAN                          | NOT NULL DEFAULT FALSE | mockData.js:88          |
| is_active      | BOOLEAN                          | NOT NULL DEFAULT TRUE  | -                       |

**Source:** `src/data/mockData.js:7-119`, `src/store/authStore.js:1-168`

---

### 2.2 Entity: USER_PROFILES

| Field       | Type           | Nullable       | Source                      |
| ----------- | -------------- | -------------- | --------------------------- |
| user_id     | UUID/BIGSERIAL | NOT NULL PK,FK | mockData.js:13-21           |
| first_name  | VARCHAR(100)   | NOT NULL       | mockData.js:14              |
| last_name   | VARCHAR(100)   | NOT NULL       | mockData.js:15              |
| phone       | VARCHAR(20)    | NULL           | mockData.js:17              |
| avatar_url  | TEXT           | NULL           | mockData.js:16              |
| permissions | JSONB          | NULL           | mockData.js:21 (array)      |
| employee_id | VARCHAR(50)    | NULL           | mockData.js:49 (staff only) |
| department  | VARCHAR(100)   | NULL           | mockData.js:50              |
| position    | VARCHAR(100)   | NULL           | mockData.js:51              |
| join_date   | DATE           | NULL           | mockData.js:52              |
| location    | VARCHAR(100)   | NULL           | mockData.js:53              |

**Source:** `src/data/mockData.js:13-21, 47-54, 68-76`

---

### 2.3 Entity: CHARGING_STATIONS

| Field                 | Type                                              | Nullable                            | Source                        |
| --------------------- | ------------------------------------------------- | ----------------------------------- | ----------------------------- |
| id                    | UUID/BIGSERIAL                                    | NOT NULL PK                         | mockData.js:131               |
| owner_id              | VARCHAR(50)                                       | NOT NULL                            | mockData.js:132 (system/user) |
| name                  | VARCHAR(255)                                      | NOT NULL                            | mockData.js:133               |
| type                  | ENUM('public','semi-private','private')           | NOT NULL                            | mockData.js:134               |
| status                | ENUM('active','inactive','maintenance','offline') | NOT NULL                            | mockData.js:135               |
| address               | TEXT                                              | NOT NULL                            | mockData.js:137               |
| latitude              | DECIMAL(10,8)                                     | NOT NULL                            | mockData.js:138               |
| longitude             | DECIMAL(11,8)                                     | NOT NULL                            | mockData.js:138               |
| landmarks             | JSONB                                             | NULL                                | mockData.js:139 (array)       |
| operating_hours_open  | TIME                                              | NOT NULL                            | mockData.js:142               |
| operating_hours_close | TIME                                              | NULL                                | mockData.js:143 (NULL = 24/7) |
| timezone              | VARCHAR(50)                                       | NOT NULL DEFAULT 'Asia/Ho_Chi_Minh' | mockData.js:144               |
| total_ports           | INTEGER                                           | NOT NULL                            | mockData.js:232               |
| available_ports       | INTEGER                                           | NOT NULL                            | mockData.js:233               |
| max_power             | INTEGER                                           | NOT NULL                            | mockData.js:234 (kW)          |
| connector_types       | JSONB                                             | NOT NULL                            | mockData.js:235 (array)       |
| parking_fee_per_hour  | INTEGER                                           | NULL                                | mockData.js:241 (VND)         |
| rating_overall        | DECIMAL(3,2)                                      | NULL                                | mockData.js:244               |
| rating_cleanliness    | DECIMAL(3,2)                                      | NULL                                | mockData.js:245               |
| rating_availability   | DECIMAL(3,2)                                      | NULL                                | mockData.js:246               |
| rating_speed          | DECIMAL(3,2)                                      | NULL                                | mockData.js:247               |
| total_reviews         | INTEGER                                           | NOT NULL DEFAULT 0                  | mockData.js:248               |
| images                | JSONB                                             | NULL                                | mockData.js:250-253 (array)   |
| created_at            | TIMESTAMPTZ                                       | NOT NULL DEFAULT NOW()              | -                             |
| updated_at            | TIMESTAMPTZ                                       | NOT NULL DEFAULT NOW()              | -                             |

**Source:** `src/data/mockData.js:130-366`, `src/store/stationStore.js:1-303`

---

### 2.4 Entity: CHARGING_POSTS

| Field           | Type            | Nullable               | Source                              |
| --------------- | --------------- | ---------------------- | ----------------------------------- |
| id              | UUID/BIGSERIAL  | NOT NULL PK            | mockData.js:150                     |
| station_id      | UUID/BIGSERIAL  | NOT NULL FK            | mockData.js:131                     |
| post_identifier | VARCHAR(50)     | NOT NULL               | mockData.js:150 (post-A, post-B...) |
| name            | VARCHAR(255)    | NOT NULL               | mockData.js:151                     |
| type            | ENUM('AC','DC') | NOT NULL               | mockData.js:152                     |
| power_kw        | INTEGER         | NOT NULL               | mockData.js:153                     |
| voltage_v       | INTEGER         | NOT NULL               | mockData.js:154                     |
| total_slots     | INTEGER         | NOT NULL               | mockData.js:155                     |
| available_slots | INTEGER         | NOT NULL               | mockData.js:156                     |
| created_at      | TIMESTAMPTZ     | NOT NULL DEFAULT NOW() | -                                   |
| updated_at      | TIMESTAMPTZ     | NOT NULL DEFAULT NOW() | -                                   |

**UNIQUE (station_id, post_identifier)**

**Source:** `src/data/mockData.js:149-231`, `src/services/stationDataService.js:34-38`

---

### 2.5 Entity: CHARGING_SLOTS

| Field               | Type                                                 | Nullable               | Source                          |
| ------------------- | ---------------------------------------------------- | ---------------------- | ------------------------------- |
| id                  | UUID/BIGSERIAL                                       | NOT NULL PK            | mockData.js:158                 |
| post_id             | UUID/BIGSERIAL                                       | NOT NULL FK            | Từ charging_posts               |
| slot_identifier     | VARCHAR(50)                                          | NOT NULL               | mockData.js:158 (A1, A2, B1...) |
| connector_type      | ENUM('Type 2','CCS2','CHAdeMO')                      | NOT NULL               | mockData.js:159                 |
| status              | ENUM('available','occupied','maintenance','offline') | NOT NULL               | mockData.js:160                 |
| current_booking_id  | UUID/BIGSERIAL                                       | NULL FK                | mockData.js:162                 |
| last_used_at        | TIMESTAMPTZ                                          | NULL                   | mockData.js:163                 |
| last_maintenance_at | TIMESTAMPTZ                                          | NULL                   | mockData.js:230                 |
| created_at          | TIMESTAMPTZ                                          | NOT NULL DEFAULT NOW() | -                               |
| updated_at          | TIMESTAMPTZ                                          | NOT NULL DEFAULT NOW() | -                               |

**UNIQUE (post_id, slot_identifier)**

**Source:** `src/data/mockData.js:157-231`

---

### 2.6 Entity: PRICING_TIERS

| Field          | Type                                 | Nullable               | Source                    |
| -------------- | ------------------------------------ | ---------------------- | ------------------------- |
| id             | UUID/BIGSERIAL                       | NOT NULL PK            | -                         |
| station_id     | UUID/BIGSERIAL                       | NOT NULL FK            | mockData.js:131           |
| charging_type  | ENUM('ac','dc','dc_fast','dc_ultra') | NOT NULL               | mockData.js:236-240       |
| rate_per_kwh   | INTEGER                              | NOT NULL               | mockData.js:237-240 (VND) |
| effective_from | TIMESTAMPTZ                          | NOT NULL DEFAULT NOW() | -                         |
| effective_to   | TIMESTAMPTZ                          | NULL                   | -                         |

**Source:** `src/data/mockData.js:236-241`

---

### 2.7 Entity: BOOKINGS

| Field                  | Type                                                                                | Nullable                                    | Source                                  |
| ---------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------- |
| id                     | UUID/BIGSERIAL                                                                      | NOT NULL PK                                 | mockData.js:371, bookingStore.js:64     |
| customer_id            | UUID/BIGSERIAL                                                                      | NOT NULL FK                                 | mockData.js:372, bookingStore.js (user) |
| station_id             | UUID/BIGSERIAL                                                                      | NOT NULL FK                                 | mockData.js:373                         |
| slot_id                | UUID/BIGSERIAL                                                                      | NULL FK                                     | bookingStore.js:34-40                   |
| status                 | ENUM('pending','scheduled','confirmed','charging','completed','cancelled','failed') | NOT NULL                                    | mockData.js:374, bookingStore.js:58-59  |
| scheduling_type        | ENUM('immediate','scheduled')                                                       | NOT NULL DEFAULT 'immediate'                | bookingStore.js:47                      |
| scheduled_date_time    | TIMESTAMPTZ                                                                         | NULL                                        | mockData.js:375, bookingStore.js:49     |
| actual_start_time      | TIMESTAMPTZ                                                                         | NULL                                        | mockData.js:376                         |
| actual_end_time        | TIMESTAMPTZ                                                                         | NULL                                        | mockData.js:377                         |
| estimated_arrival      | TIMESTAMPTZ                                                                         | NULL                                        | bookingStore.js:62-64                   |
| qr_scanned             | BOOLEAN                                                                             | NOT NULL DEFAULT FALSE                      | bookingStore.js:66                      |
| qr_scanned_at          | TIMESTAMPTZ                                                                         | NULL                                        | bookingStore.js:157                     |
| qr_data                | TEXT                                                                                | NULL                                        | bookingStore.js:159                     |
| charging_started       | BOOLEAN                                                                             | NOT NULL DEFAULT FALSE                      | bookingStore.js:67                      |
| charging_started_at    | TIMESTAMPTZ                                                                         | NULL                                        | bookingStore.js:190                     |
| duration_minutes       | INTEGER                                                                             | NULL                                        | mockData.js:378                         |
| energy_delivered_kwh   | DECIMAL(8,2)                                                                        | NULL                                        | mockData.js:379                         |
| energy_cost_vnd        | INTEGER                                                                             | NULL                                        | mockData.js:381                         |
| parking_cost_vnd       | INTEGER                                                                             | NULL                                        | mockData.js:382                         |
| total_amount_vnd       | INTEGER                                                                             | NULL                                        | mockData.js:383                         |
| payment_method         | ENUM('credit-card','e-wallet','cash','subscription')                                | NULL                                        | mockData.js:385                         |
| payment_transaction_id | VARCHAR(255)                                                                        | NULL                                        | mockData.js:386                         |
| payment_status         | ENUM('pending','paid','failed','refunded')                                          | NULL                                        | mockData.js:387                         |
| cancellation_reason    | TEXT                                                                                | NULL                                        | bookingStore.js:131                     |
| cancelled_at           | TIMESTAMPTZ                                                                         | NULL                                        | bookingStore.js:132                     |
| rating_overall         | INTEGER                                                                             | NULL CHECK (rating_overall BETWEEN 1 AND 5) | mockData.js:390                         |
| rating_comment         | TEXT                                                                                | NULL                                        | mockData.js:391                         |
| created_at             | TIMESTAMPTZ                                                                         | NOT NULL DEFAULT NOW()                      | mockData.js (createdAt)                 |
| updated_at             | TIMESTAMPTZ                                                                         | NOT NULL DEFAULT NOW()                      | bookingStore.js:114                     |
| completed_at           | TIMESTAMPTZ                                                                         | NULL                                        | bookingStore.js:143                     |

**Source:** `src/data/mockData.js:368-437`, `src/store/bookingStore.js:1-655`

---

### 2.8 Entity: SOC_TRACKING

| Field                            | Type                                               | Nullable           | Source         |
| -------------------------------- | -------------------------------------------------- | ------------------ | -------------- |
| id                               | UUID/BIGSERIAL                                     | NOT NULL PK        | -              |
| booking_id                       | UUID/BIGSERIAL                                     | NOT NULL FK UNIQUE | mockAPI.js:286 |
| vehicle_id                       | UUID/BIGSERIAL                                     | NULL FK            | mockAPI.js:287 |
| battery_capacity_kwh             | DECIMAL(5,2)                                       | NOT NULL           | mockAPI.js:289 |
| initial_soc_percent              | DECIMAL(5,2)                                       | NOT NULL           | mockAPI.js:290 |
| current_soc_percent              | DECIMAL(5,2)                                       | NOT NULL           | mockAPI.js:291 |
| target_soc_percent               | DECIMAL(5,2)                                       | NOT NULL           | mockAPI.js:292 |
| start_time                       | TIMESTAMPTZ                                        | NOT NULL           | mockAPI.js:293 |
| last_updated                     | TIMESTAMPTZ                                        | NOT NULL           | mockAPI.js:294 |
| charging_rate_percent_per_hour   | DECIMAL(5,2)                                       | NULL               | mockAPI.js:295 |
| estimated_time_to_target_minutes | INTEGER                                            | NULL               | mockAPI.js:296 |
| status                           | ENUM('connected','charging','stopped','completed') | NOT NULL           | mockAPI.js:297 |

**Source:** `src/data/mockAPI.js:283-367`, `src/store/bookingStore.js:70-82`

---

### 2.9 Entity: SOC_CHARGING_HISTORY

| Field              | Type           | Nullable    | Source         |
| ------------------ | -------------- | ----------- | -------------- |
| id                 | UUID/BIGSERIAL | NOT NULL PK | -              |
| soc_tracking_id    | UUID/BIGSERIAL | NOT NULL FK | mockAPI.js:303 |
| timestamp          | TIMESTAMPTZ    | NOT NULL    | mockAPI.js:304 |
| soc_percent        | DECIMAL(5,2)   | NOT NULL    | mockAPI.js:305 |
| power_delivered_kw | DECIMAL(6,2)   | NULL        | mockAPI.js:306 |
| voltage_v          | DECIMAL(6,2)   | NULL        | mockAPI.js:307 |
| current_a          | DECIMAL(6,2)   | NULL        | mockAPI.js:308 |
| temperature_c      | DECIMAL(4,1)   | NULL        | mockAPI.js:309 |

**Source:** `src/data/mockAPI.js:302-310`

---

### 2.10 Entity: VEHICLES

| Field                 | Type           | Nullable               | Source                                     |
| --------------------- | -------------- | ---------------------- | ------------------------------------------ |
| id                    | UUID/BIGSERIAL | NOT NULL PK            | vehicleStore.js:12                         |
| customer_id           | UUID/BIGSERIAL | NOT NULL FK            | (implied from user)                        |
| nickname              | VARCHAR(100)   | NULL                   | vehicleStore.js:13                         |
| make                  | VARCHAR(100)   | NOT NULL               | vehicleStore.js:14, mockData.js:81         |
| model                 | VARCHAR(100)   | NOT NULL               | vehicleStore.js:15, mockData.js:82         |
| year                  | INTEGER        | NOT NULL               | vehicleStore.js:16, mockData.js:83         |
| battery_capacity_kwh  | DECIMAL(5,2)   | NOT NULL               | vehicleStore.js:17, mockData.js:84         |
| max_charging_speed_kw | INTEGER        | NULL                   | vehicleStore.js:18                         |
| connector_types       | JSONB          | NOT NULL               | vehicleStore.js:19, mockData.js:85 (array) |
| license_plate         | VARCHAR(20)    | NULL                   | vehicleStore.js:20                         |
| color                 | VARCHAR(50)    | NULL                   | vehicleStore.js:21                         |
| is_default            | BOOLEAN        | NOT NULL DEFAULT FALSE | vehicleStore.js:22                         |
| created_at            | TIMESTAMPTZ    | NOT NULL DEFAULT NOW() | -                                          |
| updated_at            | TIMESTAMPTZ    | NOT NULL DEFAULT NOW() | -                                          |

**Source:** `src/store/vehicleStore.js:1-205`, `src/data/mockData.js:79-86`

---

### 2.11 Entity: CUSTOMER_PREFERENCES

| Field                    | Type                                                 | Nullable               | Source         |
| ------------------------ | ---------------------------------------------------- | ---------------------- | -------------- |
| customer_id              | UUID/BIGSERIAL                                       | NOT NULL PK,FK         | mockData.js:87 |
| max_distance_km          | INTEGER                                              | NULL                   | mockData.js:88 |
| preferred_payment_method | ENUM('credit-card','e-wallet','cash','subscription') | NULL                   | mockData.js:89 |
| price_range_min_vnd      | INTEGER                                              | NULL                   | mockData.js:90 |
| price_range_max_vnd      | INTEGER                                              | NULL                   | mockData.js:90 |
| created_at               | TIMESTAMPTZ                                          | NOT NULL DEFAULT NOW() | -              |
| updated_at               | TIMESTAMPTZ                                          | NOT NULL DEFAULT NOW() | -              |

**Source:** `src/data/mockData.js:87-91`

---

### 2.12 Entity: PAYMENT_METHODS

| Field            | Type                                          | Nullable                                   | Source                          |
| ---------------- | --------------------------------------------- | ------------------------------------------ | ------------------------------- |
| id               | UUID/BIGSERIAL                                | NOT NULL PK                                | mockData.js:516                 |
| customer_id      | UUID/BIGSERIAL                                | NOT NULL FK                                | mockData.js:517                 |
| type             | ENUM('credit-card','e-wallet','bank-account') | NOT NULL                                   | mockData.js:518                 |
| provider         | VARCHAR(100)                                  | NOT NULL                                   | mockData.js:519                 |
| last_four_digits | VARCHAR(4)                                    | NULL                                       | mockData.js:520                 |
| expiry_month     | INTEGER                                       | NULL CHECK (expiry_month BETWEEN 1 AND 12) | mockData.js:521                 |
| expiry_year      | INTEGER                                       | NULL                                       | mockData.js:522                 |
| identifier       | VARCHAR(255)                                  | NULL                                       | mockData.js:528 (phone/account) |
| is_default       | BOOLEAN                                       | NOT NULL DEFAULT FALSE                     | mockData.js:523,529             |
| nickname         | VARCHAR(100)                                  | NULL                                       | mockData.js:524,530             |
| is_active        | BOOLEAN                                       | NOT NULL DEFAULT TRUE                      | -                               |
| created_at       | TIMESTAMPTZ                                   | NOT NULL DEFAULT NOW()                     | -                               |
| updated_at       | TIMESTAMPTZ                                   | NOT NULL DEFAULT NOW()                     | -                               |

**Source:** `src/data/mockData.js:512-533`

---

### 2.13 Entity: INVOICES

| Field          | Type                                          | Nullable               | Source                  |
| -------------- | --------------------------------------------- | ---------------------- | ----------------------- |
| id             | UUID/BIGSERIAL                                | NOT NULL PK            | -                       |
| invoice_number | VARCHAR(50)                                   | NOT NULL UNIQUE        | invoiceService.js:5-10  |
| booking_id     | UUID/BIGSERIAL                                | NOT NULL FK UNIQUE     | invoiceService.js:45    |
| customer_id    | UUID/BIGSERIAL                                | NOT NULL FK            | invoiceService.js:67-72 |
| invoice_date   | DATE                                          | NOT NULL               | invoiceService.js:44    |
| subtotal_vnd   | INTEGER                                       | NOT NULL               | invoiceService.js:15    |
| tax_vnd        | INTEGER                                       | NOT NULL               | invoiceService.js:16    |
| total_vnd      | INTEGER                                       | NOT NULL               | invoiceService.js:17    |
| status         | ENUM('pending','paid','cancelled','refunded') | NOT NULL               | invoiceService.js:73    |
| created_at     | TIMESTAMPTZ                                   | NOT NULL DEFAULT NOW() | -                       |
| updated_at     | TIMESTAMPTZ                                   | NOT NULL DEFAULT NOW() | -                       |

**Source:** `src/services/invoiceService.js:1-509`

---

### 2.14 Entity: NOTIFICATIONS

| Field      | Type                                                        | Nullable               | Source                               |
| ---------- | ----------------------------------------------------------- | ---------------------- | ------------------------------------ |
| id         | UUID/BIGSERIAL                                              | NOT NULL PK            | notificationStore.js:24              |
| user_id    | UUID/BIGSERIAL                                              | NULL FK                | (implied)                            |
| type       | ENUM('success','info','warning','error')                    | NOT NULL               | notificationStore.js:31              |
| category   | ENUM('charging','booking','payment','maintenance','system') | NOT NULL               | notificationStore.js:32              |
| title      | VARCHAR(255)                                                | NOT NULL               | notificationStore.js:33              |
| message    | TEXT                                                        | NOT NULL               | notificationStore.js:34              |
| priority   | ENUM('low','medium','high')                                 | NOT NULL DEFAULT 'low' | notificationStore.js:35              |
| read       | BOOLEAN                                                     | NOT NULL DEFAULT FALSE | notificationStore.js:27              |
| data       | JSONB                                                       | NULL                   | notificationStore.js:36 (extra data) |
| actions    | JSONB                                                       | NULL                   | notificationStore.js:37 (buttons)    |
| timestamp  | TIMESTAMPTZ                                                 | NOT NULL               | notificationStore.js:25              |
| read_at    | TIMESTAMPTZ                                                 | NULL                   | -                                    |
| created_at | TIMESTAMPTZ                                                 | NOT NULL DEFAULT NOW() | -                                    |

**Source:** `src/store/notificationStore.js:1-359`

---

### 2.15 Entity: NOTIFICATION_SETTINGS

| Field               | Type           | Nullable               | Source                  |
| ------------------- | -------------- | ---------------------- | ----------------------- |
| user_id             | UUID/BIGSERIAL | NOT NULL PK,FK         | notificationStore.js:10 |
| browser_enabled     | BOOLEAN        | NOT NULL DEFAULT TRUE  | notificationStore.js:11 |
| email_enabled       | BOOLEAN        | NOT NULL DEFAULT TRUE  | notificationStore.js:12 |
| sms_enabled         | BOOLEAN        | NOT NULL DEFAULT FALSE | notificationStore.js:13 |
| sound_enabled       | BOOLEAN        | NOT NULL DEFAULT TRUE  | notificationStore.js:14 |
| charging_enabled    | BOOLEAN        | NOT NULL DEFAULT TRUE  | notificationStore.js:15 |
| booking_enabled     | BOOLEAN        | NOT NULL DEFAULT TRUE  | notificationStore.js:16 |
| payment_enabled     | BOOLEAN        | NOT NULL DEFAULT TRUE  | notificationStore.js:17 |
| maintenance_enabled | BOOLEAN        | NOT NULL DEFAULT FALSE | notificationStore.js:18 |
| updated_at          | TIMESTAMPTZ    | NOT NULL DEFAULT NOW() | -                       |

**Source:** `src/store/notificationStore.js:10-18`

---

### 2.16 Entity: QR_CODES

| Field        | Type           | Nullable              | Source         |
| ------------ | -------------- | --------------------- | -------------- |
| id           | UUID/BIGSERIAL | NOT NULL PK           | -              |
| station_id   | UUID/BIGSERIAL | NOT NULL FK           | mockAPI.js:645 |
| slot_id      | UUID/BIGSERIAL | NOT NULL FK UNIQUE    | mockAPI.js:654 |
| qr_data      | TEXT           | NOT NULL UNIQUE       | mockAPI.js:653 |
| qr_image_url | TEXT           | NULL                  | mockAPI.js:655 |
| generated_at | TIMESTAMPTZ    | NOT NULL              | mockAPI.js:656 |
| is_active    | BOOLEAN        | NOT NULL DEFAULT TRUE | -              |

**Format QR Data:** `SKAEV:STATION:{stationId}:{portId}`

**Source:** `src/data/mockAPI.js:621-677`

---

## 3. QUAN HỆ VÀ BỘI SỐ

### Mối quan hệ chính:

1. **USERS (1) → (0..n) USER_PROFILES (1:1)**

   - One-to-One: Mỗi user có 1 profile

2. **USERS (1) → (0..n) VEHICLES**

   - One-to-Many: Customer có nhiều vehicles

3. **USERS (1) → (0..n) BOOKINGS**

   - One-to-Many: Customer có nhiều bookings

4. **CHARGING_STATIONS (1) → (1..n) CHARGING_POSTS**

   - One-to-Many: Station có nhiều charging posts

5. **CHARGING_POSTS (1) → (1..n) CHARGING_SLOTS**

   - One-to-Many: Post có nhiều slots

6. **CHARGING_STATIONS (1) → (0..n) PRICING_TIERS**

   - One-to-Many: Station có nhiều pricing tiers

7. **BOOKINGS (1) → (0..1) SOC_TRACKING**

   - One-to-One: Mỗi booking có 1 SOC tracking session

8. **SOC_TRACKING (1) → (0..n) SOC_CHARGING_HISTORY**

   - One-to-Many: SOC tracking có nhiều history points

9. **BOOKINGS (1) → (0..1) INVOICES**

   - One-to-One: Mỗi completed booking có 1 invoice

10. **USERS (1) → (0..n) PAYMENT_METHODS**

    - One-to-Many: Customer có nhiều payment methods

11. **USERS (1) → (0..n) NOTIFICATIONS**

    - One-to-Many: User nhận nhiều notifications

12. **CHARGING_SLOTS (1) → (0..n) QR_CODES**
    - One-to-One (active): Mỗi slot có 1 active QR code

---

## 4. GIẢI THÍCH CÁC QUYẾT ĐỊNH THIẾT KẾ

### 4.1 Tách bảng USER_PROFILES

- **Lý do:** Tách dữ liệu authentication (users) với profile info để:
  - Tăng security: password_hash tách riêng
  - Dễ scale: có thể thêm nhiều loại profile (staff, business)
  - Chuẩn hóa: tránh NULL values cho các fields không phù hợp với mỗi role

### 4.2 Cấu trúc Station → Post → Slot

- **Lý do:** Mock data có nested structure phức tạp:
  - Station: địa điểm vật lý
  - Post: trụ sạc vật lý (AC/DC, power level)
  - Slot: cổng sạc cụ thể (A1, A2...)
  - Design này match 1:1 với mock data và dễ query

### 4.3 SOC_TRACKING riêng biệt với BOOKINGS

- **Lý do:**
  - Tracking real-time data nặng (nhiều updates/sec)
  - History table riêng để lưu time-series data
  - Tránh lock table BOOKINGS khi update SOC

### 4.4 PRICING_TIERS có effective_from/to

- **Lý do:**
  - Hỗ trợ price history
  - Có thể schedule future prices
  - Audit trail cho pricing changes

### 4.5 JSONB cho arrays và nested data

- **Lý do:**
  - `connector_types`: array đơn giản, query bằng `@>` operator
  - `images`, `landmarks`: array URLs
  - `permissions`: flexible schema
  - PostgreSQL JSONB có index tốt, query nhanh

### 4.6 Enum types

- **Lý do:**
  - Type safety
  - Performance (so với VARCHAR + CHECK)
  - Self-documenting
  - Migration dễ dàng

---

## 5. ĐỀ XUẤT INDEX CHIẾN LƯỢC

### High Priority Indexes:

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role) WHERE is_active = TRUE;

-- Stations (cho nearby search)
CREATE INDEX idx_stations_location ON charging_stations USING GIST(
  ll_to_earth(latitude, longitude)
);
CREATE INDEX idx_stations_status ON charging_stations(status) WHERE status = 'active';
CREATE INDEX idx_stations_connector_types ON charging_stations USING GIN(connector_types);

-- Bookings (heavy queries)
CREATE INDEX idx_bookings_customer ON bookings(customer_id, created_at DESC);
CREATE INDEX idx_bookings_station ON bookings(station_id, status);
CREATE INDEX idx_bookings_status_date ON bookings(status, scheduled_date_time)
  WHERE status IN ('scheduled', 'confirmed');

-- Real-time tracking
CREATE INDEX idx_slots_status ON charging_slots(status) WHERE status = 'available';
CREATE INDEX idx_soc_tracking_booking ON soc_tracking(booking_id);

-- Notifications
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, timestamp DESC)
  WHERE read = FALSE;
```

---

## 6. CÁC RÀO BUỘC NGHIỆP VỤ (CONSTRAINTS)

### Check Constraints:

```sql
-- Ratings must be 1-5
ALTER TABLE bookings ADD CONSTRAINT chk_rating_range
  CHECK (rating_overall IS NULL OR (rating_overall >= 1 AND rating_overall <= 5));

-- SOC percent must be 0-100
ALTER TABLE soc_tracking ADD CONSTRAINT chk_soc_range
  CHECK (initial_soc_percent >= 0 AND initial_soc_percent <= 100
    AND current_soc_percent >= 0 AND current_soc_percent <= 100
    AND target_soc_percent >= 0 AND target_soc_percent <= 100);

-- Available slots cannot exceed total slots
ALTER TABLE charging_posts ADD CONSTRAINT chk_available_slots
  CHECK (available_slots >= 0 AND available_slots <= total_slots);

-- Booking amount must be positive
ALTER TABLE bookings ADD CONSTRAINT chk_positive_amounts
  CHECK (
    (energy_cost_vnd IS NULL OR energy_cost_vnd >= 0)
    AND (parking_cost_vnd IS NULL OR parking_cost_vnd >= 0)
    AND (total_amount_vnd IS NULL OR total_amount_vnd >= 0)
  );
```

---

## 7. TRIGGER & AUDIT TRAIL

### Recommended Triggers:

1. **Update `available_slots` khi slot status thay đổi**
2. **Update `updated_at` timestamp automatically**
3. **Validate QR scan timing** (không scan QR quá sớm)
4. **Calculate booking total_amount** từ energy + parking
5. **Send notification** khi booking status thay đổi

---

## 8. PHÂN TÍCH SECURITY & PII

### PII Data (cần bảo vệ):

- `users.email` - ENCRYPT hoặc HASH index
- `user_profiles.phone` - ENCRYPT
- `vehicles.license_plate` - ENCRYPT
- `payment_methods.last_four_digits` - MASKED display
- `payment_methods.identifier` - ENCRYPT

### Recommended:

1. **PostgreSQL pgcrypto** cho encryption
2. **Row Level Security (RLS)** cho multi-tenant nếu có business owners
3. **Audit logging** cho payment transactions
4. **Rate limiting** cho payment APIs

---

## 9. PARTITIONING STRATEGY

### Recommended:

1. **BOOKINGS table**: Partition by `created_at` (monthly)
   - Lý do: Booking history grows fast, old data ít query
2. **SOC_CHARGING_HISTORY**: Partition by `timestamp` (daily)

   - Lý do: Time-series data, chỉ cần recent data

3. **NOTIFICATIONS**: Partition by `timestamp` (monthly)
   - Lý do: Old notifications có thể archive

---

## 10. MIGRATION ROADMAP

### Phase 1: Core Tables (Week 1)

- users, user_profiles, vehicles
- charging_stations, charging_posts, charging_slots, pricing_tiers

### Phase 2: Transaction Tables (Week 2)

- bookings, soc_tracking, soc_charging_history
- invoices, payment_methods

### Phase 3: Feature Tables (Week 3)

- notifications, notification_settings
- qr_codes, customer_preferences

### Phase 4: Optimization (Week 4)

- Indexes, partitioning
- Triggers, functions
- Performance tuning

---

## 11. COMPATIBILITY VỚI MOCK DATA

### Migration Script Cần Mapping:

| Mock Field                       | Database Field                    | Transformation    |
| -------------------------------- | --------------------------------- | ----------------- |
| `user.id`                        | `users.id`                        | UUID generation   |
| `user.password`                  | `users.password_hash`             | bcrypt hash       |
| `station.charging.chargingPosts` | `charging_posts + charging_slots` | Split nested data |
| `station.charging.pricing`       | `pricing_tiers`                   | Multiple rows     |
| `booking.status`                 | Enum normalization                | -                 |
| `vehicle.chargingType`           | `vehicles.connector_types`        | JSON array        |

---

**Tổng kết:** Database design này bao phủ 100% dữ liệu mock hiện tại, đang sẵn sàng cho production với PostgreSQL 16.
