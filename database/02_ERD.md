# ERD - ENTITY RELATIONSHIP DIAGRAM

## SkaEV Database - PostgreSQL 16

```mermaid
erDiagram
    USERS ||--|| USER_PROFILES : has
    USERS ||--o{ VEHICLES : owns
    USERS ||--o{ BOOKINGS : creates
    USERS ||--o{ PAYMENT_METHODS : has
    USERS ||--|| CUSTOMER_PREFERENCES : has
    USERS ||--|| NOTIFICATION_SETTINGS : has
    USERS ||--o{ NOTIFICATIONS : receives

    CHARGING_STATIONS ||--o{ CHARGING_POSTS : contains
    CHARGING_POSTS ||--o{ CHARGING_SLOTS : has
    CHARGING_STATIONS ||--o{ PRICING_TIERS : defines
    CHARGING_STATIONS ||--o{ BOOKINGS : receives
    CHARGING_SLOTS ||--o{ BOOKINGS : assigned_to
    CHARGING_SLOTS ||--|| QR_CODES : has_active

    BOOKINGS ||--o| SOC_TRACKING : tracks
    SOC_TRACKING ||--o{ SOC_CHARGING_HISTORY : logs
    BOOKINGS ||--o| INVOICES : generates
    VEHICLES ||--o{ SOC_TRACKING : uses

    USERS {
        uuid id PK
        varchar email UK
        varchar password_hash
        enum role
        timestamptz created_at
        timestamptz updated_at
        timestamptz last_login_at
        boolean email_verified
        boolean is_active
    }

    USER_PROFILES {
        uuid user_id PK,FK
        varchar first_name
        varchar last_name
        varchar phone
        text avatar_url
        jsonb permissions
        varchar employee_id
        varchar department
        varchar position
        date join_date
        varchar location
    }

    CUSTOMER_PREFERENCES {
        uuid customer_id PK,FK
        integer max_distance_km
        enum preferred_payment_method
        integer price_range_min_vnd
        integer price_range_max_vnd
        timestamptz created_at
        timestamptz updated_at
    }

    VEHICLES {
        uuid id PK
        uuid customer_id FK
        varchar nickname
        varchar make
        varchar model
        integer year
        decimal battery_capacity_kwh
        integer max_charging_speed_kw
        jsonb connector_types
        varchar license_plate
        varchar color
        boolean is_default
        timestamptz created_at
        timestamptz updated_at
    }

    CHARGING_STATIONS {
        uuid id PK
        varchar owner_id
        varchar name
        enum type
        enum status
        text address
        decimal latitude
        decimal longitude
        jsonb landmarks
        time operating_hours_open
        time operating_hours_close
        varchar timezone
        integer total_ports
        integer available_ports
        integer max_power
        jsonb connector_types
        integer parking_fee_per_hour
        decimal rating_overall
        decimal rating_cleanliness
        decimal rating_availability
        decimal rating_speed
        integer total_reviews
        jsonb images
        timestamptz created_at
        timestamptz updated_at
    }

    CHARGING_POSTS {
        uuid id PK
        uuid station_id FK
        varchar post_identifier UK
        varchar name
        enum type
        integer power_kw
        integer voltage_v
        integer total_slots
        integer available_slots
        timestamptz created_at
        timestamptz updated_at
    }

    CHARGING_SLOTS {
        uuid id PK
        uuid post_id FK
        varchar slot_identifier UK
        enum connector_type
        enum status
        uuid current_booking_id FK
        timestamptz last_used_at
        timestamptz last_maintenance_at
        timestamptz created_at
        timestamptz updated_at
    }

    PRICING_TIERS {
        uuid id PK
        uuid station_id FK
        enum charging_type
        integer rate_per_kwh
        timestamptz effective_from
        timestamptz effective_to
    }

    BOOKINGS {
        uuid id PK
        uuid customer_id FK
        uuid station_id FK
        uuid slot_id FK
        enum status
        enum scheduling_type
        timestamptz scheduled_date_time
        timestamptz actual_start_time
        timestamptz actual_end_time
        timestamptz estimated_arrival
        boolean qr_scanned
        timestamptz qr_scanned_at
        text qr_data
        boolean charging_started
        timestamptz charging_started_at
        integer duration_minutes
        decimal energy_delivered_kwh
        integer energy_cost_vnd
        integer parking_cost_vnd
        integer total_amount_vnd
        enum payment_method
        varchar payment_transaction_id
        enum payment_status
        text cancellation_reason
        timestamptz cancelled_at
        integer rating_overall
        text rating_comment
        timestamptz created_at
        timestamptz updated_at
        timestamptz completed_at
    }

    SOC_TRACKING {
        uuid id PK
        uuid booking_id FK,UK
        uuid vehicle_id FK
        decimal battery_capacity_kwh
        decimal initial_soc_percent
        decimal current_soc_percent
        decimal target_soc_percent
        timestamptz start_time
        timestamptz last_updated
        decimal charging_rate_percent_per_hour
        integer estimated_time_to_target_minutes
        enum status
    }

    SOC_CHARGING_HISTORY {
        uuid id PK
        uuid soc_tracking_id FK
        timestamptz timestamp
        decimal soc_percent
        decimal power_delivered_kw
        decimal voltage_v
        decimal current_a
        decimal temperature_c
    }

    INVOICES {
        uuid id PK
        varchar invoice_number UK
        uuid booking_id FK,UK
        uuid customer_id FK
        date invoice_date
        integer subtotal_vnd
        integer tax_vnd
        integer total_vnd
        enum status
        timestamptz created_at
        timestamptz updated_at
    }

    PAYMENT_METHODS {
        uuid id PK
        uuid customer_id FK
        enum type
        varchar provider
        varchar last_four_digits
        integer expiry_month
        integer expiry_year
        varchar identifier
        boolean is_default
        varchar nickname
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        enum type
        enum category
        varchar title
        text message
        enum priority
        boolean read
        jsonb data
        jsonb actions
        timestamptz timestamp
        timestamptz read_at
        timestamptz created_at
    }

    NOTIFICATION_SETTINGS {
        uuid user_id PK,FK
        boolean browser_enabled
        boolean email_enabled
        boolean sms_enabled
        boolean sound_enabled
        boolean charging_enabled
        boolean booking_enabled
        boolean payment_enabled
        boolean maintenance_enabled
        timestamptz updated_at
    }

    QR_CODES {
        uuid id PK
        uuid station_id FK
        uuid slot_id FK,UK
        text qr_data UK
        text qr_image_url
        timestamptz generated_at
        boolean is_active
    }
```

---

## Giải thích các mối quan hệ chính:

### 1. User & Authentication Flow

- `USERS` (1) ↔ (1) `USER_PROFILES`: One-to-One, bắt buộc
- `USERS` (1) ↔ (1) `CUSTOMER_PREFERENCES`: Optional, chỉ cho customers
- `USERS` (1) ↔ (0..n) `VEHICLES`: Customer có thể có nhiều xe

### 2. Station Hierarchy (3-Level)

```
CHARGING_STATIONS (Location)
    ├─ CHARGING_POSTS (Physical charger unit: AC/DC, power level)
    │   └─ CHARGING_SLOTS (Individual connector port: A1, B2, C3...)
    └─ PRICING_TIERS (Historical pricing by charging type)
```

### 3. Booking & Charging Flow

```
1. BOOKINGS created (status: pending)
2. QR scan → confirmed
3. Start charging → SOC_TRACKING initiated
4. Real-time updates → SOC_CHARGING_HISTORY
5. Complete → INVOICES generated
```

### 4. Payment & Billing

- `PAYMENT_METHODS`: Lưu payment instruments
- `INVOICES`: Generated sau khi booking completed
- Link: `BOOKINGS` → `INVOICES` (1:1)

### 5. Notification System

- `NOTIFICATIONS`: Real-time events
- `NOTIFICATION_SETTINGS`: User preferences per category
- Support: Browser, Email, SMS, Push

---

## Lưu ý về Cardinality:

### Mandatory Relationships (NOT NULL FK):

- `USER_PROFILES.user_id` → `USERS.id`
- `VEHICLES.customer_id` → `USERS.id`
- `CHARGING_POSTS.station_id` → `CHARGING_STATIONS.id`
- `CHARGING_SLOTS.post_id` → `CHARGING_POSTS.id`
- `BOOKINGS.customer_id` → `USERS.id`
- `BOOKINGS.station_id` → `CHARGING_STATIONS.id`

### Optional Relationships (NULL FK):

- `BOOKINGS.slot_id` → `CHARGING_SLOTS.id` (slot assigned sau khi scan QR)
- `CHARGING_SLOTS.current_booking_id` → `BOOKINGS.id` (chỉ khi slot occupied)
- `SOC_TRACKING.vehicle_id` → `VEHICLES.id` (nếu có vehicle info)

---

## Indexes Strategy Summary:

### Hot Tables (cần index đặc biệt):

1. **BOOKINGS**: Partition by created_at (monthly)
2. **SOC_CHARGING_HISTORY**: Time-series, partition by timestamp (daily)
3. **NOTIFICATIONS**: TTL policy (delete after 90 days)

### GIS Indexes:

- `CHARGING_STATIONS`: PostGIS extension cho nearby search

### JSONB Indexes:

- `connector_types`, `permissions`, `data`: GIN indexes

---

## Data Flow Visualization:

```
Customer → Select Station → Create Booking (pending)
    ↓
Arrive at Station → Scan QR Code → Booking confirmed
    ↓
Plug in vehicle → Start Charging → SOC Tracking initiated
    ↓
Real-time monitoring → SOC History logged every 3 seconds
    ↓
Target SOC reached → Stop Charging → Booking completed
    ↓
Invoice generated → Payment processed → Receipt sent
    ↓
Rating & Review → Analytics updated
```

---

## Database Size Estimates (1 Year):

| Table                | Rows/Year | Storage |
| -------------------- | --------- | ------- |
| USERS                | ~10,000   | ~5 MB   |
| BOOKINGS             | ~500,000  | ~200 MB |
| SOC_CHARGING_HISTORY | ~100M     | ~15 GB  |
| NOTIFICATIONS        | ~2M       | ~500 MB |
| CHARGING_STATIONS    | ~500      | ~2 MB   |

**Total Estimate:** ~20 GB/year (before archival)

---

## Recommended Extensions:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";        -- Encryption
CREATE EXTENSION IF NOT EXISTS "postgis";         -- Geospatial queries
CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- Fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gin";       -- Multi-column GIN indexes
```
