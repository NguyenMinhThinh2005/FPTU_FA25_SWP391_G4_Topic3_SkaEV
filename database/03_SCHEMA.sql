-- ============================================
-- SkaEV Database Schema - PostgreSQL 16
-- Production-Ready DDL Script
-- ============================================
-- 
-- Source: Reverse-engineered từ mock data
-- Mock Data: src/data/mockData.js, src/data/mockAPI.js
-- Stores: src/store/*.js
-- 
-- Thứ tự thực thi:
--   1. Extensions
--   2. Enum Types
--   3. Tables (theo thứ tự dependency)
--   4. Indexes
--   5. Constraints
--   6. Functions & Triggers
--
-- ============================================

-- ============================================
-- 1. EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";       -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";        -- Password hashing & encryption
CREATE EXTENSION IF NOT EXISTS "postgis";         -- Geospatial queries
CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- Fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gin";       -- Multi-column GIN indexes

-- ============================================
-- 2. ENUM TYPES
-- ============================================

-- User roles
-- Source: src/utils/constants.js:32-36, mockData.js:12
CREATE TYPE user_role AS ENUM ('admin', 'staff', 'customer');

-- Station types
-- Source: mockData.js:134
CREATE TYPE station_type AS ENUM ('public', 'semi-private', 'private');

-- Station status
-- Source: src/utils/constants.js:40-45, mockData.js:135
CREATE TYPE station_status AS ENUM ('active', 'inactive', 'maintenance', 'offline');

-- Charging post type
-- Source: mockData.js:152
CREATE TYPE charging_post_type AS ENUM ('AC', 'DC');

-- Connector types - must match frontend CONNECTOR_TYPES
-- Source: src/utils/constants.js:56-60, mockData.js:159
CREATE TYPE connector_type AS ENUM ('Type 2', 'CCS2', 'CHAdeMO');

-- Slot status
-- Source: mockData.js:160
CREATE TYPE slot_status AS ENUM ('available', 'occupied', 'maintenance', 'offline');

-- Charging type for pricing
-- Source: mockData.js:236-240
CREATE TYPE charging_rate_type AS ENUM ('ac', 'dc', 'dc_fast', 'dc_ultra');

-- Booking status
-- Source: src/utils/constants.js:48-54, mockData.js:374, bookingStore.js:58-59
CREATE TYPE booking_status AS ENUM (
    'pending',      -- Waiting for QR scan
    'scheduled',    -- Future booking
    'confirmed',    -- QR scanned, ready to charge
    'charging',     -- Active charging session
    'completed',    -- Successfully finished
    'cancelled',    -- User cancelled
    'failed'        -- Technical failure
);

-- Scheduling type
-- Source: bookingStore.js:47
CREATE TYPE scheduling_type AS ENUM ('immediate', 'scheduled');

-- Payment method types
-- Source: src/utils/constants.js:68-73, mockData.js:518
CREATE TYPE payment_method_type AS ENUM ('credit-card', 'e-wallet', 'bank-account');

-- Payment status
-- Source: mockData.js:387
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- Invoice status
-- Source: invoiceService.js:73
CREATE TYPE invoice_status AS ENUM ('pending', 'paid', 'cancelled', 'refunded');

-- SOC tracking status
-- Source: mockAPI.js:297
CREATE TYPE soc_status AS ENUM ('connected', 'charging', 'stopped', 'completed');

-- Notification types
-- Source: notificationStore.js:31
CREATE TYPE notification_type AS ENUM ('success', 'info', 'warning', 'error');

-- Notification categories
-- Source: notificationStore.js:32
CREATE TYPE notification_category AS ENUM ('charging', 'booking', 'payment', 'maintenance', 'system');

-- Notification priority
-- Source: notificationStore.js:35
CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high');

-- ============================================
-- 3. CORE TABLES
-- ============================================

-- --------------------------------------------
-- 3.1 USERS (Authentication & Core User Data)
-- --------------------------------------------
-- Source: mockData.js:7-119, authStore.js:1-168
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- bcrypt hashed
    role user_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Indexes
    CONSTRAINT users_email_lowercase CHECK (email = LOWER(email))
);

COMMENT ON TABLE users IS 'Core authentication table - stores login credentials and role';
COMMENT ON COLUMN users.password_hash IS 'bcrypt hash of password - min 10 rounds';
COMMENT ON COLUMN users.email_verified IS 'Set TRUE after email confirmation';
COMMENT ON COLUMN users.is_active IS 'Soft delete flag - FALSE = account disabled';

-- --------------------------------------------
-- 3.2 USER_PROFILES (Extended User Information)
-- --------------------------------------------
-- Source: mockData.js:13-21, 47-76
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    permissions JSONB, -- Array of permission strings
    
    -- Staff-specific fields (NULL for customers/admins)
    employee_id VARCHAR(50),
    department VARCHAR(100),
    position VARCHAR(100),
    join_date DATE,
    location VARCHAR(100),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT profile_phone_format CHECK (phone ~ '^\+?[0-9\s\-\(\)]+$')
);

COMMENT ON TABLE user_profiles IS 'Extended user information - 1:1 with users table';
COMMENT ON COLUMN user_profiles.permissions IS 'JSONB array: ["stations", "maintenance", "reports"]';
COMMENT ON COLUMN user_profiles.employee_id IS 'Staff employee ID - NULL for customers';

-- --------------------------------------------
-- 3.3 CUSTOMER_PREFERENCES
-- --------------------------------------------
-- Source: mockData.js:87-91
CREATE TABLE customer_preferences (
    customer_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    max_distance_km INTEGER CHECK (max_distance_km > 0 AND max_distance_km <= 200),
    preferred_payment_method payment_method_type,
    price_range_min_vnd INTEGER CHECK (price_range_min_vnd >= 0),
    price_range_max_vnd INTEGER CHECK (price_range_max_vnd >= price_range_min_vnd),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE customer_preferences IS 'Customer-specific preferences for station search and payments';

-- --------------------------------------------
-- 3.4 VEHICLES
-- --------------------------------------------
-- Source: vehicleStore.js:12-22, mockData.js:79-86
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nickname VARCHAR(100),
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
    battery_capacity_kwh DECIMAL(5,2) NOT NULL CHECK (battery_capacity_kwh > 0),
    max_charging_speed_kw INTEGER CHECK (max_charging_speed_kw > 0),
    connector_types JSONB NOT NULL, -- Array of connector_type enum values
    license_plate VARCHAR(20),
    color VARCHAR(50),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure only one default vehicle per customer
    CONSTRAINT vehicles_one_default_per_customer UNIQUE (customer_id, is_default) 
        WHERE is_default = TRUE
);

COMMENT ON TABLE vehicles IS 'Customer electric vehicles with connector compatibility';
COMMENT ON COLUMN vehicles.connector_types IS 'JSONB array: ["Type 2", "CCS2"]';
COMMENT ON COLUMN vehicles.is_default IS 'Only one default vehicle per customer allowed';

-- --------------------------------------------
-- 3.5 CHARGING_STATIONS
-- --------------------------------------------
-- Source: mockData.js:130-366, stationStore.js:1-303
CREATE TABLE charging_stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id VARCHAR(50) NOT NULL, -- Can be 'system' or user UUID
    name VARCHAR(255) NOT NULL,
    type station_type NOT NULL DEFAULT 'public',
    status station_status NOT NULL DEFAULT 'active',
    
    -- Location
    address TEXT NOT NULL,
    latitude DECIMAL(10,8) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude DECIMAL(11,8) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    landmarks JSONB, -- Array of landmark strings
    
    -- Operating hours
    operating_hours_open TIME NOT NULL DEFAULT '00:00',
    operating_hours_close TIME, -- NULL = 24/7
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    
    -- Capacity summary (denormalized for performance)
    total_ports INTEGER NOT NULL DEFAULT 0,
    available_ports INTEGER NOT NULL DEFAULT 0,
    max_power INTEGER NOT NULL, -- kW
    connector_types JSONB NOT NULL, -- Array of available connector types
    
    -- Pricing
    parking_fee_per_hour INTEGER CHECK (parking_fee_per_hour >= 0), -- VND
    
    -- Ratings
    rating_overall DECIMAL(3,2) CHECK (rating_overall >= 0 AND rating_overall <= 5),
    rating_cleanliness DECIMAL(3,2) CHECK (rating_cleanliness >= 0 AND rating_cleanliness <= 5),
    rating_availability DECIMAL(3,2) CHECK (rating_availability >= 0 AND rating_availability <= 5),
    rating_speed DECIMAL(3,2) CHECK (rating_speed >= 0 AND rating_speed <= 5),
    total_reviews INTEGER NOT NULL DEFAULT 0,
    
    -- Media
    images JSONB, -- Array of image URLs
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT station_available_ports_check CHECK (available_ports >= 0 AND available_ports <= total_ports),
    CONSTRAINT station_operating_hours_check CHECK (
        operating_hours_close IS NULL OR operating_hours_close > operating_hours_open
    )
);

COMMENT ON TABLE charging_stations IS 'Physical EV charging stations with location and capacity info';
COMMENT ON COLUMN charging_stations.owner_id IS 'system or user UUID for business owners';
COMMENT ON COLUMN charging_stations.operating_hours_close IS 'NULL means 24/7 operation';
COMMENT ON COLUMN charging_stations.connector_types IS 'Aggregated from all slots: ["Type 2", "CCS2", "CHAdeMO"]';

-- --------------------------------------------
-- 3.6 CHARGING_POSTS (Physical Charger Units)
-- --------------------------------------------
-- Source: mockData.js:149-231
CREATE TABLE charging_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES charging_stations(id) ON DELETE CASCADE,
    post_identifier VARCHAR(50) NOT NULL, -- 'post-A', 'post-B', etc.
    name VARCHAR(255) NOT NULL,
    type charging_post_type NOT NULL,
    power_kw INTEGER NOT NULL CHECK (power_kw > 0),
    voltage_v INTEGER NOT NULL CHECK (voltage_v > 0),
    total_slots INTEGER NOT NULL CHECK (total_slots > 0),
    available_slots INTEGER NOT NULL CHECK (available_slots >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT post_available_slots_check CHECK (available_slots <= total_slots),
    CONSTRAINT post_unique_identifier UNIQUE (station_id, post_identifier)
);

COMMENT ON TABLE charging_posts IS 'Physical charging units within a station (AC/DC, power levels)';
COMMENT ON COLUMN charging_posts.post_identifier IS 'Human-readable ID like "post-A", "post-B"';

-- --------------------------------------------
-- 3.7 CHARGING_SLOTS (Individual Connector Ports)
-- --------------------------------------------
-- Source: mockData.js:157-231
CREATE TABLE charging_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES charging_posts(id) ON DELETE CASCADE,
    slot_identifier VARCHAR(50) NOT NULL, -- 'A1', 'A2', 'B1', etc.
    connector_type connector_type NOT NULL,
    status slot_status NOT NULL DEFAULT 'available',
    current_booking_id UUID, -- FK added later after bookings table
    last_used_at TIMESTAMPTZ,
    last_maintenance_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT slot_unique_identifier UNIQUE (post_id, slot_identifier)
);

COMMENT ON TABLE charging_slots IS 'Individual charging connectors (ports) within a charging post';
COMMENT ON COLUMN charging_slots.slot_identifier IS 'Port ID like "A1", "B2", "C3"';
COMMENT ON COLUMN charging_slots.current_booking_id IS 'NULL when available, booking ID when occupied';

-- --------------------------------------------
-- 3.8 PRICING_TIERS (Historical Pricing)
-- --------------------------------------------
-- Source: mockData.js:236-241
CREATE TABLE pricing_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES charging_stations(id) ON DELETE CASCADE,
    charging_type charging_rate_type NOT NULL,
    rate_per_kwh INTEGER NOT NULL CHECK (rate_per_kwh >= 0), -- VND
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_to TIMESTAMPTZ, -- NULL = current price
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure no overlapping date ranges for same station+type
    EXCLUDE USING gist (
        station_id WITH =,
        charging_type WITH =,
        tstzrange(effective_from, effective_to, '[]') WITH &&
    )
);

COMMENT ON TABLE pricing_tiers IS 'Historical pricing for different charging types - supports price changes over time';
COMMENT ON COLUMN pricing_tiers.effective_to IS 'NULL = current active price';

-- --------------------------------------------
-- 3.9 BOOKINGS (Charging Sessions)
-- --------------------------------------------
-- Source: mockData.js:368-437, bookingStore.js:1-655
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    station_id UUID NOT NULL REFERENCES charging_stations(id) ON DELETE RESTRICT,
    slot_id UUID REFERENCES charging_slots(id) ON DELETE SET NULL, -- Assigned after QR scan
    
    -- Status tracking
    status booking_status NOT NULL DEFAULT 'pending',
    scheduling_type scheduling_type NOT NULL DEFAULT 'immediate',
    
    -- Timing
    scheduled_date_time TIMESTAMPTZ,
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    estimated_arrival TIMESTAMPTZ,
    
    -- QR Code workflow
    qr_scanned BOOLEAN NOT NULL DEFAULT FALSE,
    qr_scanned_at TIMESTAMPTZ,
    qr_data TEXT,
    
    -- Charging workflow
    charging_started BOOLEAN NOT NULL DEFAULT FALSE,
    charging_started_at TIMESTAMPTZ,
    
    -- Session data
    duration_minutes INTEGER CHECK (duration_minutes >= 0),
    energy_delivered_kwh DECIMAL(8,2) CHECK (energy_delivered_kwh >= 0),
    
    -- Financial
    energy_cost_vnd INTEGER CHECK (energy_cost_vnd >= 0),
    parking_cost_vnd INTEGER CHECK (parking_cost_vnd >= 0),
    total_amount_vnd INTEGER CHECK (total_amount_vnd >= 0),
    
    -- Payment
    payment_method payment_method_type,
    payment_transaction_id VARCHAR(255),
    payment_status payment_status,
    
    -- Cancellation
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    
    -- Rating
    rating_overall INTEGER CHECK (rating_overall >= 1 AND rating_overall <= 5),
    rating_comment TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Business logic constraints
    CONSTRAINT booking_times_logical CHECK (
        (actual_start_time IS NULL OR actual_end_time IS NULL OR actual_end_time > actual_start_time)
    ),
    CONSTRAINT booking_qr_before_charge CHECK (
        NOT charging_started OR qr_scanned
    ),
    CONSTRAINT booking_completed_has_end_time CHECK (
        status != 'completed' OR actual_end_time IS NOT NULL
    ),
    CONSTRAINT booking_cancelled_has_reason CHECK (
        status != 'cancelled' OR cancellation_reason IS NOT NULL
    )
);

COMMENT ON TABLE bookings IS 'Charging session bookings with full lifecycle tracking';
COMMENT ON COLUMN bookings.slot_id IS 'NULL until QR scan assigns specific slot';
COMMENT ON COLUMN bookings.qr_scanned IS 'Must scan QR before starting charge';
COMMENT ON COLUMN bookings.status IS 'pending → confirmed (QR scan) → charging → completed';

-- Add FK constraint for charging_slots.current_booking_id
ALTER TABLE charging_slots 
    ADD CONSTRAINT fk_slot_current_booking 
    FOREIGN KEY (current_booking_id) REFERENCES bookings(id) ON DELETE SET NULL;

-- --------------------------------------------
-- 3.10 SOC_TRACKING (State of Charge Real-time)
-- --------------------------------------------
-- Source: mockAPI.js:283-367, bookingStore.js:70-82
CREATE TABLE soc_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    battery_capacity_kwh DECIMAL(5,2) NOT NULL CHECK (battery_capacity_kwh > 0),
    initial_soc_percent DECIMAL(5,2) NOT NULL CHECK (initial_soc_percent >= 0 AND initial_soc_percent <= 100),
    current_soc_percent DECIMAL(5,2) NOT NULL CHECK (current_soc_percent >= 0 AND current_soc_percent <= 100),
    target_soc_percent DECIMAL(5,2) NOT NULL CHECK (target_soc_percent >= 0 AND target_soc_percent <= 100),
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    charging_rate_percent_per_hour DECIMAL(5,2) CHECK (charging_rate_percent_per_hour >= 0),
    estimated_time_to_target_minutes INTEGER CHECK (estimated_time_to_target_minutes >= 0),
    status soc_status NOT NULL DEFAULT 'connected',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Logical constraints
    CONSTRAINT soc_initial_lte_target CHECK (initial_soc_percent <= target_soc_percent),
    CONSTRAINT soc_current_range CHECK (
        current_soc_percent >= initial_soc_percent AND current_soc_percent <= 100
    )
);

COMMENT ON TABLE soc_tracking IS 'Real-time state of charge tracking for active charging sessions';
COMMENT ON COLUMN soc_tracking.last_updated IS 'Updated every 3 seconds during active charging';

-- --------------------------------------------
-- 3.11 SOC_CHARGING_HISTORY (Time-series Data)
-- --------------------------------------------
-- Source: mockAPI.js:302-310
CREATE TABLE soc_charging_history (
    id UUID DEFAULT uuid_generate_v4(),
    soc_tracking_id UUID NOT NULL REFERENCES soc_tracking(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    soc_percent DECIMAL(5,2) NOT NULL CHECK (soc_percent >= 0 AND soc_percent <= 100),
    power_delivered_kw DECIMAL(6,2) CHECK (power_delivered_kw >= 0),
    voltage_v DECIMAL(6,2) CHECK (voltage_v >= 0),
    current_a DECIMAL(6,2) CHECK (current_a >= 0),
    temperature_c DECIMAL(4,1),
    
    PRIMARY KEY (soc_tracking_id, timestamp)
) PARTITION BY RANGE (timestamp);

COMMENT ON TABLE soc_charging_history IS 'Time-series data for charging sessions - partitioned by timestamp';
COMMENT ON COLUMN soc_charging_history.timestamp IS 'Logged every ~3 seconds during charging';

-- Create partitions for SOC history (monthly)
-- Example: CREATE TABLE soc_charging_history_2024_12 PARTITION OF soc_charging_history
--          FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- --------------------------------------------
-- 3.12 INVOICES (Billing & Receipts)
-- --------------------------------------------
-- Source: invoiceService.js:1-509
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE, -- Format: INV-YYYY-MM-###
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    subtotal_vnd INTEGER NOT NULL CHECK (subtotal_vnd >= 0),
    tax_vnd INTEGER NOT NULL CHECK (tax_vnd >= 0),
    total_vnd INTEGER NOT NULL CHECK (total_vnd >= 0),
    status invoice_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Invoice math check
    CONSTRAINT invoice_total_check CHECK (total_vnd = subtotal_vnd + tax_vnd)
);

COMMENT ON TABLE invoices IS 'Generated invoices for completed bookings with tax calculations';
COMMENT ON COLUMN invoices.invoice_number IS 'Auto-generated: INV-2024-12-001';
COMMENT ON COLUMN invoices.tax_vnd IS 'Typically 10% VAT in Vietnam';

-- --------------------------------------------
-- 3.13 PAYMENT_METHODS
-- --------------------------------------------
-- Source: mockData.js:512-533
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type payment_method_type NOT NULL,
    provider VARCHAR(100) NOT NULL, -- 'visa', 'mastercard', 'momo', 'zalopay', etc.
    
    -- Credit card specific
    last_four_digits VARCHAR(4),
    expiry_month INTEGER CHECK (expiry_month IS NULL OR (expiry_month >= 1 AND expiry_month <= 12)),
    expiry_year INTEGER CHECK (expiry_year IS NULL OR expiry_year >= 2024),
    
    -- E-wallet / Bank account specific
    identifier VARCHAR(255), -- Phone number, email, or account identifier
    
    -- Common fields
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    nickname VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure only one default per customer
    CONSTRAINT payment_one_default_per_customer UNIQUE (customer_id, is_default) 
        WHERE is_default = TRUE,
    
    -- Type-specific field validation
    CONSTRAINT payment_credit_card_fields CHECK (
        type != 'credit-card' OR (last_four_digits IS NOT NULL AND expiry_month IS NOT NULL AND expiry_year IS NOT NULL)
    ),
    CONSTRAINT payment_ewallet_fields CHECK (
        type != 'e-wallet' OR identifier IS NOT NULL
    )
);

COMMENT ON TABLE payment_methods IS 'Stored payment instruments for customers (PCI-DSS compliant)';
COMMENT ON COLUMN payment_methods.last_four_digits IS 'Never store full card number - PCI compliance';
COMMENT ON COLUMN payment_methods.identifier IS 'Encrypted phone/email for e-wallets';

-- --------------------------------------------
-- 3.14 NOTIFICATIONS
-- --------------------------------------------
-- Source: notificationStore.js:1-359
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL = broadcast
    type notification_type NOT NULL,
    category notification_category NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority notification_priority NOT NULL DEFAULT 'low',
    read BOOLEAN NOT NULL DEFAULT FALSE,
    data JSONB, -- Extra context data
    actions JSONB, -- Array of action buttons
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Auto-set read_at when read becomes true
    CONSTRAINT notification_read_at_check CHECK (
        (NOT read AND read_at IS NULL) OR (read AND read_at IS NOT NULL)
    )
);

COMMENT ON TABLE notifications IS 'Real-time notification system for users';
COMMENT ON COLUMN notifications.user_id IS 'NULL for system-wide broadcasts';
COMMENT ON COLUMN notifications.data IS 'Extra context: {"bookingId": "...", "stationName": "..."}';
COMMENT ON COLUMN notifications.actions IS '[{"label": "View", "action": "navigate"}]';

-- --------------------------------------------
-- 3.15 NOTIFICATION_SETTINGS
-- --------------------------------------------
-- Source: notificationStore.js:10-18
CREATE TABLE notification_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    browser_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    charging_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    booking_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    payment_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    maintenance_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notification_settings IS 'User preferences for notification delivery channels and categories';

-- --------------------------------------------
-- 3.16 QR_CODES (Station Slot QR Codes)
-- --------------------------------------------
-- Source: mockAPI.js:621-677
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES charging_stations(id) ON DELETE CASCADE,
    slot_id UUID NOT NULL UNIQUE REFERENCES charging_slots(id) ON DELETE CASCADE,
    qr_data TEXT NOT NULL UNIQUE, -- Format: SKAEV:STATION:{stationId}:{slotId}
    qr_image_url TEXT, -- Pre-generated QR code image
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    CONSTRAINT qr_data_format CHECK (qr_data ~ '^SKAEV:STATION:[^:]+:[^:]+$')
);

COMMENT ON TABLE qr_codes IS 'QR codes for station slot identification';
COMMENT ON COLUMN qr_codes.qr_data IS 'Format: SKAEV:STATION:{stationId}:{slotId}';
COMMENT ON COLUMN qr_codes.is_active IS 'Can deactivate old QR codes when regenerating';

-- ============================================
-- 4. INDEXES (Performance Optimization)
-- ============================================

-- Users & Authentication
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_active ON users(role) WHERE is_active = TRUE;
CREATE INDEX idx_users_last_login ON users(last_login_at DESC);

-- User Profiles
CREATE INDEX idx_profiles_name ON user_profiles(first_name, last_name);
CREATE INDEX idx_profiles_employee ON user_profiles(employee_id) WHERE employee_id IS NOT NULL;

-- Vehicles
CREATE INDEX idx_vehicles_customer ON vehicles(customer_id);
CREATE INDEX idx_vehicles_connector_types ON vehicles USING GIN(connector_types);

-- Stations (Critical for nearby search)
CREATE INDEX idx_stations_status ON charging_stations(status) WHERE status = 'active';
CREATE INDEX idx_stations_location ON charging_stations USING GIST(ll_to_earth(latitude, longitude));
CREATE INDEX idx_stations_connector_types ON charging_stations USING GIN(connector_types);
CREATE INDEX idx_stations_owner ON charging_stations(owner_id);

-- Charging Posts & Slots
CREATE INDEX idx_posts_station ON charging_posts(station_id);
CREATE INDEX idx_slots_post ON charging_slots(post_id);
CREATE INDEX idx_slots_status_available ON charging_slots(status) WHERE status = 'available';
CREATE INDEX idx_slots_current_booking ON charging_slots(current_booking_id) WHERE current_booking_id IS NOT NULL;

-- Pricing
CREATE INDEX idx_pricing_station_active ON pricing_tiers(station_id, charging_type) 
    WHERE effective_to IS NULL;

-- Bookings (Heavy query table)
CREATE INDEX idx_bookings_customer_date ON bookings(customer_id, created_at DESC);
CREATE INDEX idx_bookings_station_status ON bookings(station_id, status);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_scheduled ON bookings(scheduled_date_time) 
    WHERE status IN ('scheduled', 'confirmed');
CREATE INDEX idx_bookings_active ON bookings(customer_id) 
    WHERE status IN ('charging', 'confirmed');

-- SOC Tracking
CREATE INDEX idx_soc_booking ON soc_tracking(booking_id);
CREATE INDEX idx_soc_status_active ON soc_tracking(status) 
    WHERE status IN ('charging', 'connected');

-- Invoices
CREATE INDEX idx_invoices_booking ON invoices(booking_id);
CREATE INDEX idx_invoices_customer_date ON invoices(customer_id, invoice_date DESC);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- Payment Methods
CREATE INDEX idx_payment_methods_customer ON payment_methods(customer_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(customer_id, is_default) 
    WHERE is_default = TRUE;

-- Notifications
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, timestamp DESC) 
    WHERE read = FALSE;
CREATE INDEX idx_notifications_user_timestamp ON notifications(user_id, timestamp DESC);
CREATE INDEX idx_notifications_category ON notifications(category, timestamp DESC);

-- QR Codes
CREATE INDEX idx_qr_codes_station ON qr_codes(station_id);
CREATE INDEX idx_qr_codes_slot_active ON qr_codes(slot_id) WHERE is_active = TRUE;
CREATE INDEX idx_qr_codes_data ON qr_codes(qr_data);

-- ============================================
-- 5. FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_stations_updated_at BEFORE UPDATE ON charging_stations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_posts_updated_at BEFORE UPDATE ON charging_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_slots_updated_at BEFORE UPDATE ON charging_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_payment_methods_updated_at BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_preferences_updated_at BEFORE UPDATE ON customer_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_notification_settings_updated_at BEFORE UPDATE ON notification_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Calculate distance between two points (km)
-- Source: stationStore.js:64-73
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL, lon1 DECIMAL,
    lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    RETURN earth_distance(
        ll_to_earth(lat1, lon1),
        ll_to_earth(lat2, lon2)
    ) / 1000.0; -- Convert meters to km
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_distance IS 'Calculate distance in km between two GPS coordinates';

-- Get current active price for station
CREATE OR REPLACE FUNCTION get_current_price(
    p_station_id UUID,
    p_charging_type charging_rate_type
) RETURNS INTEGER AS $$
DECLARE
    current_rate INTEGER;
BEGIN
    SELECT rate_per_kwh INTO current_rate
    FROM pricing_tiers
    WHERE station_id = p_station_id
      AND charging_type = p_charging_type
      AND effective_from <= NOW()
      AND (effective_to IS NULL OR effective_to > NOW())
    ORDER BY effective_from DESC
    LIMIT 1;
    
    RETURN COALESCE(current_rate, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 7. VIEWS (Commonly Used Queries)
-- ============================================

-- Active bookings with station details
CREATE OR REPLACE VIEW v_active_bookings AS
SELECT 
    b.id,
    b.customer_id,
    u.email as customer_email,
    up.first_name || ' ' || up.last_name as customer_name,
    b.station_id,
    s.name as station_name,
    s.address as station_address,
    b.slot_id,
    cs.slot_identifier,
    cs.connector_type,
    b.status,
    b.scheduled_date_time,
    b.actual_start_time,
    b.qr_scanned,
    b.charging_started,
    st.current_soc_percent,
    st.target_soc_percent,
    st.estimated_time_to_target_minutes,
    b.created_at
FROM bookings b
JOIN users u ON b.customer_id = u.id
JOIN user_profiles up ON u.id = up.user_id
JOIN charging_stations s ON b.station_id = s.id
LEFT JOIN charging_slots cs ON b.slot_id = cs.id
LEFT JOIN soc_tracking st ON b.id = st.booking_id
WHERE b.status IN ('pending', 'scheduled', 'confirmed', 'charging');

COMMENT ON VIEW v_active_bookings IS 'Active bookings with full context for dashboards';

-- Available stations with real-time capacity
CREATE OR REPLACE VIEW v_available_stations AS
SELECT 
    s.id,
    s.name,
    s.address,
    s.latitude,
    s.longitude,
    s.status,
    s.total_ports,
    s.available_ports,
    s.max_power,
    s.connector_types,
    s.parking_fee_per_hour,
    s.rating_overall,
    s.total_reviews,
    CASE 
        WHEN s.operating_hours_close IS NULL THEN '24/7'
        ELSE s.operating_hours_open::TEXT || ' - ' || s.operating_hours_close::TEXT
    END as operating_hours,
    s.images
FROM charging_stations s
WHERE s.status = 'active'
  AND s.available_ports > 0;

COMMENT ON VIEW v_available_stations IS 'Stations with available charging ports';

-- ============================================
-- 8. SECURITY & RLS (Row Level Security)
-- ============================================

-- Enable RLS on sensitive tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Example - adjust based on auth system)
-- Customers can only see their own data
CREATE POLICY customer_own_profile ON user_profiles
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY customer_own_vehicles ON vehicles
    FOR ALL USING (customer_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY customer_own_bookings ON bookings
    FOR ALL USING (customer_id = current_setting('app.current_user_id')::UUID);

-- Staff can see all active bookings
CREATE POLICY staff_view_all_bookings ON bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id')::UUID 
            AND role IN ('staff', 'admin')
        )
    );

-- ============================================
-- END OF SCHEMA
-- ============================================

-- Grant permissions (adjust based on your user roles)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO skaev_app_role;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO skaev_app_role;
