-- ============================================
-- SEED DATA - Development Environment
-- Matching Mock Data 1:1
-- ============================================
--
-- Source: src/data/mockData.js
-- Purpose: Populate database with mock data identical to frontend
--         so application works immediately after migration
--
-- Order: Follow FK dependencies
--
-- ============================================

-- ============================================
-- 1. USERS & PROFILES
-- ============================================

-- Admin Users
-- Source: mockData.js:8-34
INSERT INTO users (id, email, password_hash, role, created_at, last_login_at, email_verified, is_active)
VALUES 
    ('a0000000-0000-0000-0000-000000000001'::UUID, 'admin@skaev.com', 
     crypt('Admin123!', gen_salt('bf', 10)), 'admin', 
     '2024-01-15 08:00:00+07', '2024-03-15 14:30:00+07', TRUE, TRUE),
    ('a0000000-0000-0000-0000-000000000002'::UUID, 'system@skaev.com', 
     crypt('System123!', gen_salt('bf', 10)), 'admin',
     '2024-01-20 09:15:00+07', '2024-03-15 13:45:00+07', TRUE, TRUE);

INSERT INTO user_profiles (user_id, first_name, last_name, phone, avatar_url, permissions)
VALUES
    ('a0000000-0000-0000-0000-000000000001'::UUID, 'Sarah', 'Johnson', '+84 901 234 567',
     '/assets/avatars/admin-sarah.jpg', '["all"]'::jsonb),
    ('a0000000-0000-0000-0000-000000000002'::UUID, 'Michael', 'Chen', '+84 902 345 678',
     '/assets/avatars/admin-michael.jpg', '["users", "stations", "reports"]'::jsonb);

-- Staff Users
-- Source: mockData.js:36-75
INSERT INTO users (id, email, password_hash, role, created_at, last_login_at, email_verified, is_active)
VALUES 
    ('s0000000-0000-0000-0000-000000000001'::UUID, 'staff@skaev.com',
     crypt('Staff123!', gen_salt('bf', 10)), 'staff',
     '2024-01-15 08:30:00+07', '2024-03-15 12:15:00+07', TRUE, TRUE),
    ('s0000000-0000-0000-0000-000000000002'::UUID, 'technician@skaev.com',
     crypt('Tech123!', gen_salt('bf', 10)), 'staff',
     '2024-02-01 09:00:00+07', '2024-03-15 11:30:00+07', TRUE, TRUE);

INSERT INTO user_profiles (user_id, first_name, last_name, phone, avatar_url, permissions,
                           employee_id, department, position, join_date, location)
VALUES
    ('s0000000-0000-0000-0000-000000000001'::UUID, 'Nguyen', 'Van Minh', '+84 906 789 012',
     '/assets/avatars/staff-minh.jpg', '["stations", "maintenance"]'::jsonb,
     'ST001', 'Operations', 'Station Technician', '2024-01-15', 'Hà Nội'),
    ('s0000000-0000-0000-0000-000000000002'::UUID, 'Le', 'Thi Lan', '+84 907 890 123',
     '/assets/avatars/staff-lan.jpg', '["stations", "maintenance", "support"]'::jsonb,
     'ST002', 'Technical Support', 'Senior Technician', '2024-02-01', 'Hồ Chí Minh');

-- Customer Users
-- Source: mockData.js:77-119
INSERT INTO users (id, email, password_hash, role, created_at, last_login_at, email_verified, is_active)
VALUES 
    ('c0000000-0000-0000-0000-000000000001'::UUID, 'nguyenvanan@gmail.com',
     crypt('Customer123!', gen_salt('bf', 10)), 'customer',
     '2024-02-15 14:20:00+07', '2024-03-15 17:30:00+07', TRUE, TRUE),
    ('c0000000-0000-0000-0000-000000000002'::UUID, 'anna.nguyen@outlook.com',
     crypt('Customer456!', gen_salt('bf', 10)), 'customer',
     '2024-02-20 09:45:00+07', '2024-03-15 18:15:00+07', TRUE, TRUE);

INSERT INTO user_profiles (user_id, first_name, last_name, phone, avatar_url)
VALUES
    ('c0000000-0000-0000-0000-000000000001'::UUID, 'Nguyễn Văn', 'An', '+84 905 678 901',
     '/assets/avatars/customer-vanan.jpg'),
    ('c0000000-0000-0000-0000-000000000002'::UUID, 'Anna', 'Nguyen', '+84 906 789 012',
     '/assets/avatars/customer-anna.jpg');

-- Customer Preferences
-- Source: mockData.js:87-91, 102-106
INSERT INTO customer_preferences (customer_id, max_distance_km, preferred_payment_method, 
                                  price_range_min_vnd, price_range_max_vnd)
VALUES
    ('c0000000-0000-0000-0000-000000000001'::UUID, 15, 'credit-card', 5000, 15000),
    ('c0000000-0000-0000-0000-000000000002'::UUID, 20, 'e-wallet', 6000, 12000);

-- ============================================
-- 2. VEHICLES
-- ============================================
-- Source: mockData.js:79-86, 93-100
INSERT INTO vehicles (id, customer_id, nickname, make, model, year, battery_capacity_kwh,
                     max_charging_speed_kw, connector_types, license_plate, color, is_default)
VALUES
    ('v0000000-0000-0000-0000-000000000001'::UUID,
     'c0000000-0000-0000-0000-000000000001'::UUID,
     'Xe chính', 'Tesla', 'Model 3', 2023, 75.0, 250,
     '["Type 2", "CCS2"]'::jsonb, '30A-123.45', 'Trắng', TRUE),
    ('v0000000-0000-0000-0000-000000000002'::UUID,
     'c0000000-0000-0000-0000-000000000002'::UUID,
     'Xe gia đình', 'VinFast', 'VF 8', 2024, 87.7, 150,
     '["Type 2", "CCS2"]'::jsonb, '29B-678.90', 'Xanh', TRUE);

-- ============================================
-- 3. CHARGING STATIONS
-- ============================================
-- Source: mockData.js:130-366

-- Station 1: Green Mall Charging Hub
INSERT INTO charging_stations (id, owner_id, name, type, status, address, latitude, longitude,
                               landmarks, operating_hours_open, operating_hours_close, timezone,
                               total_ports, available_ports, max_power, connector_types,
                               parking_fee_per_hour, rating_overall, rating_cleanliness,
                               rating_availability, rating_speed, total_reviews, images)
VALUES
    ('st000000-0000-0000-0000-000000000001'::UUID, 'system', 'Green Mall Charging Hub',
     'public', 'active', '123 Đường Nguyễn Huệ, Quận 1, Thành phố Hồ Chí Minh',
     10.7769, 106.7009, '["Nguyen Hue Walking Street", "Saigon Centre"]'::jsonb,
     '06:00', '22:00', 'Asia/Ho_Chi_Minh', 6, 4, 150,
     '["Type 2", "CCS2", "CHAdeMO"]'::jsonb, 5000,
     4.6, 4.8, 4.2, 4.7, 156,
     '["/assets/stations/green-mall-1.jpg", "/assets/stations/green-mall-2.jpg"]'::jsonb);

-- Station 2: Tech Park SuperCharger
INSERT INTO charging_stations (id, owner_id, name, type, status, address, latitude, longitude,
                               landmarks, operating_hours_open, operating_hours_close, timezone,
                               total_ports, available_ports, max_power, connector_types,
                               parking_fee_per_hour, rating_overall, rating_cleanliness,
                               rating_availability, rating_speed, total_reviews, images)
VALUES
    ('st000000-0000-0000-0000-000000000002'::UUID, 'system', 'Tech Park SuperCharger',
     'semi-private', 'active', '456 Đường Lê Thánh Tôn, Quận 1, Thành phố Hồ Chí Minh',
     10.7837, 106.6956, '["Bitexco Financial Tower", "Nguyen Hue Boulevard"]'::jsonb,
     '05:30', '23:30', 'Asia/Ho_Chi_Minh', 4, 4, 250,
     '["CCS2", "CHAdeMO"]'::jsonb, 0,
     4.9, 4.9, 4.8, 5.0, 89,
     '["/assets/stations/tech-park-1.jpg", "/assets/stations/tech-park-2.jpg"]'::jsonb);

-- Station 3: EcoPark Charging Station
INSERT INTO charging_stations (id, owner_id, name, type, status, address, latitude, longitude,
                               landmarks, operating_hours_open, operating_hours_close, timezone,
                               total_ports, available_ports, max_power, connector_types,
                               parking_fee_per_hour, rating_overall, rating_cleanliness,
                               rating_availability, rating_speed, total_reviews, images)
VALUES
    ('st000000-0000-0000-0000-000000000003'::UUID, 'system', 'EcoPark Charging Station',
     'public', 'active', '789 Đường Võ Văn Tần, Quận 3, Thành phố Hồ Chí Minh',
     10.7892, 106.6844, '["Tao Dan Park", "War Remnants Museum"]'::jsonb,
     '00:00', NULL, 'Asia/Ho_Chi_Minh', 4, 1, 100,
     '["Type 2", "CCS2"]'::jsonb, 3000,
     4.3, 4.5, 3.8, 4.2, 73,
     '["/assets/stations/ecopark-1.jpg"]'::jsonb);

-- ============================================
-- 4. CHARGING POSTS
-- ============================================
-- Source: mockData.js:149-231

-- Station 1 Posts
INSERT INTO charging_posts (id, station_id, post_identifier, name, type, power_kw, voltage_v,
                           total_slots, available_slots)
VALUES
    ('po000000-0000-0000-0000-000000000001'::UUID, 'st000000-0000-0000-0000-000000000001'::UUID,
     'post-A', 'Trụ AC Tiêu chuẩn', 'AC', 7, 230, 2, 1),
    ('po000000-0000-0000-0000-000000000002'::UUID, 'st000000-0000-0000-0000-000000000001'::UUID,
     'post-B', 'Trụ DC Nhanh', 'DC', 50, 400, 2, 2),
    ('po000000-0000-0000-0000-000000000003'::UUID, 'st000000-0000-0000-0000-000000000001'::UUID,
     'post-C', 'Trụ DC Siêu nhanh', 'DC', 150, 800, 2, 1);

-- Station 2 Posts
INSERT INTO charging_posts (id, station_id, post_identifier, name, type, power_kw, voltage_v,
                           total_slots, available_slots)
VALUES
    ('po000000-0000-0000-0000-000000000004'::UUID, 'st000000-0000-0000-0000-000000000002'::UUID,
     'post-D', 'Trụ DC Ultra', 'DC', 250, 800, 2, 2),
    ('po000000-0000-0000-0000-000000000005'::UUID, 'st000000-0000-0000-0000-000000000002'::UUID,
     'post-E', 'Trụ DC Nhanh+', 'DC', 120, 400, 2, 2);

-- Station 3 Posts
INSERT INTO charging_posts (id, station_id, post_identifier, name, type, power_kw, voltage_v,
                           total_slots, available_slots)
VALUES
    ('po000000-0000-0000-0000-000000000006'::UUID, 'st000000-0000-0000-0000-000000000003'::UUID,
     'post-F', 'Trụ AC Eco', 'AC', 11, 400, 2, 1),
    ('po000000-0000-0000-0000-000000000007'::UUID, 'st000000-0000-0000-0000-000000000003'::UUID,
     'post-G', 'Trụ DC Eco+', 'DC', 100, 500, 2, 0);

-- ============================================
-- 5. CHARGING SLOTS
-- ============================================
-- Source: mockData.js:157-231

-- Station 1 Slots
INSERT INTO charging_slots (id, post_id, slot_identifier, connector_type, status, last_used_at)
VALUES
    ('sl000000-0000-0000-0000-000000000001'::UUID, 'po000000-0000-0000-0000-000000000001'::UUID,
     'A1', 'Type 2', 'available', '2024-12-25 14:30:00+07'),
    ('sl000000-0000-0000-0000-000000000002'::UUID, 'po000000-0000-0000-0000-000000000001'::UUID,
     'A2', 'Type 2', 'occupied', '2024-12-26 08:15:00+07'),
    ('sl000000-0000-0000-0000-000000000003'::UUID, 'po000000-0000-0000-0000-000000000002'::UUID,
     'B1', 'CCS2', 'available', '2024-12-25 12:20:00+07'),
    ('sl000000-0000-0000-0000-000000000004'::UUID, 'po000000-0000-0000-0000-000000000002'::UUID,
     'B2', 'CCS2', 'available', '2024-12-25 18:10:00+07'),
    ('sl000000-0000-0000-0000-000000000005'::UUID, 'po000000-0000-0000-0000-000000000003'::UUID,
     'C1', 'CCS2', 'available', '2024-12-25 10:05:00+07'),
    ('sl000000-0000-0000-0000-000000000006'::UUID, 'po000000-0000-0000-0000-000000000003'::UUID,
     'C2', 'CHAdeMO', 'maintenance', NULL);

-- Station 2 Slots
INSERT INTO charging_slots (id, post_id, slot_identifier, connector_type, status, last_used_at)
VALUES
    ('sl000000-0000-0000-0000-000000000007'::UUID, 'po000000-0000-0000-0000-000000000004'::UUID,
     'D1', 'CCS2', 'available', '2024-12-25 20:30:00+07'),
    ('sl000000-0000-0000-0000-000000000008'::UUID, 'po000000-0000-0000-0000-000000000004'::UUID,
     'D2', 'CCS2', 'available', '2024-12-25 19:15:00+07'),
    ('sl000000-0000-0000-0000-000000000009'::UUID, 'po000000-0000-0000-0000-000000000005'::UUID,
     'E1', 'CCS2', 'available', '2024-12-25 21:00:00+07'),
    ('sl000000-0000-0000-0000-000000000010'::UUID, 'po000000-0000-0000-0000-000000000005'::UUID,
     'E2', 'CHAdeMO', 'available', '2024-12-25 22:30:00+07');

-- Station 3 Slots
INSERT INTO charging_slots (id, post_id, slot_identifier, connector_type, status, last_used_at)
VALUES
    ('sl000000-0000-0000-0000-000000000011'::UUID, 'po000000-0000-0000-0000-000000000006'::UUID,
     'F1', 'Type 2', 'available', '2024-12-25 13:15:00+07'),
    ('sl000000-0000-0000-0000-000000000012'::UUID, 'po000000-0000-0000-0000-000000000006'::UUID,
     'F2', 'Type 2', 'occupied', '2024-12-26 07:30:00+07'),
    ('sl000000-0000-0000-0000-000000000013'::UUID, 'po000000-0000-0000-0000-000000000007'::UUID,
     'G1', 'CCS2', 'occupied', '2024-12-26 09:00:00+07'),
    ('sl000000-0000-0000-0000-000000000014'::UUID, 'po000000-0000-0000-0000-000000000007'::UUID,
     'G2', 'CCS2', 'occupied', '2024-12-26 08:45:00+07');

-- ============================================
-- 6. PRICING TIERS
-- ============================================
-- Source: mockData.js:236-241

-- Station 1 Pricing
INSERT INTO pricing_tiers (station_id, charging_type, rate_per_kwh, effective_from, effective_to)
VALUES
    ('st000000-0000-0000-0000-000000000001'::UUID, 'ac', 8500, '2024-01-01 00:00:00+07', NULL),
    ('st000000-0000-0000-0000-000000000001'::UUID, 'dc', 12000, '2024-01-01 00:00:00+07', NULL),
    ('st000000-0000-0000-0000-000000000001'::UUID, 'dc_ultra', 15000, '2024-01-01 00:00:00+07', NULL);

-- Station 2 Pricing
INSERT INTO pricing_tiers (station_id, charging_type, rate_per_kwh, effective_from, effective_to)
VALUES
    ('st000000-0000-0000-0000-000000000002'::UUID, 'dc', 15000, '2024-01-01 00:00:00+07', NULL),
    ('st000000-0000-0000-0000-000000000002'::UUID, 'dc_ultra', 18000, '2024-01-01 00:00:00+07', NULL);

-- Station 3 Pricing
INSERT INTO pricing_tiers (station_id, charging_type, rate_per_kwh, effective_from, effective_to)
VALUES
    ('st000000-0000-0000-0000-000000000003'::UUID, 'ac', 7500, '2024-01-01 00:00:00+07', NULL),
    ('st000000-0000-0000-0000-000000000003'::UUID, 'dc', 11000, '2024-01-01 00:00:00+07', NULL);

-- ============================================
-- 7. BOOKINGS (Mock History from bookingStore)
-- ============================================
-- Source: bookingStore.js:398-555 (initializeMockData)

INSERT INTO bookings (id, customer_id, station_id, slot_id, status, scheduling_type,
                     actual_start_time, actual_end_time, duration_minutes, energy_delivered_kwh,
                     energy_cost_vnd, parking_cost_vnd, total_amount_vnd, payment_method,
                     payment_status, created_at, completed_at)
VALUES
    -- September 2024 completed bookings
    ('bk000000-0000-0000-0000-000000000001'::UUID, 'c0000000-0000-0000-0000-000000000001'::UUID,
     'st000000-0000-0000-0000-000000000001'::UUID, 'sl000000-0000-0000-0000-000000000001'::UUID,
     'completed', 'immediate', '2024-09-28 10:15:00+07', '2024-09-28 11:00:00+07',
     45, 18.0, 108000, 15426, 123426, 'credit-card', 'paid',
     '2024-09-28 10:15:00+07', '2024-09-28 11:00:00+07'),
    
    ('bk000000-0000-0000-0000-000000000002'::UUID, 'c0000000-0000-0000-0000-000000000001'::UUID,
     'st000000-0000-0000-0000-000000000002'::UUID, 'sl000000-0000-0000-0000-000000000007'::UUID,
     'completed', 'immediate', '2024-09-26 08:30:00+07', '2024-09-26 09:08:00+07',
     38, 15.5, 93000, 13284, 106284, 'credit-card', 'paid',
     '2024-09-26 08:30:00+07', '2024-09-26 09:08:00+07'),
    
    ('bk000000-0000-0000-0000-000000000003'::UUID, 'c0000000-0000-0000-0000-000000000001'::UUID,
     'st000000-0000-0000-0000-000000000003'::UUID, 'sl000000-0000-0000-0000-000000000011'::UUID,
     'completed', 'immediate', '2024-09-24 15:45:00+07', '2024-09-24 16:53:00+07',
     68, 25.0, 150000, 21425, 171425, 'credit-card', 'paid',
     '2024-09-24 15:45:00+07', '2024-09-24 16:53:00+07'),
    
    ('bk000000-0000-0000-0000-000000000004'::UUID, 'c0000000-0000-0000-0000-000000000002'::UUID,
     'st000000-0000-0000-0000-000000000001'::UUID, 'sl000000-0000-0000-0000-000000000003'::UUID,
     'completed', 'immediate', '2024-09-22 11:20:00+07', '2024-09-22 12:15:00+07',
     55, 20.2, 121200, 17311, 138511, 'e-wallet', 'paid',
     '2024-09-22 11:20:00+07', '2024-09-22 12:15:00+07'),
    
    ('bk000000-0000-0000-0000-000000000005'::UUID, 'c0000000-0000-0000-0000-000000000001'::UUID,
     'st000000-0000-0000-0000-000000000002'::UUID, 'sl000000-0000-0000-0000-000000000008'::UUID,
     'completed', 'immediate', '2024-09-20 09:15:00+07', '2024-09-20 10:25:00+07',
     70, 28.0, 168000, 23996, 191996, 'credit-card', 'paid',
     '2024-09-20 09:15:00+07', '2024-09-20 10:25:00+07'),
    
    ('bk000000-0000-0000-0000-000000000006'::UUID, 'c0000000-0000-0000-0000-000000000002'::UUID,
     'st000000-0000-0000-0000-000000000001'::UUID, 'sl000000-0000-0000-0000-000000000004'::UUID,
     'completed', 'immediate', '2024-09-18 13:40:00+07', '2024-09-18 14:30:00+07',
     50, 16.5, 99000, 14141, 113141, 'e-wallet', 'paid',
     '2024-09-18 13:40:00+07', '2024-09-18 14:30:00+07'),
    
    ('bk000000-0000-0000-0000-000000000007'::UUID, 'c0000000-0000-0000-0000-000000000001'::UUID,
     'st000000-0000-0000-0000-000000000003'::UUID, 'sl000000-0000-0000-0000-000000000013'::UUID,
     'completed', 'immediate', '2024-09-16 16:25:00+07', '2024-09-16 17:18:00+07',
     53, 22.0, 132000, 18854, 150854, 'credit-card', 'paid',
     '2024-09-16 16:25:00+07', '2024-09-16 17:18:00+07'),
    
    ('bk000000-0000-0000-0000-000000000008'::UUID, 'c0000000-0000-0000-0000-000000000001'::UUID,
     'st000000-0000-0000-0000-000000000002'::UUID, 'sl000000-0000-0000-0000-000000000009'::UUID,
     'completed', 'immediate', '2024-09-14 12:10:00+07', '2024-09-14 13:05:00+07',
     55, 24.0, 144000, 20568, 164568, 'credit-card', 'paid',
     '2024-09-14 12:10:00+07', '2024-09-14 13:05:00+07'),
    
    ('bk000000-0000-0000-0000-000000000009'::UUID, 'c0000000-0000-0000-0000-000000000002'::UUID,
     'st000000-0000-0000-0000-000000000001'::UUID, 'sl000000-0000-0000-0000-000000000005'::UUID,
     'completed', 'immediate', '2024-09-12 07:55:00+07', '2024-09-12 08:42:00+07',
     47, 20.8, 124800, 17826, 142626, 'e-wallet', 'paid',
     '2024-09-12 07:55:00+07', '2024-09-12 08:42:00+07'),
    
    ('bk000000-0000-0000-0000-000000000010'::UUID, 'c0000000-0000-0000-0000-000000000001'::UUID,
     'st000000-0000-0000-0000-000000000003'::UUID, 'sl000000-0000-0000-0000-000000000014'::UUID,
     'completed', 'immediate', '2024-09-10 14:30:00+07', '2024-09-10 15:28:00+07',
     58, 20.0, 120000, 17140, 137140, 'credit-card', 'paid',
     '2024-09-10 14:30:00+07', '2024-09-10 15:28:00+07'),
    
    ('bk000000-0000-0000-0000-000000000011'::UUID, 'c0000000-0000-0000-0000-000000000002'::UUID,
     'st000000-0000-0000-0000-000000000002'::UUID, 'sl000000-0000-0000-0000-000000000010'::UUID,
     'completed', 'immediate', '2024-09-08 10:45:00+07', '2024-09-08 11:33:00+07',
     48, 17.0, 102000, 14569, 116569, 'e-wallet', 'paid',
     '2024-09-08 10:45:00+07', '2024-09-08 11:33:00+07'),
    
    ('bk000000-0000-0000-0000-000000000012'::UUID, 'c0000000-0000-0000-0000-000000000001'::UUID,
     'st000000-0000-0000-0000-000000000001'::UUID, 'sl000000-0000-0000-0000-000000000001'::UUID,
     'completed', 'immediate', '2024-09-06 18:15:00+07', '2024-09-06 19:10:00+07',
     55, 18.0, 108000, 15426, 123426, 'credit-card', 'paid',
     '2024-09-06 18:15:00+07', '2024-09-06 19:10:00+07'),
    
    -- Cancelled booking
    ('bk000000-0000-0000-0000-000000000013'::UUID, 'c0000000-0000-0000-0000-000000000001'::UUID,
     'st000000-0000-0000-0000-000000000002'::UUID, NULL,
     'cancelled', 'scheduled', NULL, NULL, 0, 0, 0, 0, 0, NULL, NULL,
     '2024-09-05 08:15:00+07', NULL);

-- Update slot current_booking_id for occupied slots
UPDATE charging_slots SET current_booking_id = 'bk000000-0000-0000-0000-000000000002'::UUID
WHERE id = 'sl000000-0000-0000-0000-000000000002'::UUID;

UPDATE charging_slots SET current_booking_id = 'bk000000-0000-0000-0000-000000000012'::UUID
WHERE id = 'sl000000-0000-0000-0000-000000000012'::UUID;

-- ============================================
-- 8. PAYMENT METHODS
-- ============================================
-- Source: mockData.js:512-533

INSERT INTO payment_methods (id, customer_id, type, provider, last_four_digits, expiry_month,
                            expiry_year, is_default, nickname, is_active)
VALUES
    ('pm000000-0000-0000-0000-000000000001'::UUID, 'c0000000-0000-0000-0000-000000000001'::UUID,
     'credit-card', 'visa', '4567', 12, 2026, TRUE, 'Personal Visa', TRUE);

INSERT INTO payment_methods (id, customer_id, type, provider, identifier, is_default, nickname, is_active)
VALUES
    ('pm000000-0000-0000-0000-000000000002'::UUID, 'c0000000-0000-0000-0000-000000000002'::UUID,
     'e-wallet', 'momo', '+84906789012', TRUE, 'MoMo Wallet', TRUE);

-- ============================================
-- 9. INVOICES
-- ============================================
-- Generate invoices for completed bookings

INSERT INTO invoices (id, invoice_number, booking_id, customer_id, invoice_date,
                     subtotal_vnd, tax_vnd, total_vnd, status)
SELECT 
    uuid_generate_v4(),
    'INV-2024-09-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 3, '0'),
    id,
    customer_id,
    created_at::DATE,
    ROUND(total_amount_vnd / 1.1),  -- Subtract 10% VAT
    ROUND(total_amount_vnd - (total_amount_vnd / 1.1)),
    total_amount_vnd,
    'paid'
FROM bookings
WHERE status = 'completed';

-- ============================================
-- 10. NOTIFICATION SETTINGS (Default for all users)
-- ============================================

INSERT INTO notification_settings (user_id, browser_enabled, email_enabled, sms_enabled,
                                   sound_enabled, charging_enabled, booking_enabled,
                                   payment_enabled, maintenance_enabled)
SELECT id, TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, TRUE, FALSE
FROM users;

-- ============================================
-- 11. QR CODES (Generate for all slots)
-- ============================================
-- Source: mockAPI.js:645-677

INSERT INTO qr_codes (id, station_id, slot_id, qr_data, generated_at, is_active)
SELECT 
    uuid_generate_v4(),
    s.station_id,
    cs.id,
    'SKAEV:STATION:' || s.station_id || ':' || cs.slot_identifier,
    NOW(),
    TRUE
FROM charging_slots cs
JOIN charging_posts cp ON cs.post_id = cp.id
JOIN charging_stations s ON cp.station_id = s.id;

-- ============================================
-- 12. SAMPLE NOTIFICATIONS
-- ============================================

INSERT INTO notifications (id, user_id, type, category, title, message, priority, read, timestamp)
VALUES
    (uuid_generate_v4(), 'c0000000-0000-0000-0000-000000000001'::UUID,
     'success', 'charging', 'Charging Complete! ⚡',
     'Your vehicle at Green Mall Charging Hub is fully charged. Energy delivered: 18.0kWh',
     'high', TRUE, '2024-09-28 11:00:00+07'),
    
    (uuid_generate_v4(), 'c0000000-0000-0000-0000-000000000001'::UUID,
     'info', 'booking', 'Booking Reminder 📅',
     'Your charging session starts in 15 minutes at Tech Park SuperCharger',
     'medium', FALSE, NOW());

-- ============================================
-- 13. VERIFY DATA INTEGRITY
-- ============================================

-- Check counts
SELECT 'Users' as entity, COUNT(*) as count FROM users
UNION ALL
SELECT 'Stations', COUNT(*) FROM charging_stations
UNION ALL
SELECT 'Charging Posts', COUNT(*) FROM charging_posts
UNION ALL
SELECT 'Charging Slots', COUNT(*) FROM charging_slots
UNION ALL
SELECT 'Vehicles', COUNT(*) FROM vehicles
UNION ALL
SELECT 'Bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'Invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'Payment Methods', COUNT(*) FROM payment_methods
UNION ALL
SELECT 'QR Codes', COUNT(*) FROM qr_codes;

-- Verify available slots match calculated value
SELECT 
    s.name,
    s.available_ports as reported,
    COUNT(cs.id) FILTER (WHERE cs.status = 'available') as actual_available
FROM charging_stations s
JOIN charging_posts cp ON s.id = cp.station_id
JOIN charging_slots cs ON cp.id = cs.post_id
GROUP BY s.id, s.name, s.available_ports;

-- ============================================
-- END OF SEED DATA
-- ============================================

-- Sample queries to test:

-- 1. Find nearby stations
SELECT 
    name, 
    address, 
    calculate_distance(10.7769, 106.7009, latitude, longitude) as distance_km,
    available_ports,
    connector_types
FROM charging_stations
WHERE status = 'active'
  AND calculate_distance(10.7769, 106.7009, latitude, longitude) <= 10
ORDER BY distance_km;

-- 2. Customer booking history with energy and cost
SELECT 
    b.id,
    s.name as station_name,
    b.actual_start_time,
    b.energy_delivered_kwh,
    b.total_amount_vnd,
    b.status
FROM bookings b
JOIN charging_stations s ON b.station_id = s.id
WHERE b.customer_id = 'c0000000-0000-0000-0000-000000000001'::UUID
ORDER BY b.created_at DESC;

-- 3. Station utilization
SELECT 
    s.name,
    s.total_ports,
    s.available_ports,
    ROUND(100.0 * (s.total_ports - s.available_ports) / s.total_ports, 2) as utilization_percent
FROM charging_stations s
WHERE s.status = 'active';
